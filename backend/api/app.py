"""FastAPI application entrypoint."""

import asyncio
import json
import logging
from contextlib import asynccontextmanager
from dataclasses import asdict
from datetime import datetime, timezone
from typing import AsyncIterator

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func as sqlfunc, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.admin import router as admin_router
from backend.api.auth import (
    UserCreate,
    UserRead,
    UserUpdate,
    auth_backend,
    current_active_user,
    fastapi_users_instance,
    optional_current_user,
)
from backend.api.sessions import router as sessions_router
from backend.api.shared import router as shared_router
from backend.api.schemas import ConsultRequest, ConsultResponse
from backend.config import AppConfig
from backend.consensus.models import DebateSession
from backend.consensus.engine import ConsensusEngine
from backend.consensus.costs import load_live_prices
from backend.consensus.export_title import build_export_title_prompt, normalize_export_title
from backend.consensus.llm_clients import call_openrouter
from backend.storage.database import _get_session_maker, get_async_session
from backend.storage.db_models import Run, User
from backend.storage.db_session_store import save_session as save_session_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

CFG = AppConfig()


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncIterator[None]:
    await load_live_prices(CFG.openrouter_api_key, CFG.openrouter_base_url)
    yield


app = FastAPI(title="TeamStoa API", lifespan=_lifespan)
_origins = [o.strip() for o in CFG.allowed_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
ENGINE = ConsensusEngine(CFG)

# ── Auth routers ──────────────────────────────────────────────────────────────
app.include_router(
    fastapi_users_instance.get_auth_router(auth_backend),
    prefix="/api/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users_instance.get_register_router(UserRead, UserCreate),
    prefix="/api/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users_instance.get_reset_password_router(),
    prefix="/api/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users_instance.get_verify_router(UserRead),
    prefix="/api/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users_instance.get_users_router(UserRead, UserUpdate),
    prefix="/api/users",
    tags=["users"],
)
app.include_router(sessions_router)
app.include_router(shared_router)
app.include_router(admin_router)


# ── Extended /api/me — user profile + usage ───────────────────────────────────

@app.get("/api/me")
async def me(
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> dict:
    """Return the current user's profile, usage info, and run stats."""
    total_runs = await db.scalar(select(sqlfunc.count()).where(Run.user_id == user.id)) or 0
    return {
        "id": str(user.id),
        "email": user.email,
        "display_name": user.display_name,
        "is_superuser": user.is_superuser,
        "is_verified": user.is_verified,
        "runs_this_month": user.runs_this_month,
        "runs_quota": None if user.is_superuser else CFG.free_tier_quota,
        "total_runs": total_runs,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


# ── Quota helpers ─────────────────────────────────────────────────────────────

async def _check_and_increment_quota(user: User) -> None:
    """Raise 429 if user is over quota; otherwise increment their monthly counter."""
    if user.is_superuser:
        return
    async with _get_session_maker()() as db:
        result = await db.execute(select(User).where(User.id == user.id))
        fresh = result.scalar_one_or_none()
        if fresh is None:
            return
        now = datetime.now(timezone.utc)
        reset_needed = (
            fresh.runs_reset_at is None
            or fresh.runs_reset_at.year != now.year
            or fresh.runs_reset_at.month != now.month
        )
        if reset_needed:
            fresh.runs_this_month = 0
            fresh.runs_reset_at = now
        if fresh.runs_this_month >= CFG.free_tier_quota:
            raise HTTPException(
                status_code=429,
                detail=(
                    f"You have used all {CFG.free_tier_quota} runs for this month. "
                    "Upgrade to Pro for unlimited runs."
                ),
            )
        fresh.runs_this_month += 1
        await db.commit()


# ── Response builder ──────────────────────────────────────────────────────────

def _to_response(session: DebateSession) -> ConsultResponse:
    return ConsultResponse(
        session_id=session.session_id,
        question=session.question,
        role=session.domain,
        final_answer=session.final_answer,
        final_score=session.final_score,
        cost_hint="Displayed as estimated by selected model rates.",
        full_discussion=[asdict(item) for item in session.rounds],
        status="needs_clarification" if session.needs_clarification else "completed",
        needs_clarification=session.needs_clarification,
        clarification_question=session.clarification_question,
        clarification_reason=session.clarification_reason,
        clarification_options=session.clarification_options,
        model_costs=session.model_costs,
        total_duration_seconds=session.total_duration_seconds,
        phase_timings=session.phase_timings,
        model_writers=session.model_writers,
        model_critics=session.model_critics,
        writer_names=session.writer_names,
        critic_names=session.critic_names,
        writer_roles=session.writer_roles,
        critic_roles=session.critic_roles,
        total_cost_usd=session.total_cost_usd,
        total_tokens=session.total_tokens,
        thread_id=session.thread_id,
        parent_session_id=session.parent_session_id,
        is_followup=session.is_followup,
        root_question=session.root_question,
        source_prompt=session.source_prompt,
        source_final_answer=session.source_final_answer,
        followup_instruction=session.followup_instruction,
        base_question=session.base_question,
        attachment_files=session.attachment_files,
        web_search_mode=session.web_search_mode,
        answer_mode=session.answer_mode,
        web_search_performed=session.web_search_performed,
        web_search_query=session.web_search_query,
        web_search_retrieved_at=session.web_search_retrieved_at,
        web_search_sources=session.web_search_sources,
        web_search_summary=session.web_search_summary,
        web_search_warning=session.web_search_warning,
        clarification_response=session.clarification_response,
    )


class TitleRequest(BaseModel):
    question: str
    role: str = ""


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/api/title")
async def generate_title(payload: TitleRequest) -> dict:
    q = payload.question[:2000]
    r = (payload.role or "")[:600]
    prompt = build_export_title_prompt(q, r)
    try:
        raw = await call_openrouter(prompt, CFG.export_title_model, CFG)
        title = normalize_export_title(raw, q)
        return {"title": title}
    except Exception:
        return {"title": normalize_export_title("", q)}


@app.post("/api/consult", response_model=ConsultResponse)
async def consult(
    payload: ConsultRequest,
    user: User | None = Depends(optional_current_user),
) -> ConsultResponse:
    if user:
        await _check_and_increment_quota(user)
    session = await ENGINE.consult(
        question=payload.question,
        domain=payload.role,
        writers=payload.writers,
        critics=payload.critics,
        max_rounds=payload.max_rounds,
        threshold=payload.consensus_score,
        clarification=payload.clarification,
        clarification_question_asked=payload.clarification_question,
        attachments=payload.attachments,
        is_followup=payload.is_followup,
        parent_session_id=payload.parent_session_id,
        thread_id=payload.thread_id,
        root_question=payload.root_question,
        source_prompt=payload.source_prompt,
        source_final_answer=payload.source_final_answer,
        followup_instruction=payload.followup_instruction,
        writer_names=payload.writer_names,
        critic_names=payload.critic_names,
        writer_roles=payload.writer_roles,
        critic_roles=payload.critic_roles,
        web_search_mode=payload.web_search_mode,
        answer_mode=payload.answer_mode,
    )
    async with _get_session_maker()() as db:
        await save_session_db(session, db, user_id=user.id if user else None)
    return _to_response(session)


@app.post("/api/consult-stream")
async def consult_stream(
    payload: ConsultRequest,
    user: User | None = Depends(optional_current_user),
) -> StreamingResponse:
    """Stream activity events and final payload as NDJSON."""
    if user:
        await _check_and_increment_quota(user)

    queue: asyncio.Queue[dict] = asyncio.Queue()
    user_id = user.id if user else None

    async def activity(message: str) -> None:
        await queue.put({"type": "activity", "message": message})

    async def worker() -> None:
        try:
            session = await ENGINE.consult(
                question=payload.question,
                domain=payload.role,
                writers=payload.writers,
                critics=payload.critics,
                max_rounds=payload.max_rounds,
                threshold=payload.consensus_score,
                clarification=payload.clarification,
                clarification_question_asked=payload.clarification_question,
                attachments=payload.attachments,
                is_followup=payload.is_followup,
                parent_session_id=payload.parent_session_id,
                thread_id=payload.thread_id,
                root_question=payload.root_question,
                source_prompt=payload.source_prompt,
                source_final_answer=payload.source_final_answer,
                followup_instruction=payload.followup_instruction,
                writer_names=payload.writer_names,
                critic_names=payload.critic_names,
                writer_roles=payload.writer_roles,
                critic_roles=payload.critic_roles,
                web_search_mode=payload.web_search_mode,
                answer_mode=payload.answer_mode,
                progress_hook=activity,
            )
            async with _get_session_maker()() as db:
                await save_session_db(session, db, user_id=user_id)
            await queue.put({"type": "final", "data": _to_response(session).model_dump()})
        finally:
            await queue.put({"type": "done"})

    asyncio.create_task(worker())

    async def stream():
        while True:
            item = await queue.get()
            yield json.dumps(item) + "\n"
            if item["type"] == "done":
                break

    return StreamingResponse(stream(), media_type="application/x-ndjson")

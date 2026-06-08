"""FastAPI application entrypoint."""

import asyncio
import json
import logging
from dataclasses import asdict

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.api.auth import (
    UserCreate,
    UserRead,
    UserUpdate,
    auth_backend,
    fastapi_users_instance,
    optional_current_user,
)
from backend.api.sessions import router as sessions_router
from backend.api.schemas import ConsultRequest, ConsultResponse
from backend.config import AppConfig
from backend.consensus.models import DebateSession
from backend.consensus.engine import ConsensusEngine
from backend.consensus.costs import load_live_prices
from backend.consensus.export_title import build_export_title_prompt, normalize_export_title
from backend.consensus.llm_clients import call_openrouter
from backend.storage.database import _get_session_maker
from backend.storage.db_models import User
from backend.storage.db_session_store import save_session as save_session_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

app = FastAPI(title="Multi-LLM Consensus API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CFG = AppConfig()
ENGINE = ConsensusEngine(CFG)

# ── Auth routers (register, login, logout, /users/me) ────────────────────────
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
    fastapi_users_instance.get_users_router(UserRead, UserUpdate),
    prefix="/api/users",
    tags=["users"],
)

app.include_router(sessions_router)


@app.on_event("startup")
async def _startup() -> None:
    await load_live_prices(CFG.openrouter_api_key, CFG.openrouter_base_url)


def _to_response(session: DebateSession) -> ConsultResponse:
    """Convert session object to API response schema."""
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
        model_writers=session.model_writers,
        model_critics=session.model_critics,
        writer_names=session.writer_names,
        critic_names=session.critic_names,
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
    """Generate a short (3-6 word) lowercase title from task + role."""
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
    """Run consensus session and return final result plus rounds."""
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

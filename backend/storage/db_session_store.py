"""Database-backed session store — replaces the JSON file session_store.py."""

from __future__ import annotations

import re
import secrets
import uuid
from dataclasses import fields

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.consensus.models import DebateRound, DebateSession
from backend.storage.db_models import Output, Run, TeamConfig

_ROUND_FIELDS = {f.name for f in fields(DebateRound)}
_SESSION_FIELDS = {f.name for f in fields(DebateSession)}


async def save_session(
    session: DebateSession,
    db: AsyncSession,
    user_id: uuid.UUID | None = None,
) -> None:
    """Persist a DebateSession to the database (insert or update).

    Clarification stubs (needs_clarification=True with no final_answer) are not
    persisted — the frontend resolves them client-side and re-submits, and the
    resolved run already records clarification_question/clarification_response.
    """
    if session.needs_clarification and not session.final_answer.strip():
        return

    result = await db.execute(select(Run).where(Run.session_id == session.session_id))
    run = result.scalar_one_or_none()

    title = (session.followup_instruction or session.question or "")[:256]

    if run is None:
        run = Run(
            user_id=user_id,
            session_id=session.session_id,
            title=title,
            prompt=session.question,
            status="done",
            thread_id=session.thread_id or session.session_id,
            parent_session_id=session.parent_session_id or "",
            is_followup=session.is_followup,
        )
        db.add(run)
        await db.flush()
    else:
        run.title = title
        run.status = "done"
        if user_id and run.user_id is None:
            run.user_id = user_id

    session_dict = session.to_dict()

    result = await db.execute(select(Output).where(Output.run_id == run.id))
    output = result.scalar_one_or_none()

    if output is None:
        output = Output(
            run_id=run.id,
            final_answer_markdown=session.final_answer or "",
            debate_logs_json=session_dict.get("rounds", []),
            score=session.final_score,
            tokens=session.total_tokens,
            cost=session.total_cost_usd,
            model_costs_json=session.model_costs,
            full_session_json=session_dict,
        )
        db.add(output)
    else:
        output.final_answer_markdown = session.final_answer or ""
        output.debate_logs_json = session_dict.get("rounds", [])
        output.score = session.final_score
        output.tokens = session.total_tokens
        output.cost = session.total_cost_usd
        output.model_costs_json = session.model_costs
        output.full_session_json = session_dict

    result = await db.execute(select(TeamConfig).where(TeamConfig.run_id == run.id))
    tc = result.scalar_one_or_none()
    members = {
        "writers": session.model_writers,
        "critics": session.model_critics,
        "writer_names": session.writer_names,
        "critic_names": session.critic_names,
        "writer_roles": session.writer_roles,
        "critic_roles": session.critic_roles,
    }
    if tc is None:
        db.add(TeamConfig(run_id=run.id, members_json=members))
    else:
        tc.members_json = members

    await db.commit()


async def load_session(
    session_id: str,
    db: AsyncSession,
    user_id: uuid.UUID | None = None,
) -> DebateSession:
    """Reconstruct a DebateSession from the database.

    Pass user_id to enforce ownership — raises FileNotFoundError (same as
    missing) so callers cannot probe for other users' session IDs.
    """
    result = await db.execute(select(Run).where(Run.session_id == session_id))
    run = result.scalar_one_or_none()
    if run is None:
        raise FileNotFoundError(f"Session {session_id!r} not found")
    if user_id is not None and run.user_id != user_id:
        raise FileNotFoundError(f"Session {session_id!r} not found")

    result = await db.execute(select(Output).where(Output.run_id == run.id))
    output = result.scalar_one_or_none()
    if output is None:
        raise FileNotFoundError(f"Output for session {session_id!r} not found")

    payload: dict = output.full_session_json

    # Promote legacy model field names (same logic as session_store.py)
    if not payload.get("model_writers"):
        if payload.get("writer_models"):
            payload["model_writers"] = payload["writer_models"]
        elif payload.get("model_writer"):
            payload["model_writers"] = [payload["model_writer"]]
    if not payload.get("model_critics"):
        if payload.get("critic_models"):
            payload["model_critics"] = payload["critic_models"]
        else:
            payload["model_critics"] = [
                m for m in [payload.get("model_critic_a", ""), payload.get("model_critic_b", "")] if m
            ]

    rounds = [
        DebateRound(**{k: v for k, v in item.items() if k in _ROUND_FIELDS})
        for item in payload.get("rounds", [])
    ]
    filtered = {k: v for k, v in payload.items() if k in _SESSION_FIELDS}
    filtered["rounds"] = rounds
    return DebateSession(**filtered)


async def list_sessions(
    db: AsyncSession,
    user_id: uuid.UUID | None = None,
) -> list[dict]:
    """Return session metadata sorted newest first, optionally scoped by user."""
    stmt = select(Run).order_by(Run.created_at.desc())
    if user_id is not None:
        stmt = stmt.where(Run.user_id == user_id)

    runs = (await db.execute(stmt)).scalars().all()

    # The sidebar shows a team-template badge per session using team_template_id below,
    # without loading each session's full result. Sessions saved before that field
    # existed have none, so for those rows only, the raw writer/critic cast is also
    # included as legacy_cast — letting the frontend infer a template the same way the
    # main saved-answer view already does. Every session going forward stays lean
    # (team_template_id alone, legacy_cast empty).
    rows: list[dict] = []
    for run in runs:
        output_result = await db.execute(select(Output).where(Output.run_id == run.id))
        output = output_result.scalar_one_or_none()
        team_template_id = ""
        legacy_cast: dict = {}
        if output:
            payload = output.full_session_json
            is_stub = bool(payload.get("needs_clarification")) and not bool(
                str(payload.get("final_answer", "")).strip()
            )
            if is_stub:
                continue
            team_template_id = payload.get("team_template_id", "")
            if not team_template_id:
                legacy_cast = {
                    "writer_names": payload.get("writer_names", []),
                    "critic_names": payload.get("critic_names", []),
                    "model_writers": payload.get("model_writers", []),
                    "model_critics": payload.get("model_critics", []),
                }
        rows.append({
            "session_id": run.session_id,
            "question": run.prompt,
            "timestamp": run.created_at.isoformat(),
            "thread_id": run.thread_id or run.session_id,
            "parent_session_id": run.parent_session_id or "",
            "is_followup": run.is_followup,
            "run_title": run.title,
            "team_template_id": team_template_id,
            **legacy_cast,
        })
    return rows


async def delete_session(
    session_id: str,
    db: AsyncSession,
    user_id: uuid.UUID | None = None,
) -> bool:
    """Delete a session and all its related records.

    Pass user_id to enforce ownership — returns False (not 404) when the
    session exists but belongs to a different user, so callers cannot probe
    for other users' session IDs.
    """
    result = await db.execute(select(Run).where(Run.session_id == session_id))
    run = result.scalar_one_or_none()
    if run is None:
        return False
    if user_id is not None and run.user_id != user_id:
        return False
    await db.delete(run)  # ORM delete — fires cascade on TeamConfig, Output, File
    await db.commit()
    return True


def _slugify(text: str) -> str:
    """Lowercase, hyphen-separated slug from arbitrary text, capped at 60 chars."""
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug[:60] or "consensus-result"


async def get_share_info(
    session_id: str,
    db: AsyncSession,
    user_id: uuid.UUID | None = None,
) -> tuple[str, str | None] | None:
    """Return (visibility, public_slug) for a session, or None if not found/not owned."""
    result = await db.execute(select(Run).where(Run.session_id == session_id))
    run = result.scalar_one_or_none()
    if run is None:
        return None
    if user_id is not None and run.user_id != user_id:
        return None
    return run.visibility, run.public_slug


async def share_session(
    session_id: str,
    db: AsyncSession,
    user_id: uuid.UUID | None = None,
) -> str | None:
    """Mark a run public and return its slug, generating one if needed.

    Pass user_id to enforce ownership — returns None when the session is not
    found or belongs to a different user.
    """
    result = await db.execute(select(Run).where(Run.session_id == session_id))
    run = result.scalar_one_or_none()
    if run is None:
        return None
    if user_id is not None and run.user_id != user_id:
        return None

    if run.visibility == "public" and run.public_slug:
        return run.public_slug

    base = _slugify(run.title or run.prompt)
    slug = f"{base}-{secrets.token_hex(3)}"
    for _ in range(5):
        existing = await db.execute(select(Run).where(Run.public_slug == slug))
        if existing.scalar_one_or_none() is None:
            break
        slug = f"{base}-{secrets.token_hex(3)}"

    run.visibility = "public"
    run.public_slug = slug
    await db.commit()
    return slug


async def unshare_session(
    session_id: str,
    db: AsyncSession,
    user_id: uuid.UUID | None = None,
) -> bool:
    """Mark a run private and clear its slug.

    Pass user_id to enforce ownership — returns False (not 404) when the
    session exists but belongs to a different user.
    """
    result = await db.execute(select(Run).where(Run.session_id == session_id))
    run = result.scalar_one_or_none()
    if run is None:
        return False
    if user_id is not None and run.user_id != user_id:
        return False

    run.visibility = "private"
    run.public_slug = None
    await db.commit()
    return True


async def load_shared_session(slug: str, db: AsyncSession) -> DebateSession | None:
    """Load a session by its public slug — returns None unless visibility is public."""
    result = await db.execute(
        select(Run).where(Run.public_slug == slug, Run.visibility == "public")
    )
    run = result.scalar_one_or_none()
    if run is None:
        return None
    return await load_session(run.session_id, db)

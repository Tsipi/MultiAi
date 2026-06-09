"""Database-backed session store — replaces the JSON file session_store.py."""

from __future__ import annotations

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
    """Persist a DebateSession to the database (insert or update)."""
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

    rows: list[dict] = []
    for run in runs:
        output_result = await db.execute(select(Output).where(Output.run_id == run.id))
        output = output_result.scalar_one_or_none()
        if output:
            payload = output.full_session_json
            is_stub = bool(payload.get("needs_clarification")) and not bool(
                str(payload.get("final_answer", "")).strip()
            )
            if is_stub:
                continue
        rows.append({
            "session_id": run.session_id,
            "question": run.prompt,
            "timestamp": run.created_at.isoformat(),
            "thread_id": run.thread_id or run.session_id,
            "parent_session_id": run.parent_session_id or "",
            "is_followup": run.is_followup,
            "run_title": run.title,
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

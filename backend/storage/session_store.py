"""Session persistence helpers."""

from __future__ import annotations

import json
from dataclasses import fields
from pathlib import Path

from backend.consensus.models import DebateRound, DebateSession

_ROUND_FIELDS = {f.name for f in fields(DebateRound)}
_SESSION_FIELDS = {f.name for f in fields(DebateSession)}


def save_session(session: DebateSession, sessions_dir: Path) -> Path:
    """Persist debate session to a JSON file."""
    sessions_dir.mkdir(parents=True, exist_ok=True)
    output = sessions_dir / f"{session.session_id}.json"
    output.write_text(json.dumps(session.to_dict(), indent=2), encoding="utf-8")
    return output


def load_session(session_id: str, sessions_dir: Path) -> DebateSession:
    """Load debate session and rebuild dataclasses.

    Strips unknown keys and tolerates missing optional fields so that JSON
    files written by older schema versions still load without error.
    """
    payload = json.loads((sessions_dir / f"{session_id}.json").read_text(encoding="utf-8"))
    # Promote legacy model fields → canonical list fields (for old session JSON formats)
    if not payload.get("model_writers"):
        if payload.get("writer_models"):          # very old: writer_models list
            payload["model_writers"] = payload["writer_models"]
        elif payload.get("model_writer"):         # old: single model_writer string
            payload["model_writers"] = [payload["model_writer"]]
    if not payload.get("model_critics"):
        if payload.get("critic_models"):          # very old: critic_models list
            payload["model_critics"] = payload["critic_models"]
        else:                                     # old: model_critic_a / model_critic_b strings
            payload["model_critics"] = [m for m in [payload.get("model_critic_a", ""), payload.get("model_critic_b", "")] if m]
    rounds = [
        DebateRound(**{k: v for k, v in item.items() if k in _ROUND_FIELDS})
        for item in payload.get("rounds", [])
    ]
    filtered = {k: v for k, v in payload.items() if k in _SESSION_FIELDS}
    filtered["rounds"] = rounds
    return DebateSession(**filtered)


def list_sessions(sessions_dir: Path) -> list[dict]:
    """Return saved session metadata sorted newest first.

    Clarification stubs (no final answer yet) are hidden from sidebar history.
    """
    sessions_dir.mkdir(parents=True, exist_ok=True)
    rows: list[dict] = []
    for file in sorted(sessions_dir.glob("*.json"), reverse=True):
        try:
            payload = json.loads(file.read_text(encoding="utf-8"))
            is_stub = bool(payload.get("needs_clarification")) and not bool(
                str(payload.get("final_answer", "")).strip()
            )
            if is_stub:
                continue
            rows.append(
                {
                    "session_id": payload.get("session_id", file.stem),
                    "question": payload.get("question", ""),
                    "timestamp": payload.get("timestamp", ""),
                    "thread_id": payload.get("thread_id", payload.get("session_id", file.stem)),
                    "parent_session_id": payload.get("parent_session_id", ""),
                    "is_followup": bool(payload.get("is_followup", False)),
                    "run_title": payload.get("followup_instruction", "") or payload.get("question", ""),
                }
            )
        except Exception:  # noqa: BLE001
            continue
    return rows


def delete_session(session_id: str, sessions_dir: Path) -> bool:
    """Delete one saved session file if present."""
    file = sessions_dir / f"{session_id}.json"
    try:
        file.unlink()
        return True
    except FileNotFoundError:
        return False

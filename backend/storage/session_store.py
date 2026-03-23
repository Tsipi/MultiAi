"""Session persistence helpers."""

from __future__ import annotations

import json
from pathlib import Path

from backend.consensus.models import DebateRound, DebateSession


def save_session(session: DebateSession, sessions_dir: Path) -> Path:
    """Persist debate session to a JSON file."""
    sessions_dir.mkdir(parents=True, exist_ok=True)
    output = sessions_dir / f"{session.session_id}.json"
    output.write_text(json.dumps(session.to_dict(), indent=2), encoding="utf-8")
    return output


def load_session(session_id: str, sessions_dir: Path) -> DebateSession:
    """Load debate session and rebuild dataclasses."""
    payload = json.loads((sessions_dir / f"{session_id}.json").read_text(encoding="utf-8"))
    rounds = [DebateRound(**item) for item in payload.get("rounds", [])]
    payload["rounds"] = rounds
    return DebateSession(**payload)


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
    if not file.exists():
        return False
    file.unlink(missing_ok=True)
    return True

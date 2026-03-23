"""Tests for JSON session store."""

from pathlib import Path

from backend.consensus.models import DebateRound, DebateSession
from backend.storage.session_store import load_session, save_session


def test_save_and_load_roundtrip(tmp_path: Path):
    """Saves and loads a DebateSession dataclass."""
    session = DebateSession(
        session_id="20260315_200000",
        question="Q",
        domain="Role",
        rounds=[DebateRound(1, "a", "b", 8.0, "ok", "sum")],
        final_answer="final",
        final_score=8.0,
    )
    save_session(session, tmp_path)
    loaded = load_session("20260315_200000", tmp_path)
    assert loaded.session_id == session.session_id
    assert loaded.rounds[0].summary == "sum"

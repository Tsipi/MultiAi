"""Tests for JSON session store."""

import json
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


def test_load_legacy_session_without_list_fields(tmp_path: Path):
    """Old sessions with model_writer/model_critic_a/model_critic_b but no list fields load cleanly."""
    legacy = {
        "session_id": "20250101_120000",
        "question": "legacy question",
        "domain": "general",
        "rounds": [],
        "final_answer": "done",
        "final_score": 8.0,
        "timestamp": "2025-01-01T12:00:00",
        "model_writer": "openai/gpt-4",
        "model_critic_a": "anthropic/claude-3",
        "model_critic_b": "google/gemini-pro",
        # model_writers and model_critics intentionally absent
    }
    (tmp_path / "20250101_120000.json").write_text(json.dumps(legacy), encoding="utf-8")
    loaded = load_session("20250101_120000", tmp_path)
    assert loaded.session_id == "20250101_120000"
    assert loaded.model_writer == "openai/gpt-4"
    assert loaded.model_writers == []  # defaults to empty list — not an error
    assert loaded.model_critics == []

"""Tests for consensus engine control flow."""

import asyncio
from pathlib import Path

from backend.config import AppConfig
from backend.consensus.engine import ConsensusEngine


def test_engine_requests_clarification_for_ambiguous_prompt(tmp_path: Path):
    """Returns clarification response without running debate loop."""
    cfg = AppConfig(sessions_dir=tmp_path)
    engine = ConsensusEngine(cfg)
    session = asyncio.run(
        engine.consult(
            question="search process issues",
            domain="",
            writers=["openai/gpt-5.4"],
            critics=["anthropic/claude-sonnet-4.6", "google/gemini-3.1-pro"],
            max_rounds=2,
            threshold=8,
        )
    )
    assert session.needs_clarification is True
    assert session.clarification_question != ""
    assert session.final_answer == ""

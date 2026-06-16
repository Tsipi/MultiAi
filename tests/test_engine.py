"""Tests for consensus engine control flow."""

import asyncio
from pathlib import Path

from backend.config import AppConfig
from backend.consensus.engine import ConsensusEngine
from backend.consensus.models import DebateRound


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


def test_fast_mode_skips_final_relevance_validation(monkeypatch, tmp_path: Path):
    """Fast mode returns after synthesis without running the validator/repair path."""
    cfg = AppConfig(sessions_dir=tmp_path)
    engine = ConsensusEngine(cfg)
    validate_calls = 0

    async def fake_assess(*_args, **_kwargs):
        class Assessment:
            is_ambiguous = False
            reason = ""
            clarification_question = ""
            clarification_options = []
            intent_scope = "clear"

        return Assessment()

    async def fake_run_rounds(*_args, **_kwargs):
        session = _args[0]
        session.rounds.append(DebateRound(1, "critic revised answer", "critique", 7.5, "ok", "fast"))
        return "critic revised answer", ""

    async def fake_call(*_args, **_kwargs):
        return "decide final"

    async def fake_validate(*_args, **_kwargs):
        nonlocal validate_calls
        validate_calls += 1
        return True, 8.0, "ok"

    monkeypatch.setattr("backend.consensus.engine.assess_intent", fake_assess)
    monkeypatch.setattr("backend.consensus.engine.run_rounds", fake_run_rounds)
    monkeypatch.setattr("backend.consensus.engine.call_openrouter", fake_call)
    monkeypatch.setattr("backend.consensus.engine.validate_relevance", fake_validate)

    session = asyncio.run(
        engine.consult(
            question="How should I decide?",
            domain="",
            writers=["writer"],
            critics=["critic"],
            max_rounds=1,
            threshold=8,
            answer_mode="fast",
        )
    )

    assert session.final_answer == "decide final"
    assert validate_calls == 0


def test_fast_mode_runs_validation_for_obviously_off_topic_answer(monkeypatch, tmp_path: Path):
    """Fast mode still validates when the synthesized answer has near-zero lexical overlap."""
    cfg = AppConfig(sessions_dir=tmp_path)
    engine = ConsensusEngine(cfg)
    validate_calls = 0

    async def fake_assess(*_args, **_kwargs):
        class Assessment:
            is_ambiguous = False
            reason = ""
            clarification_question = ""
            clarification_options = []
            intent_scope = "clear"

        return Assessment()

    async def fake_run_rounds(*_args, **_kwargs):
        session = _args[0]
        session.rounds.append(DebateRound(1, "critic revised answer", "critique", 7.5, "ok", "fast"))
        return "critic revised answer", ""

    async def fake_call(*_args, **_kwargs):
        return "weather forecast"

    async def fake_validate(*_args, **_kwargs):
        nonlocal validate_calls
        validate_calls += 1
        return True, 8.0, "ok"

    monkeypatch.setattr("backend.consensus.engine.assess_intent", fake_assess)
    monkeypatch.setattr("backend.consensus.engine.run_rounds", fake_run_rounds)
    monkeypatch.setattr("backend.consensus.engine.call_openrouter", fake_call)
    monkeypatch.setattr("backend.consensus.engine.validate_relevance", fake_validate)

    asyncio.run(
        engine.consult(
            question="How should I decide?",
            domain="",
            writers=["writer"],
            critics=["critic"],
            max_rounds=1,
            threshold=8,
            answer_mode="fast",
        )
    )

    assert validate_calls == 1

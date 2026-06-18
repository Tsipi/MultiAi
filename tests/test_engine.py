"""Tests for consensus engine control flow."""

import asyncio
from pathlib import Path

from backend.config import AppConfig
from backend.consensus.engine import ConsensusEngine, _user_facing_llm_error
from backend.consensus.llm_clients import LLMCallError
from backend.consensus.models import DebateRound
from backend.consensus.web_research import WebResearchResult


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
    assert session.total_duration_seconds >= 0
    phases = {row["phase"]: row for row in session.phase_timings}
    assert "intent_assessment" in phases
    assert "web_research" in phases
    assert phases["web_research"]["status"] == "skipped"
    assert "debate_rounds" in phases
    assert phases["debate_rounds"]["round_count"] == 1
    assert "final_synthesis" in phases
    assert phases["relevance_validation"]["status"] == "skipped_fast_mode"


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


def test_repair_activity_uses_quality_check_language(monkeypatch, tmp_path: Path):
    """Repair pass should sound like quality control, not an alarming failure."""
    cfg = AppConfig(sessions_dir=tmp_path)
    engine = ConsensusEngine(cfg)
    activity: list[str] = []
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
        session.rounds.append(DebateRound(1, "draft answer", "critique", 8.0, "ok", "summary"))
        return "draft answer", ""

    async def fake_call(*_args, **_kwargs):
        return "final answer"

    async def fake_validate(*_args, **_kwargs):
        nonlocal validate_calls
        validate_calls += 1
        return validate_calls > 1, 5.0 if validate_calls == 1 else 8.0, "needs focus"

    async def report(message: str):
        activity.append(message)

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
            answer_mode="balanced",
            progress_hook=report,
        )
    )

    assert "Quality check: adding one final pass to better match your request." in activity
    assert all("Relevance failed" not in message for message in activity)


def test_fast_mode_uses_shorter_web_search_timeout(monkeypatch, tmp_path: Path):
    """Fast mode passes the fast web-search timeout into the research step."""
    cfg = AppConfig(sessions_dir=tmp_path, fast_web_search_timeout_seconds=7, web_search_timeout_seconds=45)
    engine = ConsensusEngine(cfg)
    observed_timeouts: list[float | None] = []

    async def fake_assess(*_args, **_kwargs):
        class Assessment:
            is_ambiguous = False
            reason = ""
            clarification_question = ""
            clarification_options = []
            intent_scope = "clear"

        return Assessment()

    async def fake_research(*_args, timeout_seconds=None, **_kwargs):
        observed_timeouts.append(timeout_seconds)
        return WebResearchResult(
            performed=True,
            query="latest release",
            retrieved_at="2026-06-16T00:00:00+00:00",
            sources=[{"title": "Source", "url": "https://example.com"}],
            summary="Current evidence.",
        )

    async def fake_run_rounds(*_args, **_kwargs):
        session = _args[0]
        session.rounds.append(DebateRound(1, "latest release answer", "critique", 8.0, "ok", "summary"))
        return "latest release answer", ""

    async def fake_call(*_args, **_kwargs):
        return "latest release final"

    monkeypatch.setattr("backend.consensus.engine.assess_intent", fake_assess)
    monkeypatch.setattr("backend.consensus.engine.research_web", fake_research)
    monkeypatch.setattr("backend.consensus.engine.run_rounds", fake_run_rounds)
    monkeypatch.setattr("backend.consensus.engine.call_openrouter", fake_call)

    asyncio.run(
        engine.consult(
            question="What is the latest release?",
            domain="",
            writers=["writer"],
            critics=["critic"],
            max_rounds=1,
            threshold=8,
            web_search_mode="auto",
            answer_mode="fast",
        )
    )

    assert observed_timeouts == [7]


def test_engine_records_timings_for_clarification_return(tmp_path: Path):
    """Clarification-only responses still include timing metadata."""
    cfg = AppConfig(sessions_dir=tmp_path)
    engine = ConsensusEngine(cfg)
    session = asyncio.run(
        engine.consult(
            question="search process issues",
            domain="",
            writers=["openai/gpt-5.4"],
            critics=["anthropic/claude-sonnet-4.6"],
            max_rounds=2,
            threshold=8,
        )
    )

    assert session.needs_clarification is True
    assert session.total_duration_seconds >= 0
    phases = {row["phase"]: row for row in session.phase_timings}
    assert "input_preparation" in phases
    assert phases["intent_assessment"]["status"] == "needs_clarification"


def test_followup_final_synthesis_keeps_parent_answer_and_clarification(monkeypatch, tmp_path: Path):
    """Follow-up synthesis should not lose details that live in parent context."""
    cfg = AppConfig(sessions_dir=tmp_path)
    engine = ConsensusEngine(cfg)
    captured_prompts: list[str] = []

    async def fake_assess(*_args, **_kwargs):
        class Assessment:
            is_ambiguous = False
            reason = ""
            clarification_question = ""
            clarification_options = []
            intent_scope = "clear follow-up"

        return Assessment()

    async def fake_run_rounds(*_args, **_kwargs):
        session = _args[0]
        session.rounds.append(DebateRound(1, "draft answer mentions Verona", "critique", 8.0, "ok", "summary"))
        return "draft answer mentions Verona", ""

    async def fake_call(prompt, *_args, **_kwargs):
        captured_prompts.append(prompt)
        return "final answer"

    async def fake_validate(*_args, **_kwargs):
        return True, 9.0, "ok"

    monkeypatch.setattr("backend.consensus.engine.assess_intent", fake_assess)
    monkeypatch.setattr("backend.consensus.engine.run_rounds", fake_run_rounds)
    monkeypatch.setattr("backend.consensus.engine.call_openrouter", fake_call)
    monkeypatch.setattr("backend.consensus.engine.validate_relevance", fake_validate)

    session = asyncio.run(
        engine.consult(
            question=(
                "Original prompt:\nPlan a northern Italy itinerary\n\n"
                "Previous final answer:\nSpend two days in Verona before Venice.\n\n"
                "Follow-up instruction:\nMake the second follow-up answer include the city stop."
            ),
            domain="travel planner",
            writers=["writer"],
            critics=["critic"],
            max_rounds=2,
            threshold=8,
            clarification="The city stop is Verona.",
            clarification_question_asked="Which city should be included?",
            is_followup=True,
            source_prompt="Plan a northern Italy itinerary",
            source_final_answer="Spend two days in Verona before Venice.",
            followup_instruction="Make the second follow-up answer include the city stop.",
            web_search_mode="off",
            answer_mode="balanced",
        )
    )

    assert session.final_answer == "final answer"
    assert captured_prompts
    final_prompt = captured_prompts[0]
    assert "Follow-up instruction:" in final_prompt
    assert "Previous final answer to revise or extend:" in final_prompt
    assert "User clarification:" in final_prompt
    assert "Verona" in final_prompt


def test_user_facing_llm_error_for_openrouter_credit_limit():
    """OpenRouter 402 token/credit errors should be actionable and concise."""
    raw = (
        'HTTP 402 from OpenRouter for model anthropic/claude-sonnet-4.6: {"error":'
        '{"message":"This request requires more credits, or fewer max_tokens. You requested up to '
        '65536 tokens, but can only afford 63995. To increase, visit https://openrouter.ai/workspaces/default/keys/key"}}'
    )

    message = _user_facing_llm_error(LLMCallError(raw))

    assert message == (
        "OpenRouter credit/token limit reached. Add credits or increase the key's "
        "total token limit in OpenRouter, then retry this run."
    )
    assert "https://openrouter.ai" not in message
    assert "65536" not in message

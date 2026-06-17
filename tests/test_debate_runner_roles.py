"""Tests for seat-specific roles in the debate runner."""

import asyncio

from backend.config import AppConfig
from backend.consensus.debate_runner import run_rounds
from backend.consensus.models import DebateSession


def test_run_rounds_sends_each_agent_its_own_role(monkeypatch):
    """Writer and critics receive their matching seat-specific role prompts."""
    prompts: list[str] = []

    async def fake_call(prompt, *_args, **_kwargs):
        prompts.append(prompt)
        return "A useful answer"

    async def fake_score(*_args, **_kwargs):
        return 8.0, "agreed"

    async def fake_summary(*_args, **_kwargs):
        return "Summary."

    async def report(_message):
        return None

    monkeypatch.setattr("backend.consensus.debate_runner.call_openrouter", fake_call)
    monkeypatch.setattr("backend.consensus.debate_runner.score_consensus_multi", fake_score)
    monkeypatch.setattr("backend.consensus.debate_runner.summarize_round", fake_summary)

    session = DebateSession(session_id="roles", intent_scope="general question")
    asyncio.run(run_rounds(
        session,
        "How should I decide?",
        "Shared fallback",
        ["writer-model"],
        ["critic-a", "critic-b"],
        ["Generalist Synthesizer"],
        ["Accuracy Reviewer", "User Advocate"],
        1,
        8,
        AppConfig(),
        report,
    ))

    assert any("Role context: Generalist Synthesizer" in prompt for prompt in prompts)
    assert any("Role context: Accuracy Reviewer" in prompt for prompt in prompts)
    assert any("Role context: User Advocate" in prompt for prompt in prompts)


def test_run_rounds_falls_back_to_shared_role(monkeypatch):
    """Old clients without role arrays retain the existing shared-role behavior."""
    prompts: list[str] = []

    async def fake_call(prompt, *_args, **_kwargs):
        prompts.append(prompt)
        return "A useful answer"

    async def fake_score(*_args, **_kwargs):
        return 8.0, "agreed"

    async def fake_summary(*_args, **_kwargs):
        return "Summary."

    async def report(_message):
        return None

    monkeypatch.setattr("backend.consensus.debate_runner.call_openrouter", fake_call)
    monkeypatch.setattr("backend.consensus.debate_runner.score_consensus", fake_score)
    monkeypatch.setattr("backend.consensus.debate_runner.summarize_round", fake_summary)

    session = DebateSession(session_id="fallback", intent_scope="general question")
    asyncio.run(run_rounds(
        session,
        "How should I decide?",
        "Shared Expert",
        ["writer-model"],
        ["critic-model"],
        [],
        [],
        1,
        8,
        AppConfig(),
        report,
    ))

    assert all("Role context: Shared Expert" in prompt for prompt in prompts[:3])


def test_fast_mode_skips_writer_rewrite_and_summary(monkeypatch):
    """Fast mode keeps one scorer pass but skips rewrite and summarizer support calls."""
    prompts: list[str] = []
    score_calls = 0
    summary_calls = 0

    async def fake_call(prompt, *_args, **_kwargs):
        prompts.append(prompt)
        if "fully revised and improved answer" in prompt:
            return "2. A fully revised and improved answer\nCritic revised answer"
        return "Opening answer"

    async def fake_score(*_args, **_kwargs):
        nonlocal score_calls
        score_calls += 1
        return 7.5, "fast agreement"

    async def fake_summary(*_args, **_kwargs):
        nonlocal summary_calls
        summary_calls += 1
        return "Summary."

    async def report(_message):
        return None

    monkeypatch.setattr("backend.consensus.debate_runner.call_openrouter", fake_call)
    monkeypatch.setattr("backend.consensus.debate_runner.score_consensus", fake_score)
    monkeypatch.setattr("backend.consensus.debate_runner.summarize_round", fake_summary)

    session = DebateSession(session_id="fast", intent_scope="general question")
    answer, rolling = asyncio.run(run_rounds(
        session,
        "How should I decide?",
        "Shared Expert",
        ["writer-model"],
        ["critic-model"],
        [],
        [],
        1,
        8,
        AppConfig(),
        report,
        fast_mode=True,
    ))

    assert score_calls == 1
    assert summary_calls == 0
    assert len(prompts) == 2
    assert all("Provide your refined answer" not in prompt for prompt in prompts)
    assert answer == "[Critic 1 revised answer]\nCritic revised answer"
    assert session.rounds[0].summary == "Summary skipped in fast mode."
    assert "Fast mode used critic revisions directly" in rolling

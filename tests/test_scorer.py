"""Unit tests for scorer behavior."""

import asyncio

from backend.config import AppConfig
from backend.consensus.scorer import score_consensus


def test_scorer_returns_float_and_reason(monkeypatch):
    """Parses SCORE and REASON correctly."""
    async def fake_call(*_args, **_kwargs):
        return "SCORE: 7.5\nREASON: Minor wording differences only."
    monkeypatch.setattr("backend.consensus.scorer.call_openrouter", fake_call)
    score, reason = asyncio.run(score_consensus("A", "B", AppConfig()))
    assert score == 7.5
    assert "Minor" in reason


def test_scorer_sees_the_conclusion_of_a_long_answer(monkeypatch):
    """Consensus decides when the loop stops, so the tail of each answer must reach the scorer."""
    captured: list[str] = []

    async def fake_call(prompt, *_args, **_kwargs):
        captured.append(prompt)
        return "SCORE: 8\nREASON: Aligned."

    monkeypatch.setattr("backend.consensus.scorer.call_openrouter", fake_call)
    shared_opening = "Both answers open with the same framing. " * 20
    answer_a = shared_opening + "CONCLUSION_A: buy the index fund."
    answer_b = shared_opening + "CONCLUSION_B: buy the single stock."
    asyncio.run(score_consensus(answer_a, answer_b, AppConfig()))

    assert captured
    assert "CONCLUSION_A" in captured[0]
    assert "CONCLUSION_B" in captured[0]


def test_scorer_parse_failure_fallback(monkeypatch):
    """Returns fallback when response format is invalid."""
    async def fake_call(*_args, **_kwargs):
        return "Cannot score this."
    monkeypatch.setattr("backend.consensus.scorer.call_openrouter", fake_call)
    score, reason = asyncio.run(score_consensus("A", "B", AppConfig()))
    assert score == 5.0
    assert reason == "parse error"

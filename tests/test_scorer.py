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


def test_scorer_parse_failure_fallback(monkeypatch):
    """Returns fallback when response format is invalid."""
    async def fake_call(*_args, **_kwargs):
        return "Cannot score this."
    monkeypatch.setattr("backend.consensus.scorer.call_openrouter", fake_call)
    score, reason = asyncio.run(score_consensus("A", "B", AppConfig()))
    assert score == 5.0
    assert reason == "parse error"

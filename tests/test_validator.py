"""Tests for relevance validator behavior."""

import asyncio

from backend.config import AppConfig
from backend.consensus.validator import validate_relevance


def test_validator_passes_with_high_mock_score(monkeypatch):
    """Combines lexical overlap and LLM score into pass outcome."""
    async def fake_call(*_args, **_kwargs):
        return "SCORE: 8\nREASON: Highly relevant."

    monkeypatch.setattr("backend.consensus.validator.call_openrouter", fake_call)
    ok, score, reason = asyncio.run(
        validate_relevance("job search frustrations list", "job search frustrations and tools", AppConfig())
    )
    assert ok is True
    assert score >= 7.0
    assert "relevant" in reason.lower()


def test_validator_fails_with_low_mock_score(monkeypatch):
    """Returns false when model score is low and overlap weak."""
    async def fake_call(*_args, **_kwargs):
        return "SCORE: 3\nREASON: Off topic."

    monkeypatch.setattr("backend.consensus.validator.call_openrouter", fake_call)
    ok, score, _ = asyncio.run(validate_relevance("job search", "weather updates", AppConfig()))
    assert ok is False
    assert score < 7.0

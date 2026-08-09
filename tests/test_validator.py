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


def test_llm_verdict_at_the_threshold_now_passes(monkeypatch):
    """A verdict of exactly 7 must clear a 7.0 threshold — the old weighting deflated it to ~6.9."""
    async def fake_call(*_args, **_kwargs):
        return "SCORE: 7\nREASON: Relevant with minor gaps."

    monkeypatch.setattr("backend.consensus.validator.call_openrouter", fake_call)
    ok, score, _ = asyncio.run(
        validate_relevance(
            "compare the 10 most cap market USA stocks 2026 vs 2016",
            "A comparison of the 10 largest USA stocks by market cap in 2026 versus 2016.",
            AppConfig(),
        )
    )

    assert ok is True
    assert score == 7.0


def test_validator_guard_rejects_answer_with_no_shared_wording(monkeypatch):
    """A confident score cannot rescue an answer that shares almost no wording with the request."""
    async def fake_call(*_args, **_kwargs):
        return "SCORE: 9\nREASON: Looks great."

    monkeypatch.setattr("backend.consensus.validator.call_openrouter", fake_call)
    ok, score, reason = asyncio.run(
        validate_relevance("kubernetes ingress routing", "Tomatoes ripen faster beside bananas.", AppConfig())
    )

    assert ok is False
    assert score == 9.0
    assert "almost no wording" in reason


def test_validator_sees_the_end_of_a_structured_answer(monkeypatch):
    """The deliverable sits last in FINAL_SYNTHESIS, so the tail must always reach the validator."""
    captured: list[str] = []

    async def fake_call(prompt, *_args, **_kwargs):
        captured.append(prompt)
        return "SCORE: 8\nREASON: Relevant."

    monkeypatch.setattr("backend.consensus.validator.call_openrouter", fake_call)
    answer = "The Bottom Line\n" + ("filler discussion. " * 400) + "\nThe Definitive Answer\nDEADBEEF"
    asyncio.run(validate_relevance("compare the top 10 stocks", answer, AppConfig()))

    assert captured
    assert "DEADBEEF" in captured[0]
    assert "The Bottom Line" in captured[0]

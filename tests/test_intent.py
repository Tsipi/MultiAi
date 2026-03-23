"""Tests for intent ambiguity detection."""

import asyncio

from backend.config import AppConfig
from backend.consensus.intent import assess_intent


def test_assess_intent_uses_clarification_override():
    """Treats provided clarification as explicit intent scope."""
    result = asyncio.run(assess_intent("search process problems", "Engineer", "Job search only", AppConfig()))
    assert result.is_ambiguous is False
    assert "Clarification" in result.reason


def test_assess_intent_parses_llm_multiple_choice(monkeypatch):
    """Parses strict JSON output with focused options."""
    async def fake_call(*_args, **_kwargs):
        return '{"needs_clarification": true, "reason": "Ambiguous scope.", "intent_scope": "search process", "clarification_question": "Which search?", "clarification_options": ["Job search", "Web search", "Research workflow"]}'

    monkeypatch.setattr("backend.consensus.intent.call_openrouter", fake_call)
    result = asyncio.run(assess_intent("search process issues", "Engineer", "", AppConfig()))
    assert result.is_ambiguous is True
    assert result.clarification_question == "Which search?"
    assert result.clarification_options == ["Job search", "Web search", "Research workflow", "Other"]


def test_assess_intent_moves_other_to_bottom(monkeypatch):
    """Keeps Other as the final option within the max list size."""
    async def fake_call(*_args, **_kwargs):
        return '{"needs_clarification": true, "reason": "Ambiguous.", "intent_scope": "scope", "clarification_question": "Pick one", "clarification_options": ["Other", "A", "B", "C", "D"]}'

    monkeypatch.setattr("backend.consensus.intent.call_openrouter", fake_call)
    result = asyncio.run(assess_intent("q", "r", "", AppConfig()))
    assert result.clarification_options == ["A", "B", "C", "D", "Other"]

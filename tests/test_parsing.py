"""Tests for critic output parsing."""

from backend.consensus.parsing import extract_revised_answer


def test_extract_revised_answer_with_numbered_marker():
    """Returns tail text after numbered revised answer marker."""
    value = "1. Critique\nWeak evidence.\n2. A fully revised and improved answer\nBetter answer text."
    assert extract_revised_answer(value) == "Better answer text."


def test_extract_revised_answer_fallback_to_full_text():
    """Falls back to full content when marker is absent."""
    value = "General notes only without explicit revised answer marker."
    assert extract_revised_answer(value) == value

"""Tests for export title prompt normalization."""

from backend.consensus.export_title import build_export_title_prompt, normalize_export_title


def test_build_prompt_includes_task_and_role():
    """Prompt embeds truncated task and role lines."""
    p = build_export_title_prompt("Do X", "You are a designer")
    assert "Do X" in p
    assert "designer" in p


def test_normalize_trims_to_six_words():
    """Long model output is cut to six words."""
    assert normalize_export_title("one two three four five six seven eight", "") == "one two three four five six"


def test_normalize_strips_punctuation():
    """Quotes and periods are removed."""
    assert normalize_export_title('"cool SaaS tips!"', "") == "cool saas tips"


def test_normalize_falls_back_for_short_output():
    """Very short output uses question words."""
    out = normalize_export_title("ab", "alpha beta gamma delta epsilon")
    assert out == "alpha beta gamma delta epsilon"

"""Tests for LLM client normalization helpers."""

from backend.consensus.llm_clients import _normalize_base_url


def test_normalize_fixes_known_openrouter_typo():
    """Corrects malformed openrouter.aipai host."""
    assert _normalize_base_url("https://openrouter.aipai/v1/") == "https://openrouter.ai/api/v1"


def test_normalize_upgrades_plain_openrouter_host():
    """Appends expected API path for plain host."""
    assert _normalize_base_url("https://openrouter.ai") == "https://openrouter.ai/api/v1"

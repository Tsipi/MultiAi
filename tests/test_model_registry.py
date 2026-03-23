"""Tests for model alias resolution."""

from backend.consensus.model_registry import resolve_model_id


def test_resolve_known_alias_to_openrouter_id():
    """Maps UI alias to concrete provider model ID."""
    assert resolve_model_id("deepseek/deepseek-chat-v3.2") == "deepseek/deepseek-chat"


def test_resolve_unknown_alias_passthrough():
    """Leaves unknown model IDs unchanged."""
    assert resolve_model_id("provider/model-x") == "provider/model-x"

"""Tests for model alias resolution."""

from backend.consensus.model_registry import resolve_model_id


def test_resolve_known_alias_to_openrouter_id():
    """Maps UI alias to concrete provider model ID."""
    assert resolve_model_id("deepseek/deepseek-chat-v3.2") == "deepseek/deepseek-chat"


def test_claude_sonnet_ui_id_passes_through():
    """Claude Sonnet 4.6 uses the same OpenRouter slug; do not map to removed models."""
    assert resolve_model_id("anthropic/claude-sonnet-4.6") == "anthropic/claude-sonnet-4.6"


def test_deprecated_claude_35_sonnet_upgrade():
    """Removed OpenRouter id is upgraded so old clients do not 404."""
    assert resolve_model_id("anthropic/claude-3.5-sonnet") == "anthropic/claude-sonnet-4.6"


def test_deprecated_claude_35_sonnet_versioned_upgrade():
    """Versioned legacy slugs also map to a live Anthropic model."""
    assert resolve_model_id("anthropic/claude-3.5-sonnet-20241022") == "anthropic/claude-sonnet-4.6"


def test_substring_claude_35_falls_forward():
    """Any variant containing the retired 3.5 Sonnet slug is normalized."""
    assert resolve_model_id("org/anthropic/claude-3-5-sonnet-v1") == "anthropic/claude-sonnet-4.6"


def test_resolve_unknown_alias_passthrough():
    """Leaves unknown model IDs unchanged."""
    assert resolve_model_id("provider/model-x") == "provider/model-x"

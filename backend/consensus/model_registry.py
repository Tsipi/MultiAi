"""Maps product-facing model aliases to OpenRouter IDs.

Only include entries where the UI id still differs from OpenRouter's current slug.
Deprecated OpenRouter ids must not be used (they return 404).
"""

MODEL_ALIASES = {
    "openai/gpt-5.4": "openai/gpt-4o-mini",
    "google/gemini-3.1-pro": "google/gemini-2.0-flash-001",
    "deepseek/deepseek-chat-v3.2": "deepseek/deepseek-chat",
}

# OpenRouter removed these slugs; clients may still send them (old UI state, bookmarks, etc.).
DEPRECATED_OPENROUTER_IDS: dict[str, str] = {
    "anthropic/claude-3.5-sonnet": "anthropic/claude-sonnet-4.6",
    "anthropic/claude-3.5-sonnet-20241022": "anthropic/claude-sonnet-4.6",
    "anthropic/claude-3.5-sonnet-20240620": "anthropic/claude-sonnet-4.6",
}


def resolve_model_id(model: str) -> str:
    """Return OpenRouter-compatible model ID for a selected alias."""
    stripped = model.strip()
    if stripped in DEPRECATED_OPENROUTER_IDS:
        return DEPRECATED_OPENROUTER_IDS[stripped]
    low = stripped.lower()
    if "claude-3.5-sonnet" in low or "claude-3-5-sonnet" in low:
        return "anthropic/claude-sonnet-4.6"
    return MODEL_ALIASES.get(stripped, stripped)

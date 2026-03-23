"""Maps product-facing model aliases to OpenRouter IDs."""

MODEL_ALIASES = {
    "openai/gpt-5.4": "openai/gpt-4o-mini",
    "anthropic/claude-sonnet-4.6": "anthropic/claude-3.5-sonnet",
    "google/gemini-3.1-pro": "google/gemini-2.0-flash-001",
    "deepseek/deepseek-chat-v3.2": "deepseek/deepseek-chat",
}


def resolve_model_id(model: str) -> str:
    """Return OpenRouter-compatible model ID for a selected alias."""
    return MODEL_ALIASES.get(model, model)

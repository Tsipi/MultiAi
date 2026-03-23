"""Token pricing and cost calculations."""

MODEL_PRICES = {
    "openai/gpt-5.4": (0.9, 15.0),
    "anthropic/claude-sonnet-4.6": (1.0, 15.0),
    "google/gemini-3.1-pro": (1.15, 12.0),
    "deepseek/deepseek-chat-v3.2": (0.2, 0.4),
}


def estimate_cost_usd(model: str, prompt_tokens: int, completion_tokens: int) -> tuple[float, float, float]:
    """Return prompt, completion, total estimated USD costs."""
    in_rate, out_rate = MODEL_PRICES.get(model, (1.0, 1.0))
    prompt_cost = (prompt_tokens / 1_000_000) * in_rate
    completion_cost = (completion_tokens / 1_000_000) * out_rate
    return round(prompt_cost, 6), round(completion_cost, 6), round(prompt_cost + completion_cost, 6)

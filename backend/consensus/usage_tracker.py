"""Per-request token and cost usage collector."""

from contextvars import ContextVar

from backend.consensus.costs import estimate_cost_usd

_COLLECTOR: ContextVar[dict[str, dict[str, float]] | None] = ContextVar("usage_collector", default=None)


def start_usage_collection() -> object:
    """Start request-local usage collection."""
    return _COLLECTOR.set({})


def stop_usage_collection(token: object) -> dict[str, dict[str, float]]:
    """Stop collection and return snapshot."""
    data = _COLLECTOR.get() or {}
    _COLLECTOR.reset(token)
    return data


def record_usage(model: str, prompt_tokens: int, completion_tokens: int) -> None:
    """Record tokens and estimated cost for a model call."""
    collector = _COLLECTOR.get()
    if collector is None:
        return
    row = collector.setdefault(
        model, {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "prompt_cost_usd": 0.0, "completion_cost_usd": 0.0, "total_cost_usd": 0.0}
    )
    p_cost, c_cost, t_cost = estimate_cost_usd(model, prompt_tokens, completion_tokens)
    row["prompt_tokens"] += prompt_tokens
    row["completion_tokens"] += completion_tokens
    row["total_tokens"] += prompt_tokens + completion_tokens
    row["prompt_cost_usd"] += p_cost
    row["completion_cost_usd"] += c_cost
    row["total_cost_usd"] += t_cost

"""Token pricing and cost calculations."""

from __future__ import annotations

import logging

import httpx

LOGGER = logging.getLogger(__name__)

# Fallback prices (per million tokens) used when live fetch fails or model is unknown
_FALLBACK_PRICES: dict[str, tuple[float, float]] = {
    "openai/gpt-5.4": (0.9, 15.0),
    "anthropic/claude-sonnet-4.6": (1.0, 15.0),
    "google/gemini-3.1-pro": (1.15, 12.0),
    "deepseek/deepseek-chat-v3.2": (0.2, 0.4),
}

# In-memory cache populated once at startup by load_live_prices()
_LIVE_PRICES: dict[str, tuple[float, float]] = {}


async def load_live_prices(api_key: str, base_url: str) -> None:
    """Fetch current per-token prices from OpenRouter and cache them in memory.

    OpenRouter returns pricing as cost-per-token; we convert to cost-per-million.
    Falls back silently to hardcoded table on any error.
    """
    url = base_url.rstrip("/").replace("/api/v1", "") + "/api/v1/models"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, headers={"Authorization": f"Bearer {api_key}"})
        resp.raise_for_status()
        for entry in resp.json().get("data", []):
            model_id = entry.get("id", "")
            pricing = entry.get("pricing", {})
            try:
                prompt_per_token = float(pricing.get("prompt", 0) or 0)
                completion_per_token = float(pricing.get("completion", 0) or 0)
                # OpenRouter returns cost per token; multiply by 1M for per-million rate
                _LIVE_PRICES[model_id] = (
                    round(prompt_per_token * 1_000_000, 6),
                    round(completion_per_token * 1_000_000, 6),
                )
            except (TypeError, ValueError):
                continue
        LOGGER.info("Loaded live prices for %d models from OpenRouter.", len(_LIVE_PRICES))
    except Exception as exc:  # noqa: BLE001
        LOGGER.warning("Could not fetch live model prices from OpenRouter: %s — using fallback table.", exc)


def estimate_cost_usd(model: str, prompt_tokens: int, completion_tokens: int) -> tuple[float, float, float]:
    """Return prompt, completion, total estimated USD costs.

    Uses live prices fetched at startup; falls back to hardcoded table, then $1/$1.
    """
    in_rate, out_rate = _LIVE_PRICES.get(model) or _FALLBACK_PRICES.get(model, (1.0, 1.0))
    prompt_cost = (prompt_tokens / 1_000_000) * in_rate
    completion_cost = (completion_tokens / 1_000_000) * out_rate
    return round(prompt_cost, 6), round(completion_cost, 6), round(prompt_cost + completion_cost, 6)

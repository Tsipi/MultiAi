"""OpenRouter client helpers."""

from __future__ import annotations

import logging
from time import perf_counter

import httpx

from backend.config import AppConfig
from backend.consensus.model_registry import resolve_model_id
from backend.consensus.usage_tracker import record_usage

LOGGER = logging.getLogger(__name__)
SYSTEM_GUARDRAIL = (
    "Follow the provided instructions exactly. Stay strictly on-topic. "
    "Do not introduce studies, literature, surveys, statistics, citations, "
    "or invented numbers unless the user explicitly asks for them or live web "
    "research context is provided. Never invent sources or claim web research "
    "was performed unless live web research context is present."
)


class LLMCallError(Exception):
    """Raised when LLM calls fail."""


def _normalize_base_url(base_url: str) -> str:
    """Clean and normalize configured OpenRouter base URL."""
    value = base_url.strip().rstrip("/")
    if "openrouter.aipai" in value:
        return "https://openrouter.ai/api/v1"
    if value == "https://openrouter.ai":
        return "https://openrouter.ai/api/v1"
    return value


async def call_openrouter(
    prompt: str, model: str, cfg: AppConfig, image_urls: list[str] | None = None
) -> str:
    """Call OpenRouter chat completion API."""
    if not cfg.openrouter_api_key:
        raise LLMCallError("OPENROUTER_API_KEY is missing.")
    model_id = resolve_model_id(model)
    url = f"{_normalize_base_url(cfg.openrouter_base_url)}/chat/completions"
    user_content: str | list[dict] = prompt
    if image_urls:
        user_content = [{"type": "text", "text": prompt}] + [
            {"type": "image_url", "image_url": {"url": url}} for url in image_urls
        ]
    try:
        started_at = perf_counter()
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                url,
                headers={"Authorization": f"Bearer {cfg.openrouter_api_key}"},
                json={
                    "model": model_id,
                    "messages": [
                        {"role": "system", "content": SYSTEM_GUARDRAIL},
                        {"role": "user", "content": user_content},
                    ],
                },
            )
        response.raise_for_status()
        body = response.json()
        usage = body.get("usage", {})
        prompt_tokens = int(usage.get("prompt_tokens", max(1, len(prompt) // 4)))
        completion_tokens = int(usage.get("completion_tokens", max(1, len(body["choices"][0]["message"]["content"]) // 4)))
        record_usage(model, prompt_tokens, completion_tokens, perf_counter() - started_at)
        return body["choices"][0]["message"]["content"].strip()
    except httpx.HTTPStatusError as exc:
        details = exc.response.text[:300]
        LOGGER.error("LLM call failed model=%s url=%s status=%s body=%s", model_id, url, exc.response.status_code, details)
        raise LLMCallError(f"HTTP {exc.response.status_code} from OpenRouter for model {model_id}: {details}") from exc
    except Exception as exc:  # noqa: BLE001
        LOGGER.error("LLM call failed model=%s url=%s error=%s", model_id, url, exc)
        raise LLMCallError(str(exc)) from exc

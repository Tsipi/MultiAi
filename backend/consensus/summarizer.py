"""Round summarization logic."""

from backend.config import AppConfig
from backend.consensus.llm_clients import call_openrouter

SUMMARIZER_PROMPT = """Summarize this debate round in 3-4 sentences. Capture:
- The core position taken in the answer
- The main point of the critique
- What changed or was agreed upon

Answer:
{answer}

Critique:
{critique}

Write a concise summary only. No preamble.
"""


async def summarize_round(answer: str, critique: str, cfg: AppConfig) -> str:
    """Return compressed summary for rolling context."""
    prompt = SUMMARIZER_PROMPT.format(answer=answer[:800], critique=critique[:800])
    return await call_openrouter(prompt, cfg.summarizer_model, cfg, max_tokens=cfg.summary_max_tokens)

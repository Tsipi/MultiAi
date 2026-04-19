"""Consensus scoring logic."""

import asyncio
import logging
import re

from backend.config import AppConfig
from backend.consensus.llm_clients import call_openrouter

LOGGER = logging.getLogger(__name__)

SCORER_PROMPT = """Rate the consensus between two answers on a scale of 1 to 10.

10 = fully aligned, no meaningful disagreement
7+ = minor wording or emphasis differences only
5-6 = partial agreement, some substantive gaps
Below 5 = significant disagreement

Answer A:
{answer_a}

Answer B:
{answer_b}

Respond ONLY in this exact format:
SCORE: [number]
REASON: [one sentence]
"""

RELEVANCE_PROMPT = """Rate how relevant this answer is to the user request on a scale of 1 to 10.

User request:
{question}

Answer:
{answer}

Respond ONLY in this exact format:
SCORE: [number]
REASON: [one sentence]
"""


def _parse_score(response: str) -> tuple[float, str]:
    """Parse score/reason response with fallback."""
    score_match = re.search(r"SCORE:\s*([0-9]+(?:\.[0-9]+)?)", response)
    reason_match = re.search(r"REASON:\s*(.+)", response)
    if not score_match:
        LOGGER.warning("Score parse failure. response=%s", response[:200])
        return 5.0, "parse error"
    return float(score_match.group(1)), (reason_match.group(1).strip() if reason_match else "")


async def score_consensus(answer_a: str, answer_b: str, cfg: AppConfig) -> tuple[float, str]:
    """Score alignment and return score plus reason."""
    prompt = SCORER_PROMPT.format(answer_a=answer_a[:600], answer_b=answer_b[:600])
    response = await call_openrouter(prompt, cfg.scorer_model, cfg)
    return _parse_score(response)


async def score_consensus_multi(answers: list[str], cfg: AppConfig) -> tuple[float, str]:
    """Average pairwise consensus scores across N answers (≥2). Returns (avg_score, reason)."""
    if len(answers) < 2:
        return 0.0, "insufficient answers to score"
    pairs = [
        (answers[i], answers[j])
        for i in range(len(answers))
        for j in range(i + 1, len(answers))
    ]
    results = await asyncio.gather(*[score_consensus(a, b, cfg) for a, b in pairs])
    avg = sum(r[0] for r in results) / len(results)
    return round(avg, 2), results[0][1]


async def score_relevance(question: str, answer: str, cfg: AppConfig) -> tuple[float, str]:
    """Score relevance against original user request."""
    prompt = RELEVANCE_PROMPT.format(question=question[:600], answer=answer[:600])
    response = await call_openrouter(prompt, cfg.scorer_model, cfg)
    return _parse_score(response)

"""Answer relevance validation before final synthesis."""

import re

from backend.config import AppConfig
from backend.consensus.llm_clients import call_openrouter

VALIDATOR_PROMPT = """Score how relevant the answer is to the user request.

User request:
{question}

Candidate answer:
{answer}

Respond ONLY:
SCORE: [1-10]
REASON: [one sentence]
"""

LLM_WEIGHT = 0.9
OVERLAP_WEIGHT = 0.1


def _token_overlap(question: str, answer: str) -> float:
    """Return token overlap ratio between request and answer."""
    q = set(re.findall(r"[a-zA-Z]{3,}", question.lower()))
    a = set(re.findall(r"[a-zA-Z]{3,}", answer.lower()))
    if not q:
        return 0.0
    return len(q.intersection(a)) / len(q)


async def validate_relevance(question: str, answer: str, cfg: AppConfig) -> tuple[bool, float, str]:
    """Validate relevance with lexical + LLM scoring."""
    overlap = _token_overlap(question, answer)
    prompt = VALIDATOR_PROMPT.format(question=question[:700], answer=answer[:900])
    response = await call_openrouter(prompt, cfg.validator_model, cfg, max_tokens=cfg.scorer_max_tokens)
    score_match = re.search(r"SCORE:\s*([0-9]+(?:\.[0-9]+)?)", response)
    reason_match = re.search(r"REASON:\s*(.+)", response)
    llm_score = float(score_match.group(1)) if score_match else 5.0
    final_score = round((llm_score * LLM_WEIGHT) + (overlap * 10 * OVERLAP_WEIGHT), 2)
    reason = reason_match.group(1).strip() if reason_match else "validator parse fallback"
    return final_score >= cfg.min_relevance_score, final_score, reason

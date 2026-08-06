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

OFF_TOPIC_REASON = "Answer shares almost no wording with the request."


def _token_overlap(question: str, answer: str) -> float:
    """Return token overlap ratio between request and answer."""
    q = set(re.findall(r"[a-zA-Z]{3,}", question.lower()))
    a = set(re.findall(r"[a-zA-Z]{3,}", answer.lower()))
    if not q:
        return 0.0
    return len(q.intersection(a)) / len(q)


def _excerpt(text: str, limit: int) -> str:
    """Shorten to limit while keeping both ends, so a trailing conclusion is never lost."""
    if len(text) <= limit:
        return text
    head = limit // 2
    tail = limit - head
    return f"{text[:head]}\n[...]\n{text[-tail:]}"


async def validate_relevance(question: str, answer: str, cfg: AppConfig) -> tuple[bool, float, str]:
    """Validate relevance with lexical + LLM scoring."""
    overlap = _token_overlap(question, answer)
    prompt = VALIDATOR_PROMPT.format(
        question=question[: cfg.validator_question_chars],
        answer=_excerpt(answer, cfg.validator_answer_chars),
    )
    response = await call_openrouter(prompt, cfg.validator_model, cfg, max_tokens=cfg.scorer_max_tokens)
    score_match = re.search(r"SCORE:\s*([0-9]+(?:\.[0-9]+)?)", response)
    reason_match = re.search(r"REASON:\s*(.+)", response)
    llm_score = round(float(score_match.group(1)) if score_match else 5.0, 2)
    reason = reason_match.group(1).strip() if reason_match else "validator parse fallback"
    if overlap < cfg.validator_min_overlap:
        return False, llm_score, OFF_TOPIC_REASON
    return llm_score >= cfg.min_relevance_score, llm_score, reason

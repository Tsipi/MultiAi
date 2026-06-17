"""Build prompts and normalize output for export/session short titles."""

from __future__ import annotations

import re


def build_export_title_prompt(question: str, role: str) -> str:
    """Compose the user message sent to the export title model."""
    rq = (question or "").strip()
    rr = (role or "").strip()
    return (
        "Return ONLY a short phrase of 3 to 6 words (prefer 3-5; use 6 only if needed for clarity).\n"
        "Rules:\n"
        "- use lowercase letters only (words separated by single spaces)\n"
        "- no punctuation, quotation marks, hashtags, or emojis\n"
        "- describe what this answer is about using both the task and the role\n"
        "- sound like a natural human folder label, not marketing copy\n\n"
        f"Task:\n{rq}\n\nRole:\n{rr or 'not specified'}"
    )


def normalize_export_title(raw: str, fallback_question: str) -> str:
    """Clean LLM output and clamp to at most six words."""
    text = (raw or "").strip()
    for ch in '"\'`':
        text = text.strip(ch)
    text = text.split("\n")[0].strip()
    text = re.sub(r"[.!?:;,]+$", "", text)
    words: list[str] = []
    for part in text.lower().split():
        token = re.sub(r"[^a-z0-9-]+", "", part)
        if token:
            words.append(token)
    if len(words) > 6:
        words = words[:6]
    if len(words) >= 3:
        return " ".join(words)
    return _fallback_from_question(fallback_question)


def _fallback_from_question(question: str) -> str:
    """Pick 3-5 words from the question when model output is unusable."""
    words: list[str] = []
    stop_words = {"and", "the", "for", "with", "that", "this", "from", "into", "about"}
    for part in (question or "").lower().split():
        token = re.sub(r"[^a-z0-9-]+", "", part)
        if len(token) < 3:
            continue
        if token in stop_words:
            continue
        words.append(token)
        if len(words) >= 6:
            break
    if len(words) >= 3:
        return " ".join(words[:6])
    if words:
        return " ".join([*words, "follow-up", "answer"][:4])
    return "saved team answer"

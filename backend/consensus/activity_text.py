"""Helpers for concise, specific round activity updates."""

import re

# A GFM separator row, e.g. `|---|:--:|`. Used to detect and skip table syntax
# so raw pipe rows never leak into the plain-text activity feed.
_TABLE_SEPARATOR_RE = re.compile(r"^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$")


def table_headers(text: str) -> list[str]:
    """Return a GFM table's header column names, or [] if `text` has no table."""
    lines = text.splitlines()
    for i in range(len(lines) - 1):
        if "|" in lines[i] and _TABLE_SEPARATOR_RE.match(lines[i + 1]):
            cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
            return [clean_text(c) for c in cells if clean_text(c)]
    return []


def strip_table_lines(text: str) -> str:
    """Drop lines that are table rows or separators (2+ pipes) from `text`."""
    return "\n".join(ln for ln in text.splitlines() if ln.count("|") < 2)


def writer_summary_sentence(answer: str) -> str:
    """Build one sentence summarizing what the writer drafted."""
    titles = re.findall(r"(?m)^\s*\d+\.\s+\**([^\n:*]+)", answer)
    cleaned = [clean_text(x) for x in titles if clean_text(x)]
    if cleaned:
        count = len(cleaned)
        if count == 1:
            first = f"Writer proposed {count} idea: {cleaned[0]}."
        else:
            first = f"Writer proposed {count} ideas, including {cleaned[0]} and {cleaned[1]}."
        second = "Draft stays aligned with the requested scope and format."
        return f"{first} {second}"
    headers = table_headers(answer)
    if headers:
        shown = ", ".join(headers[:3])
        first = f"Writer drafted a comparison table covering {shown}."
        second = "Draft stays aligned with the requested scope and format."
        return f"{first} {second}"
    first = first_sentence(answer)
    if first:
        return f"Writer draft: {first}. Draft stays aligned with the requested scope and format."
    return "Writer draft focused on the user request. Draft stays aligned with the requested scope and format."


def critic_feedback_sentence(critique: str, critic_name: str) -> str:
    """Build one sentence summarizing critic feedback."""
    block = critique_block(critique)
    points = re.findall(r"(?m)^\s*[-*]\s+\**([^:\n*]{4,120})", block)
    cleaned = [clean_text(x) for x in points if clean_text(x)]
    if cleaned:
        if len(cleaned) == 1:
            first = f"{critic_name} feedback: {cleaned[0]}."
            second = f"{critic_name} asked for sharper specifics and clearer differentiation."
            return f"{first} {second}"
        first = f"{critic_name} feedback: {cleaned[0]}."
        second = f"{critic_name} also flagged {cleaned[1].lower()}."
        return f"{first} {second}"
    sentence = first_sentence(block) or first_sentence(critique)
    if sentence:
        return f"{critic_name} feedback: {sentence}. {critic_name} asked for sharper specifics and clearer differentiation."
    return f"{critic_name} feedback focused on improving specificity and completeness. {critic_name} asked for sharper specifics and clearer differentiation."


def critique_block(critique: str) -> str:
    """Extract the primary critique section when available."""
    lower = critique.lower()
    marker = "1. **critique:**"
    idx = lower.find(marker)
    if idx < 0:
        marker = "1. critique:"
        idx = lower.find(marker)
    if idx < 0:
        return critique
    start = idx + len(marker)
    next_idx = lower.find("\n2.", start)
    return critique[start:next_idx] if next_idx > start else critique[start:]


def first_sentence(text: str) -> str:
    """Return first sentence-like chunk without markdown symbols or table rows."""
    cleaned = clean_text(strip_table_lines(text))
    if not cleaned:
        return ""
    parts = re.split(r"(?<=[.!?])\s+", cleaned)
    first = parts[0].strip()
    return first.rstrip(".!?")[:220]


def clean_text(text: str) -> str:
    """Normalize markdown-heavy text for activity feed."""
    value = re.sub(r"\[Critic [^\]]+\]", "", text)
    value = value.replace("*", "").replace("`", "")
    value = re.sub(r"\s+", " ", value).strip(" -:\n\t")
    return value[:220]

"""Helpers for parsing critic output blocks."""


def extract_revised_answer(critique_text: str) -> str:
    """Return the revised answer portion when present."""
    markers = (
        "2. A fully revised and improved answer",
        "Revised answer:",
        "Improved answer:",
    )
    for marker in markers:
        idx = critique_text.lower().find(marker.lower())
        if idx >= 0:
            candidate = critique_text[idx + len(marker) :].strip(" :\n")
            if candidate:
                return candidate
    return critique_text

"""Shared text-shortening helper for prompt inputs."""


def excerpt(text: str, limit: int) -> str:
    """Shorten to limit while keeping both ends, so a trailing conclusion is never lost."""
    if len(text) <= limit:
        return text
    head = limit // 2
    tail = limit - head
    return f"{text[:head]}\n[...]\n{text[-tail:]}"

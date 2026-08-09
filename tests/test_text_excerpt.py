"""Tests for the shared prompt-input excerpt helper."""

from backend.consensus.text_excerpt import excerpt


def test_excerpt_keeps_both_ends_when_shortening():
    """Over-long text keeps head and tail rather than truncating the conclusion away."""
    text = "START" + ("x" * 500) + "END"
    out = excerpt(text, 100)

    assert out.startswith("START")
    assert out.endswith("END")
    assert "[...]" in out
    assert len(out) < len(text)


def test_excerpt_returns_short_text_unchanged():
    """Text within the limit is passed through verbatim."""
    assert excerpt("short answer", 6000) == "short answer"

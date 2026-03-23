"""Tests for usage tracker aggregation."""

from backend.consensus.usage_tracker import record_usage, start_usage_collection, stop_usage_collection


def test_usage_tracker_accumulates_tokens_and_costs():
    """Aggregates per-model rows over multiple calls."""
    token = start_usage_collection()
    record_usage("deepseek/deepseek-chat-v3.2", 1000, 500)
    record_usage("deepseek/deepseek-chat-v3.2", 500, 500)
    usage = stop_usage_collection(token)
    row = usage["deepseek/deepseek-chat-v3.2"]
    assert int(row["prompt_tokens"]) == 1500
    assert int(row["completion_tokens"]) == 1000
    assert int(row["total_tokens"]) == 2500
    assert row["total_cost_usd"] > 0

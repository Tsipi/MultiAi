"""Tests for configurable utility model routing."""

from backend.config import AppConfig


def test_utility_models_default_to_shared_fast_model():
    cfg = AppConfig()

    assert cfg.intent_model == cfg.utility_model
    assert cfg.scorer_model == cfg.utility_model
    assert cfg.summarizer_model == cfg.utility_model
    assert cfg.validator_model == cfg.utility_model


def test_utility_models_can_be_configured_independently(monkeypatch):
    monkeypatch.setenv("UTILITY_MODEL", "utility/default")
    monkeypatch.setenv("INTENT_MODEL", "utility/intent")
    monkeypatch.setenv("SCORER_MODEL", "utility/scorer")
    monkeypatch.setenv("SUMMARIZER_MODEL", "utility/summarizer")
    monkeypatch.setenv("VALIDATOR_MODEL", "utility/validator")

    cfg = AppConfig()

    assert cfg.utility_model == "utility/default"
    assert cfg.intent_model == "utility/intent"
    assert cfg.scorer_model == "utility/scorer"
    assert cfg.summarizer_model == "utility/summarizer"
    assert cfg.validator_model == "utility/validator"

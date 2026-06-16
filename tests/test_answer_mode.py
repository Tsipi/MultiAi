"""Tests for answer mode request validation and session defaults."""

import pytest
from pydantic import ValidationError

from backend.api.schemas import ConsultRequest
from backend.consensus.models import DebateSession


def _payload(**overrides):
    data = {
        "question": "What should we do?",
        "role": "Advisor",
        "writers": ["writer-model"],
        "critics": ["critic-model"],
        "max_rounds": 2,
        "consensus_score": 8,
    }
    data.update(overrides)
    return data


def test_answer_mode_defaults_to_balanced():
    request = ConsultRequest(**_payload())
    session = DebateSession(session_id="test")

    assert request.answer_mode == "balanced"
    assert session.answer_mode == "balanced"


@pytest.mark.parametrize("mode", ["fast", "balanced", "deep"])
def test_answer_mode_accepts_expected_values(mode):
    request = ConsultRequest(**_payload(answer_mode=mode))

    assert request.answer_mode == mode


def test_answer_mode_rejects_unknown_values():
    with pytest.raises(ValidationError):
        ConsultRequest(**_payload(answer_mode="turbo"))

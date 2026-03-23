"""API contract tests for consult endpoint."""

from fastapi.testclient import TestClient

import backend.api.app as api_app
from backend.consensus.models import DebateRound, DebateSession


def test_consult_endpoint_returns_expected_shape(monkeypatch):
    """Validates response keys and nested round content."""
    async def fake_consult(**_kwargs):
        return DebateSession(
            session_id="20260315_210000",
            question="q",
            domain="role",
            rounds=[DebateRound(1, "a", "c", 8.2, "ok", "sum")],
            final_answer="final",
            final_score=8.2,
        )

    monkeypatch.setattr(api_app.ENGINE, "consult", fake_consult)
    client = TestClient(api_app.app)
    payload = {
        "writer": "openai/gpt-5.4",
        "critic_a": "anthropic/claude-sonnet-4.6",
        "critic_b": "google/gemini-3.1-pro",
        "max_rounds": 3,
        "consensus_score": 8,
        "role": "Engineer",
        "question": "How do we scale safely?",
    }
    response = client.post("/api/consult", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["session_id"] == "20260315_210000"
    assert body["final_answer"] == "final"
    assert isinstance(body["full_discussion"], list)
    assert body["full_discussion"][0]["round_num"] == 1
    assert "model_costs" in body
    assert "total_cost_usd" in body
    assert "total_tokens" in body

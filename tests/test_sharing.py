"""API contract tests for run sharing (share/unshare/shared) endpoints."""

import uuid

import pytest
from fastapi.testclient import TestClient

import backend.api.app as api_app
import backend.api.sessions as sessions_module
import backend.api.shared as shared_module
from backend.api.auth import current_active_user
from backend.consensus.models import DebateSession
from backend.storage.database import get_async_session
from backend.storage.db_models import User


@pytest.fixture
def client():
    fake_user = User(id=uuid.uuid4(), email="user@example.com")
    api_app.app.dependency_overrides[current_active_user] = lambda: fake_user
    api_app.app.dependency_overrides[get_async_session] = lambda: None
    yield TestClient(api_app.app)
    api_app.app.dependency_overrides.clear()


def test_share_session_returns_slug(client, monkeypatch):
    async def fake_share_session(session_id, db, user_id=None):
        assert session_id == "20260315_210000"
        return "my-question-ab12cd"

    monkeypatch.setattr(sessions_module, "share_session", fake_share_session)
    response = client.post("/api/sessions/20260315_210000/share")
    assert response.status_code == 200
    body = response.json()
    assert body == {"visibility": "public", "public_slug": "my-question-ab12cd"}


def test_share_session_not_found(client, monkeypatch):
    async def fake_share_session(session_id, db, user_id=None):
        return None

    monkeypatch.setattr(sessions_module, "share_session", fake_share_session)
    response = client.post("/api/sessions/missing/share")
    assert response.status_code == 404


def test_unshare_session(client, monkeypatch):
    async def fake_unshare_session(session_id, db, user_id=None):
        return True

    monkeypatch.setattr(sessions_module, "unshare_session", fake_unshare_session)
    response = client.post("/api/sessions/20260315_210000/unshare")
    assert response.status_code == 200
    assert response.json() == {"visibility": "private", "public_slug": None}


def test_unshare_session_not_found(client, monkeypatch):
    async def fake_unshare_session(session_id, db, user_id=None):
        return False

    monkeypatch.setattr(sessions_module, "unshare_session", fake_unshare_session)
    response = client.post("/api/sessions/missing/unshare")
    assert response.status_code == 404


def test_sessions_get_includes_share_info(client, monkeypatch):
    async def fake_load_session(session_id, db, user_id=None):
        return DebateSession(
            session_id="20260315_210000",
            question="q",
            domain="role",
            rounds=[],
            final_answer="final",
            final_score=8.2,
        )

    async def fake_get_share_info(session_id, db, user_id=None):
        return "public", "my-question-ab12cd"

    monkeypatch.setattr(sessions_module, "load_session", fake_load_session)
    monkeypatch.setattr(sessions_module, "get_share_info", fake_get_share_info)
    response = client.get("/api/sessions/20260315_210000")
    assert response.status_code == 200
    body = response.json()
    assert body["visibility"] == "public"
    assert body["public_slug"] == "my-question-ab12cd"


def test_shared_get_returns_session(client, monkeypatch):
    async def fake_load_shared_session(slug, db):
        assert slug == "my-question-ab12cd"
        return DebateSession(
            session_id="20260315_210000",
            question="q",
            domain="role",
            rounds=[],
            final_answer="final",
            final_score=8.2,
        )

    monkeypatch.setattr(shared_module, "load_shared_session", fake_load_shared_session)
    response = client.get("/api/shared/my-question-ab12cd")
    assert response.status_code == 200
    body = response.json()
    assert body["final_answer"] == "final"
    assert body["visibility"] == "public"
    assert body["public_slug"] == "my-question-ab12cd"


def test_shared_get_not_found(client, monkeypatch):
    async def fake_load_shared_session(slug, db):
        return None

    monkeypatch.setattr(shared_module, "load_shared_session", fake_load_shared_session)
    response = client.get("/api/shared/unknown-slug")
    assert response.status_code == 404

from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from app.core.orchestrator import Orchestrator, get_orchestrator
from app.main import app
from app.schemas.intake import ProjectBrief


@pytest.fixture
def client(fake_brief_payload):
    fake_brief = ProjectBrief.model_validate(fake_brief_payload)
    fake_orch = AsyncMock(spec=Orchestrator)
    fake_orch.run = AsyncMock(return_value=fake_brief)
    app.dependency_overrides[get_orchestrator] = lambda: fake_orch
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_intake_returns_brief(client):
    r = client.post(
        "/api/intake",
        json={"user_input": "I want to build a tenant-screening platform for AU."},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["brief"]["project_name"] == "Test Project"
    assert body["brief"]["open_questions"]


def test_intake_validates_input(client):
    r = client.post("/api/intake", json={"user_input": "short"})
    assert r.status_code == 422

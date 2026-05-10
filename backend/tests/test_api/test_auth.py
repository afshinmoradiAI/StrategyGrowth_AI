import pytest
from fastapi.testclient import TestClient

from app.core.db import PlanRepository, get_repository
from app.core.settings import Settings, get_settings, reset_settings
from app.main import app


@pytest.fixture
async def repo(tmp_path):
    r = PlanRepository(tmp_path / "test.db")
    await r.init()
    return r


@pytest.fixture
def auth_client(repo):
    secret = "secret-test-key"
    app.dependency_overrides[get_settings] = lambda: Settings(
        anthropic_api_key="test", app_api_key=secret
    )
    app.dependency_overrides[get_repository] = lambda: repo
    yield TestClient(app), secret
    app.dependency_overrides.clear()
    reset_settings()


def test_protected_route_rejects_missing_key(auth_client):
    client, _ = auth_client
    r = client.get("/api/plans")
    assert r.status_code == 401


def test_protected_route_rejects_wrong_key(auth_client):
    client, _ = auth_client
    r = client.get("/api/plans", headers={"X-API-Key": "wrong"})
    assert r.status_code == 401


def test_protected_route_accepts_correct_key(auth_client):
    client, secret = auth_client
    r = client.get("/api/plans", headers={"X-API-Key": secret})
    assert r.status_code == 200


def test_health_unprotected(auth_client):
    client, _ = auth_client
    r = client.get("/health")
    assert r.status_code == 200

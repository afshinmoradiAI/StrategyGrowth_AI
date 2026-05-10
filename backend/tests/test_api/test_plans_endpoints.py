import pytest
from fastapi.testclient import TestClient

from app.core.db import PlanRepository, get_repository
from app.main import app


@pytest.fixture
async def repo(tmp_path):
    r = PlanRepository(tmp_path / "test.db")
    await r.init()
    return r


@pytest.fixture
def client(repo):
    app.dependency_overrides[get_repository] = lambda: repo
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_list_and_get_plans(client, repo):
    pid = await repo.create("Some idea worth ten chars.")
    await repo.update_step(pid, "intake", {"project_name": "Demo"})
    await repo.mark_done(pid)

    r = client.get("/api/plans")
    assert r.status_code == 200
    summaries = r.json()["plans"]
    assert len(summaries) == 1
    assert summaries[0]["project_name"] == "Demo"
    assert summaries[0]["status"] == "done"

    r = client.get(f"/api/plans/{pid}")
    assert r.status_code == 200
    assert r.json()["brief"] == {"project_name": "Demo"}


def test_get_plan_404(client):
    r = client.get("/api/plans/does-not-exist")
    assert r.status_code == 404

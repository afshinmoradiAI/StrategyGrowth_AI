import json
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from app.core.db import PlanRepository, get_repository
from app.core.orchestrator import Orchestrator, get_orchestrator
from app.main import app


@pytest.fixture
async def repo(tmp_path):
    r = PlanRepository(tmp_path / "test.db")
    await r.init()
    return r


@pytest.fixture
def client(repo):
    fake = AsyncMock(spec=Orchestrator)

    async def fake_pipeline(_req):
        yield {"event": "agent_start", "data": {"agent": "intake"}}
        yield {
            "event": "agent_complete",
            "data": {
                "agent": "intake",
                "result": {"project_name": "Stub", "domain": "x", "summary": "y"},
            },
        }
        yield {"event": "done", "data": {"result": {"ok": True}}}

    fake.run_pipeline = fake_pipeline
    app.dependency_overrides[get_orchestrator] = lambda: fake
    app.dependency_overrides[get_repository] = lambda: repo
    yield TestClient(app)
    app.dependency_overrides.clear()


def _parse_sse(body: str):
    out = []
    for block in [b for b in body.strip().split("\n\n") if b]:
        lines = block.split("\n")
        ev = next(
            (line.split(": ", 1)[1] for line in lines if line.startswith("event: ")),
            None,
        )
        data = next(
            (line.split(": ", 1)[1] for line in lines if line.startswith("data: ")),
            None,
        )
        out.append((ev, json.loads(data) if data else None))
    return out


def test_plan_stream_emits_plan_created_first(client):
    with client.stream(
        "POST",
        "/api/plan",
        json={"user_input": "Build a planning agent for AU property managers."},
    ) as r:
        assert r.status_code == 200
        body = "".join(r.iter_text())

    parsed = _parse_sse(body)
    assert parsed[0][0] == "plan_created"
    assert "plan_id" in parsed[0][1]
    assert parsed[-1][0] == "done"


@pytest.mark.asyncio
async def test_plan_stream_persists_steps(client, repo):
    with client.stream(
        "POST",
        "/api/plan",
        json={"user_input": "Build a planning agent for AU property managers."},
    ) as r:
        body = "".join(r.iter_text())

    parsed = _parse_sse(body)
    plan_id = parsed[0][1]["plan_id"]

    stored = await repo.get(plan_id)
    assert stored is not None
    assert stored["status"] == "done"
    assert stored["brief"] == {
        "project_name": "Stub",
        "domain": "x",
        "summary": "y",
    }

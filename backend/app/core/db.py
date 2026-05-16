import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

import aiosqlite

from app.core.logging import get_logger

logger = get_logger("db")

AGENT_TO_COLUMN: dict[str, str] = {
    "intake": "brief",
    "research": "research",
    "strategy": "strategy",
    "plan": "roadmap",
    "risk": "risks",
}

_SCHEMA = """
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    user_input TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    brief TEXT,
    research TEXT,
    strategy TEXT,
    roadmap TEXT,
    risks TEXT,
    error TEXT
)
"""

_LEADS_SCHEMA = """
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    user_input TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at TEXT NOT NULL
)
"""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class PlanRepository:
    def __init__(self, db_path: Path):
        self.db_path = db_path

    async def init(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(_SCHEMA)
            await db.execute(_LEADS_SCHEMA)
            await db.commit()

    async def save_lead(self, email: str, user_input: str, source: str) -> str:
        lead_id = str(uuid4())
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "INSERT INTO leads (id, email, user_input, source, created_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (lead_id, email, user_input, source, _now()),
            )
            await db.commit()
        return lead_id

    async def create(self, user_input: str) -> str:
        plan_id = str(uuid4())
        now = _now()
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "INSERT INTO plans (id, user_input, status, created_at, updated_at) "
                "VALUES (?, ?, 'running', ?, ?)",
                (plan_id, user_input, now, now),
            )
            await db.commit()
        return plan_id

    async def update_step(
        self, plan_id: str, agent: str, result: dict[str, Any]
    ) -> None:
        col = AGENT_TO_COLUMN.get(agent)
        if col is None:
            return
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                f"UPDATE plans SET {col}=?, updated_at=? WHERE id=?",
                (json.dumps(result), _now(), plan_id),
            )
            await db.commit()

    async def mark_done(self, plan_id: str) -> None:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "UPDATE plans SET status='done', updated_at=? WHERE id=?",
                (_now(), plan_id),
            )
            await db.commit()

    async def mark_error(self, plan_id: str, message: str) -> None:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "UPDATE plans SET status='error', error=?, updated_at=? WHERE id=?",
                (message, _now(), plan_id),
            )
            await db.commit()

    async def list_summaries(self) -> list[dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT id, user_input, status, created_at, updated_at, brief "
                "FROM plans ORDER BY created_at DESC"
            )
            rows = await cur.fetchall()
        out = []
        for r in rows:
            project_name = None
            if r["brief"]:
                try:
                    project_name = json.loads(r["brief"]).get("project_name")
                except json.JSONDecodeError:
                    pass
            out.append(
                {
                    "id": r["id"],
                    "user_input": r["user_input"],
                    "status": r["status"],
                    "created_at": r["created_at"],
                    "updated_at": r["updated_at"],
                    "project_name": project_name,
                }
            )
        return out

    async def get(self, plan_id: str) -> dict[str, Any] | None:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT * FROM plans WHERE id=?", (plan_id,)
            )
            row = await cur.fetchone()
        if not row:
            return None

        def loads(v: str | None) -> Any:
            return json.loads(v) if v else None

        return {
            "id": row["id"],
            "user_input": row["user_input"],
            "status": row["status"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "error": row["error"],
            "brief": loads(row["brief"]),
            "research": loads(row["research"]),
            "strategy": loads(row["strategy"]),
            "roadmap": loads(row["roadmap"]),
            "risks": loads(row["risks"]),
        }


_repository: PlanRepository | None = None


def get_repository() -> PlanRepository:
    global _repository
    if _repository is None:
        from app.core.settings import get_settings

        _repository = PlanRepository(get_settings().db_path)
    return _repository


def reset_repository() -> None:
    global _repository
    _repository = None

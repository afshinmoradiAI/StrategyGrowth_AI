"""Plan tiers, monthly usage tracking, and per-user limits.

Tables (created lazily in `init()`):
    user_plans       — one row per user with tier
    monthly_usage    — token + generation count per user per month
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import aiosqlite


PLANS: dict[str, dict] = {
    "free": {
        "tier": "free",
        "label": "Free",
        "price_usd": 0,
        # Free tier: Haiku only, capped at 5 generations per month
        "monthly_token_limit": 100_000,
        "monthly_generation_limit": 5,
        "allowed_models": ["claude-haiku-4-5"],
        "available": True,
    },
    "pro": {
        "tier": "pro",
        "label": "Pro",
        "price_usd": 19,
        "monthly_token_limit": 2_000_000,
        "monthly_generation_limit": 200,
        "allowed_models": ["claude-haiku-4-5", "claude-sonnet-4-5"],
        "available": False,  # Coming soon
    },
    "lab": {
        "tier": "lab",
        "label": "Lab",
        "price_usd": 49,
        "monthly_token_limit": 8_000_000,
        "monthly_generation_limit": 1000,
        "allowed_models": [
            "claude-haiku-4-5",
            "claude-sonnet-4-5",
            "claude-opus-4-7",
        ],
        "available": False,  # Coming soon
    },
    "enterprise": {
        "tier": "enterprise",
        "label": "Enterprise",
        "price_usd": 200,
        "monthly_token_limit": 50_000_000,
        "monthly_generation_limit": 10_000,
        "allowed_models": [
            "claude-haiku-4-5",
            "claude-sonnet-4-5",
            "claude-opus-4-7",
        ],
        "available": False,  # Coming soon
    },
}


def get_plan(tier: str) -> dict:
    return PLANS.get(tier, PLANS["free"])


def _current_month() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


@dataclass
class UsageSnapshot:
    user_id: str
    tier: str
    month: str
    tokens_used: int
    generations_used: int
    token_limit: int
    generation_limit: int

    @property
    def tokens_remaining(self) -> int:
        return max(0, self.token_limit - self.tokens_used)

    @property
    def generations_remaining(self) -> int:
        return max(0, self.generation_limit - self.generations_used)


_SCHEMA = """
CREATE TABLE IF NOT EXISTS user_plans (
    user_id TEXT PRIMARY KEY,
    tier TEXT NOT NULL DEFAULT 'free',
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS monthly_usage (
    user_id TEXT NOT NULL,
    month TEXT NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    generations_used INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, month)
);
"""


class PlanStore:
    def __init__(self, db_path: Path):
        self.db_path = db_path

    async def init(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        async with aiosqlite.connect(self.db_path) as db:
            await db.executescript(_SCHEMA)
            await db.commit()

    async def get_tier(self, user_id: str) -> str:
        async with aiosqlite.connect(self.db_path) as db:
            cur = await db.execute(
                "SELECT tier FROM user_plans WHERE user_id=?", (user_id,)
            )
            row = await cur.fetchone()
        return row[0] if row else "free"

    async def set_tier(self, user_id: str, tier: str) -> None:
        if tier not in PLANS:
            raise ValueError(f"Unknown tier: {tier}")
        now = datetime.now(timezone.utc).isoformat()
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "INSERT INTO user_plans (user_id, tier, updated_at) VALUES (?, ?, ?) "
                "ON CONFLICT(user_id) DO UPDATE SET tier=excluded.tier, updated_at=excluded.updated_at",
                (user_id, tier, now),
            )
            await db.commit()

    async def get_usage(self, user_id: str) -> UsageSnapshot:
        tier = await self.get_tier(user_id)
        plan = get_plan(tier)
        month = _current_month()
        async with aiosqlite.connect(self.db_path) as db:
            cur = await db.execute(
                "SELECT tokens_used, generations_used FROM monthly_usage "
                "WHERE user_id=? AND month=?",
                (user_id, month),
            )
            row = await cur.fetchone()
        tokens, gens = (row[0], row[1]) if row else (0, 0)
        return UsageSnapshot(
            user_id=user_id,
            tier=tier,
            month=month,
            tokens_used=tokens,
            generations_used=gens,
            token_limit=plan["monthly_token_limit"],
            generation_limit=plan["monthly_generation_limit"],
        )

    async def add_usage(self, user_id: str, *, tokens: int = 0, generations: int = 0) -> None:
        month = _current_month()
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "INSERT INTO monthly_usage (user_id, month, tokens_used, generations_used) "
                "VALUES (?, ?, ?, ?) "
                "ON CONFLICT(user_id, month) DO UPDATE SET "
                "tokens_used = tokens_used + excluded.tokens_used, "
                "generations_used = generations_used + excluded.generations_used",
                (user_id, month, tokens, generations),
            )
            await db.commit()


_store: PlanStore | None = None


def get_plan_store() -> PlanStore:
    global _store
    if _store is None:
        from app.core.settings import get_settings

        _store = PlanStore(get_settings().db_path)
    return _store

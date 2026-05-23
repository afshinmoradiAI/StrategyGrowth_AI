"""Billing + plan info endpoints."""
from fastapi import APIRouter, Depends

from app.core.security import require_user
from app.services.plan_store import PLANS, PlanStore, get_plan_store

router = APIRouter(prefix="/api/billing", tags=["billing"])


@router.get("/plans")
async def list_plans() -> dict:
    return {"plans": list(PLANS.values())}


@router.get("/usage")
async def get_usage(
    token_data: dict = Depends(require_user),
    store: PlanStore = Depends(get_plan_store),
) -> dict:
    snap = await store.get_usage(token_data["sub"])
    plan = PLANS.get(snap.tier, PLANS["free"])
    return {
        "tier": snap.tier,
        "month": snap.month,
        "tokens_used": snap.tokens_used,
        "tokens_remaining": snap.tokens_remaining,
        "token_limit": snap.token_limit,
        "generations_used": snap.generations_used,
        "generations_remaining": snap.generations_remaining,
        "generation_limit": snap.generation_limit,
        "plan": plan,
    }

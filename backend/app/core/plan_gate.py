"""Plan-aware request gating.

Wrap any route that costs tokens with `Depends(plan_gate)`. It:
1. Reads the JWT user.
2. Looks up their monthly usage and plan tier.
3. Refuses (HTTP 402) if they have exceeded limits.
4. Pins the request model to the plan's `allowed_models` (falling back to the
   cheapest allowed model if the user asked for one outside their tier).
"""
from __future__ import annotations

from fastapi import Depends, HTTPException, status

from app.core.model_context import get_active_model, set_active_model
from app.core.security import require_user
from app.services.plan_store import PlanStore, get_plan, get_plan_store


class PlanLimitExceeded(HTTPException):
    def __init__(self, kind: str, detail: str):
        super().__init__(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "type": "https://strategygrowth.ai/errors/plan-limit-exceeded",
                "title": "Plan limit exceeded",
                "kind": kind,
                "detail": detail,
            },
        )


async def plan_gate(
    token_data: dict = Depends(require_user),
    store: PlanStore = Depends(get_plan_store),
) -> dict:
    user_id = token_data["sub"]
    snap = await store.get_usage(user_id)

    if snap.tokens_used >= snap.token_limit:
        raise PlanLimitExceeded(
            "tokens",
            f"You have used {snap.tokens_used:,} of {snap.token_limit:,} tokens "
            f"this month ({snap.tier} plan). Upgrade to continue.",
        )
    if snap.generations_used >= snap.generation_limit:
        raise PlanLimitExceeded(
            "generations",
            f"You have used {snap.generations_used} of {snap.generation_limit} "
            f"generations this month ({snap.tier} plan). Upgrade to continue.",
        )

    # Pin model to plan's allowed list.
    plan = get_plan(snap.tier)
    chosen = get_active_model()
    if chosen not in plan["allowed_models"]:
        # Downgrade silently to the first allowed (cheapest) model.
        set_active_model(plan["allowed_models"][0])

    return {
        "user_id": user_id,
        "email": token_data.get("email"),
        "tier": snap.tier,
    }

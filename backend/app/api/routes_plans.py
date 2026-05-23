from fastapi import APIRouter, Depends, HTTPException, status

from app.core.db import PlanRepository, get_repository
from app.core.security import require_user

router = APIRouter(prefix="/api/plans", tags=["plans"])


@router.get("")
async def list_plans(
    repo: PlanRepository = Depends(get_repository),
    user: dict = Depends(require_user),
):
    """List plans for the logged-in user only."""
    return {"plans": await repo.list_summaries(user_id=user["sub"])}


@router.get("/{plan_id}")
async def get_plan(
    plan_id: str,
    repo: PlanRepository = Depends(get_repository),
    user: dict = Depends(require_user),
):
    plan = await repo.get(plan_id)
    if plan is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Plan not found")
    if plan.get("user_id") and plan["user_id"] != user["sub"]:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Not your plan")
    return plan


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    plan_id: str,
    repo: PlanRepository = Depends(get_repository),
    user: dict = Depends(require_user),
):
    deleted = await repo.delete_plan(plan_id, user["sub"])
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return None

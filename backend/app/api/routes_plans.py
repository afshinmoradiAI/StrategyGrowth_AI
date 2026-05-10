from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import require_api_key
from app.core.db import PlanRepository, get_repository

router = APIRouter(
    prefix="/api/plans", tags=["plans"], dependencies=[Depends(require_api_key)]
)


@router.get("")
async def list_plans(repo: PlanRepository = Depends(get_repository)):
    return {"plans": await repo.list_summaries()}


@router.get("/{plan_id}")
async def get_plan(
    plan_id: str, repo: PlanRepository = Depends(get_repository)
):
    plan = await repo.get(plan_id)
    if plan is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return plan

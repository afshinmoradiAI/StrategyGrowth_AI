"""Public model catalogue."""
from fastapi import APIRouter

from app.core.model_context import MODELS

router = APIRouter(prefix="/api/models", tags=["models"])


@router.get("")
async def list_models() -> dict:
    return {"models": MODELS}

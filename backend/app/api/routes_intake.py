from fastapi import APIRouter, Depends

from app.core.orchestrator import Orchestrator, get_orchestrator
from app.schemas.intake import IntakeRequest, IntakeResponse, ProjectBrief

router = APIRouter(prefix="/api", tags=["intake"])


@router.post("/intake", response_model=IntakeResponse)
async def create_intake(
    req: IntakeRequest,
    orch: Orchestrator = Depends(get_orchestrator),
) -> IntakeResponse:
    brief = await orch.run("intake", req)
    assert isinstance(brief, ProjectBrief)
    return IntakeResponse(brief=brief)

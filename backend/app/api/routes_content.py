from fastapi import APIRouter, Depends, HTTPException

from app.schemas.content import ContentRequest, ContentResponse
from app.services.orchestrator import ContentOrchestrator

router = APIRouter(prefix="/content", tags=["content"])


def get_orchestrator() -> ContentOrchestrator:
    return ContentOrchestrator()


@router.post("/generate", response_model=ContentResponse)
async def generate_content(
    request: ContentRequest,
    orchestrator: ContentOrchestrator = Depends(get_orchestrator),
) -> ContentResponse:
    try:
        return await orchestrator.run(request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

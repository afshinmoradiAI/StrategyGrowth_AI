from fastapi import APIRouter, Depends, HTTPException

from app.agents import ICPBuilderAgent
from app.core.growth_dependencies import get_current_user_with_cookie
from app.db.models import User
from app.schemas.leads import (
    ICPParsed,
    ICPQuery,
    LeadSearchRequest,
    LeadSearchResponse,
)
from app.services.google_places import GooglePlacesError
from app.services.lead_orchestrator import LeadOrchestrator

router = APIRouter(
    prefix="/leads",
    tags=["leads"],
    dependencies=[Depends(get_current_user_with_cookie)],
)


def get_orchestrator() -> LeadOrchestrator:
    return LeadOrchestrator()


def get_icp_agent() -> ICPBuilderAgent:
    return ICPBuilderAgent()


@router.post("/search", response_model=LeadSearchResponse)
async def search_leads(
    request: LeadSearchRequest,
    orchestrator: LeadOrchestrator = Depends(get_orchestrator),
) -> LeadSearchResponse:
    try:
        return await orchestrator.run(request)
    except GooglePlacesError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/icp/parse", response_model=ICPParsed)
async def parse_icp(
    query: ICPQuery,
    icp_agent: ICPBuilderAgent = Depends(get_icp_agent),
) -> ICPParsed:
    return await icp_agent.run(query)


@router.post("/icp/search", response_model=LeadSearchResponse)
async def search_from_icp(
    query: ICPQuery,
    icp_agent: ICPBuilderAgent = Depends(get_icp_agent),
    orchestrator: LeadOrchestrator = Depends(get_orchestrator),
) -> LeadSearchResponse:
    parsed = await icp_agent.run(query)
    search_request = LeadSearchRequest(
        business_type=parsed.business_type,
        location=parsed.location,
        max_results=query.max_results,
        topic=parsed.topic,
        outreach_platform=parsed.outreach_platform,
    )
    try:
        return await orchestrator.run(search_request)
    except GooglePlacesError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.growth_database import get_db
from app.core.growth_dependencies import get_current_user_with_cookie
from app.db.models import User
from app.schemas.crm import (
    CRMImportRequest,
    CRMImportResponse,
    CRMLeadOut,
    CRMLeadSummary,
    CRMLeadUpdate,
    CRMStatus,
    CRMTouchMarkSent,
    CRMTouchOut,
)
from app.services.crm_service import CRMService

router = APIRouter(prefix="/crm", tags=["crm"])


def get_crm_service(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_with_cookie),
) -> CRMService:
    return CRMService(db, user_id=user.id)


@router.post(
    "/import", response_model=CRMImportResponse, status_code=status.HTTP_201_CREATED
)
def import_search_results(
    payload: CRMImportRequest,
    service: CRMService = Depends(get_crm_service),
) -> CRMImportResponse:
    lead_ids, skipped = service.import_search(payload.search, payload.channel.value)
    return CRMImportResponse(
        imported=len(lead_ids), skipped=skipped, lead_ids=lead_ids
    )


@router.get("/leads", response_model=list[CRMLeadSummary])
def list_leads(
    status_filter: CRMStatus | None = Query(default=None, alias="status"),
    tier: str | None = Query(default=None, pattern="^(hot|warm|cold)$"),
    limit: int = Query(default=100, ge=1, le=500),
    service: CRMService = Depends(get_crm_service),
) -> list[CRMLeadSummary]:
    leads = service.list_leads(status=status_filter, tier=tier, limit=limit)
    return [CRMLeadSummary.model_validate(lead) for lead in leads]


@router.get("/leads/{lead_id}", response_model=CRMLeadOut)
def get_lead(
    lead_id: str,
    service: CRMService = Depends(get_crm_service),
) -> CRMLeadOut:
    lead = service.get_lead(lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return CRMLeadOut.model_validate(lead)


@router.patch("/leads/{lead_id}", response_model=CRMLeadOut)
def update_lead(
    lead_id: str,
    update: CRMLeadUpdate,
    service: CRMService = Depends(get_crm_service),
) -> CRMLeadOut:
    lead = service.update_lead(lead_id, update)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return CRMLeadOut.model_validate(lead)


@router.delete("/leads/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(
    lead_id: str,
    service: CRMService = Depends(get_crm_service),
) -> None:
    deleted = service.delete_lead(lead_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Lead not found")


@router.post(
    "/leads/{lead_id}/touches/{touch_id}/sent",
    response_model=CRMTouchOut,
)
def mark_touch_sent(
    lead_id: str,
    touch_id: str,
    payload: CRMTouchMarkSent | None = None,
    service: CRMService = Depends(get_crm_service),
) -> CRMTouchOut:
    sent_at = payload.sent_at if payload else None
    touch = service.mark_touch_sent(lead_id, touch_id, sent_at)
    if touch is None:
        raise HTTPException(status_code=404, detail="Touch not found")
    return CRMTouchOut.model_validate(touch)

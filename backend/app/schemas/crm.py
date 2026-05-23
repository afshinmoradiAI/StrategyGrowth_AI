from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.content import Platform
from app.schemas.leads import LeadSearchResponse


class CRMStatus(str, Enum):
    new = "new"
    contacted = "contacted"
    replied = "replied"
    qualified = "qualified"
    won = "won"
    lost = "lost"


class CRMDecisionMakerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    title: str | None = None
    email: str | None = None
    email_candidates: list[str] = Field(default_factory=list)
    email_domain_verified: bool = False


class CRMTouchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    day_offset: int
    purpose: str
    subject: str | None = None
    body: str
    channel: str
    sent_at: datetime | None = None


class CRMLeadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    place_id: str
    name: str
    address: str | None = None
    phone: str | None = None
    website: str | None = None
    rating: float | None = None
    review_count: int | None = None
    business_type: str
    location: str
    score: int | None = None
    tier: str | None = None
    score_reasons: list[str] | None = None
    status: CRMStatus
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
    decision_makers: list[CRMDecisionMakerOut] = Field(default_factory=list)
    touches: list[CRMTouchOut] = Field(default_factory=list)


class CRMLeadSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    business_type: str
    location: str
    score: int | None = None
    tier: str | None = None
    status: CRMStatus
    updated_at: datetime


class CRMImportRequest(BaseModel):
    channel: Platform = Platform.linkedin
    search: LeadSearchResponse


class CRMImportResponse(BaseModel):
    imported: int
    skipped: int
    lead_ids: list[str]


class CRMLeadUpdate(BaseModel):
    status: CRMStatus | None = None
    notes: str | None = Field(default=None, max_length=4000)


class CRMTouchMarkSent(BaseModel):
    sent_at: datetime | None = None

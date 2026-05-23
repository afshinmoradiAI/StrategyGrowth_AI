from pydantic import BaseModel, Field

from app.schemas.content import Platform


class LeadSearchRequest(BaseModel):
    business_type: str = Field(..., min_length=2, max_length=200)
    location: str = Field(..., min_length=2, max_length=200)
    max_results: int = Field(default=10, ge=1, le=20)
    topic: str | None = Field(default=None, max_length=500)
    post_content: str | None = Field(default=None, max_length=4000)
    outreach_platform: Platform = Platform.linkedin


class DecisionMaker(BaseModel):
    name: str
    title: str | None = None
    email: str | None = None
    email_candidates: list[str] = Field(default_factory=list)
    email_domain_verified: bool = False


class DecisionMakerExtractionInput(BaseModel):
    business_name: str
    website_url: str
    page_text: str = Field(..., max_length=40000)


class DecisionMakerExtractionOutput(BaseModel):
    decision_makers: list[DecisionMaker] = Field(default_factory=list)


class Lead(BaseModel):
    name: str
    address: str | None = None
    phone: str | None = None
    website: str | None = None
    rating: float | None = None
    review_count: int | None = None
    place_id: str
    decision_makers: list[DecisionMaker] = Field(default_factory=list)


class OutreachInput(BaseModel):
    lead: Lead
    business_type: str
    topic: str | None = None
    post_content: str | None = None
    outreach_platform: Platform
    primary_contact: DecisionMaker | None = None


class Touch(BaseModel):
    day_offset: int = Field(..., ge=0, le=60)
    purpose: str = Field(..., max_length=120)
    subject: str | None = Field(default=None, max_length=200)
    body: str = Field(..., min_length=20, max_length=2000)


class OutreachSequence(BaseModel):
    touches: list[Touch] = Field(..., min_length=1, max_length=5)


class ICPQuery(BaseModel):
    query: str = Field(..., min_length=10, max_length=1000)
    max_results: int = Field(default=10, ge=1, le=20)


class ICPParsed(BaseModel):
    business_type: str = Field(..., min_length=2, max_length=200)
    location: str = Field(..., min_length=2, max_length=200)
    topic: str | None = Field(default=None, max_length=500)
    outreach_platform: Platform = Platform.linkedin
    rationale: str = Field(..., max_length=500)


class LeadScoringInput(BaseModel):
    lead: Lead
    business_type: str
    location: str
    topic: str | None = None


class LeadScore(BaseModel):
    score: int = Field(..., ge=0, le=100)
    tier: str = Field(..., pattern="^(hot|warm|cold)$")
    reasons: list[str] = Field(default_factory=list, max_length=5)


class LeadWithOutreach(BaseModel):
    lead: Lead
    outreach: OutreachSequence
    score: LeadScore | None = None


class LeadSearchResponse(BaseModel):
    business_type: str
    location: str
    count: int
    leads: list[LeadWithOutreach]

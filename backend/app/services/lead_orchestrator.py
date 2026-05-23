import asyncio

from app.agents import DecisionMakerAgent, LeadOutreachAgent, LeadScoringAgent
from app.core.logging import get_logger
from app.schemas.leads import (
    DecisionMaker,
    DecisionMakerExtractionInput,
    Lead,
    LeadScore,
    LeadScoringInput,
    LeadSearchRequest,
    LeadSearchResponse,
    LeadWithOutreach,
    OutreachInput,
)
from app.services.email_finder import EmailFinder
from app.services.google_places import GooglePlacesClient
from app.services.website_scraper import WebsiteScraper


class LeadOrchestrator:
    def __init__(
        self,
        places_client: GooglePlacesClient | None = None,
        outreach_agent: LeadOutreachAgent | None = None,
        decision_maker_agent: DecisionMakerAgent | None = None,
        website_scraper: WebsiteScraper | None = None,
        email_finder: EmailFinder | None = None,
        scoring_agent: LeadScoringAgent | None = None,
    ) -> None:
        self.places_client = places_client or GooglePlacesClient()
        self.outreach_agent = outreach_agent or LeadOutreachAgent()
        self.decision_maker_agent = decision_maker_agent or DecisionMakerAgent()
        self.website_scraper = website_scraper or WebsiteScraper()
        self.email_finder = email_finder or EmailFinder()
        self.scoring_agent = scoring_agent or LeadScoringAgent()
        self.logger = get_logger("orchestrator.leads")

    async def run(self, request: LeadSearchRequest) -> LeadSearchResponse:
        self.logger.info(
            "orchestrator start business_type=%r location=%r",
            request.business_type,
            request.location,
        )

        leads = await self.places_client.search_text(
            business_type=request.business_type,
            location=request.location,
            max_results=request.max_results,
        )
        self.logger.info("leads fetched count=%d", len(leads))

        if not leads:
            return LeadSearchResponse(
                business_type=request.business_type,
                location=request.location,
                count=0,
                leads=[],
            )

        enriched_leads = await asyncio.gather(
            *(self._enrich_with_decision_makers(lead) for lead in leads)
        )

        outreach_messages, scores = await asyncio.gather(
            asyncio.gather(
                *(self._outreach_for(lead, request) for lead in enriched_leads)
            ),
            asyncio.gather(
                *(self._score_for(lead, request) for lead in enriched_leads)
            ),
        )

        results = [
            LeadWithOutreach(lead=lead, outreach=message, score=score)
            for lead, message, score in zip(
                enriched_leads, outreach_messages, scores, strict=True
            )
        ]
        results.sort(
            key=lambda r: (r.score.score if r.score else -1), reverse=True
        )
        self.logger.info("orchestrator done count=%d", len(results))
        return LeadSearchResponse(
            business_type=request.business_type,
            location=request.location,
            count=len(results),
            leads=results,
        )

    async def _enrich_with_decision_makers(self, lead: Lead) -> Lead:
        if not lead.website:
            return lead
        try:
            page_text = await self.website_scraper.scrape(lead.website)
        except Exception as exc:
            self.logger.warning(
                "scrape failed lead=%s err=%s", lead.name, exc
            )
            return lead
        if not page_text:
            return lead
        try:
            result = await self.decision_maker_agent.run(
                DecisionMakerExtractionInput(
                    business_name=lead.name,
                    website_url=lead.website,
                    page_text=page_text,
                )
            )
        except Exception as exc:
            self.logger.warning(
                "decision-maker extraction failed lead=%s err=%s", lead.name, exc
            )
            return lead
        enriched = await self._enrich_emails(lead.website, result.decision_makers)
        return lead.model_copy(update={"decision_makers": enriched})

    async def _enrich_emails(
        self, website: str | None, decision_makers: list[DecisionMaker]
    ) -> list[DecisionMaker]:
        domain = self.email_finder.extract_domain(website)
        if not domain or not decision_makers:
            return decision_makers
        try:
            domain_verified = await self.email_finder.verify_domain(domain)
        except Exception as exc:
            self.logger.warning("mx verify failed domain=%s err=%s", domain, exc)
            domain_verified = False

        enriched: list[DecisionMaker] = []
        for dm in decision_makers:
            if dm.email:
                enriched.append(
                    dm.model_copy(update={"email_domain_verified": domain_verified})
                )
                continue
            candidates = self.email_finder.generate_candidates(dm.name, domain)
            enriched.append(
                dm.model_copy(
                    update={
                        "email_candidates": candidates,
                        "email_domain_verified": domain_verified,
                    }
                )
            )
        return enriched

    async def _score_for(
        self, lead: Lead, request: LeadSearchRequest
    ) -> LeadScore | None:
        try:
            return await self.scoring_agent.run(
                LeadScoringInput(
                    lead=lead,
                    business_type=request.business_type,
                    location=request.location,
                    topic=request.topic,
                )
            )
        except Exception as exc:
            self.logger.warning(
                "scoring failed lead=%s err=%s", lead.name, exc
            )
            return None

    async def _outreach_for(self, lead: Lead, request: LeadSearchRequest):
        primary = self._pick_primary_contact(lead.decision_makers)
        return await self.outreach_agent.run(
            OutreachInput(
                lead=lead,
                business_type=request.business_type,
                topic=request.topic,
                post_content=request.post_content,
                outreach_platform=request.outreach_platform,
                primary_contact=primary,
            )
        )

    @staticmethod
    def _pick_primary_contact(
        decision_makers: list[DecisionMaker],
    ) -> DecisionMaker | None:
        if not decision_makers:
            return None
        seniority_keywords = (
            "ceo",
            "founder",
            "co-founder",
            "owner",
            "managing director",
            "principal",
            "director",
        )
        for kw in seniority_keywords:
            for dm in decision_makers:
                title = (dm.title or "").lower()
                if kw in title:
                    return dm
        return decision_makers[0]

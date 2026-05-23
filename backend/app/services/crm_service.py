from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.db.models import CRMDecisionMaker, CRMLead, CRMTouch
from app.schemas.crm import CRMLeadUpdate, CRMStatus
from app.schemas.leads import LeadSearchResponse


class CRMService:
    def __init__(self, session: Session, user_id: str) -> None:
        self.session = session
        self.user_id = user_id
        self.logger = get_logger("service.crm")

    def import_search(
        self, search: LeadSearchResponse, channel: str
    ) -> tuple[list[str], int]:
        imported_ids: list[str] = []
        skipped = 0
        for item in search.leads:
            lead = item.lead
            existing = self.session.execute(
                select(CRMLead).where(
                    CRMLead.user_id == self.user_id,
                    CRMLead.place_id == lead.place_id,
                )
            ).scalar_one_or_none()
            if existing is not None:
                skipped += 1
                continue

            record = CRMLead(
                user_id=self.user_id,
                place_id=lead.place_id,
                name=lead.name,
                address=lead.address,
                phone=lead.phone,
                website=lead.website,
                rating=lead.rating,
                review_count=lead.review_count,
                business_type=search.business_type,
                location=search.location,
                score=item.score.score if item.score else None,
                tier=item.score.tier if item.score else None,
                score_reasons=item.score.reasons if item.score else None,
                status=CRMStatus.new.value,
                decision_makers=[
                    CRMDecisionMaker(
                        name=dm.name,
                        title=dm.title,
                        email=dm.email,
                        email_candidates=dm.email_candidates,
                        email_domain_verified=dm.email_domain_verified,
                    )
                    for dm in lead.decision_makers
                ],
                touches=[
                    CRMTouch(
                        day_offset=t.day_offset,
                        purpose=t.purpose,
                        subject=t.subject,
                        body=t.body,
                        channel=channel,
                    )
                    for t in item.outreach.touches
                ],
            )
            self.session.add(record)
            self.session.flush()
            imported_ids.append(record.id)

        self.session.commit()
        self.logger.info(
            "crm import user=%s imported=%d skipped=%d",
            self.user_id,
            len(imported_ids),
            skipped,
        )
        return imported_ids, skipped

    def list_leads(
        self,
        status: CRMStatus | None = None,
        tier: str | None = None,
        limit: int = 100,
    ) -> list[CRMLead]:
        stmt = (
            select(CRMLead)
            .where(CRMLead.user_id == self.user_id)
            .order_by(CRMLead.updated_at.desc())
            .limit(limit)
        )
        if status is not None:
            stmt = stmt.where(CRMLead.status == status.value)
        if tier is not None:
            stmt = stmt.where(CRMLead.tier == tier)
        return list(self.session.execute(stmt).scalars().all())

    def get_lead(self, lead_id: str) -> CRMLead | None:
        return self.session.execute(
            select(CRMLead).where(
                CRMLead.id == lead_id, CRMLead.user_id == self.user_id
            )
        ).scalar_one_or_none()

    def update_lead(
        self, lead_id: str, update: CRMLeadUpdate
    ) -> CRMLead | None:
        lead = self.get_lead(lead_id)
        if lead is None:
            return None
        if update.status is not None:
            lead.status = update.status.value
        if update.notes is not None:
            lead.notes = update.notes
        self.session.commit()
        self.session.refresh(lead)
        return lead

    def delete_lead(self, lead_id: str) -> bool:
        lead = self.get_lead(lead_id)
        if lead is None:
            return False
        self.session.delete(lead)
        self.session.commit()
        return True

    def mark_touch_sent(
        self, lead_id: str, touch_id: str, sent_at: datetime | None = None
    ) -> CRMTouch | None:
        # ensure the lead belongs to this user
        lead = self.get_lead(lead_id)
        if lead is None:
            return None
        touch = self.session.execute(
            select(CRMTouch).where(
                CRMTouch.id == touch_id, CRMTouch.lead_id == lead_id
            )
        ).scalar_one_or_none()
        if touch is None:
            return None
        touch.sent_at = sent_at or datetime.now(timezone.utc)
        self.session.commit()
        self.session.refresh(touch)
        return touch

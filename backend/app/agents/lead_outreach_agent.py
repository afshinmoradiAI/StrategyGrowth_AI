from app.core.growth_base_agent import BaseAgent
from app.schemas.leads import OutreachInput, OutreachSequence


class LeadOutreachAgent(BaseAgent[OutreachInput, OutreachSequence]):
    name = "lead_outreach_agent"
    output_model = OutreachSequence

    def build_user_message(self, payload: OutreachInput) -> str:
        lead = payload.lead
        lines = [
            f"Outreach platform: {payload.outreach_platform.value}",
            f"Business type: {payload.business_type}",
            f"Lead name: {lead.name}",
        ]
        if lead.address:
            lines.append(f"Address: {lead.address}")
        if lead.rating is not None and lead.review_count is not None:
            lines.append(
                f"Rating: {lead.rating} from {lead.review_count} reviews"
            )
        if payload.primary_contact:
            contact_line = f"Primary contact: {payload.primary_contact.name}"
            if payload.primary_contact.title:
                contact_line += f" ({payload.primary_contact.title})"
            lines.append(contact_line)
            lines.append(
                "Address the message to this person by first name in the opener."
            )
        if payload.topic:
            lines.append(f"Campaign topic: {payload.topic}")
        if payload.post_content:
            lines.append(
                f"Related social post (for context, do not quote):\n{payload.post_content}"
            )
        lines.append(
            "\nDesign a 3-touch outreach sequence (Day 1, Day 4, Day 8) for "
            "this lead and submit via the tool."
        )
        return "\n".join(lines)

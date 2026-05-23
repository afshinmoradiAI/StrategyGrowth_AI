from app.core.growth_base_agent import BaseAgent
from app.schemas.leads import LeadScore, LeadScoringInput


class LeadScoringAgent(BaseAgent[LeadScoringInput, LeadScore]):
    name = "lead_scoring_agent"
    output_model = LeadScore

    def build_user_message(self, payload: LeadScoringInput) -> str:
        lead = payload.lead
        lines = [
            "ICP:",
            f"  Business type: {payload.business_type}",
            f"  Location: {payload.location}",
        ]
        if payload.topic:
            lines.append(f"  Campaign topic: {payload.topic}")

        lines.append("\nLead:")
        lines.append(f"  Name: {lead.name}")
        if lead.address:
            lines.append(f"  Address: {lead.address}")
        if lead.phone:
            lines.append(f"  Phone: present")
        else:
            lines.append("  Phone: missing")
        if lead.website:
            lines.append(f"  Website: {lead.website}")
        else:
            lines.append("  Website: missing")
        if lead.rating is not None:
            lines.append(
                f"  Rating: {lead.rating} ({lead.review_count or 0} reviews)"
            )
        else:
            lines.append("  Rating: none")

        if lead.decision_makers:
            lines.append(f"  Decision-makers ({len(lead.decision_makers)}):")
            for dm in lead.decision_makers:
                title = dm.title or "unknown title"
                email_state = (
                    "explicit email"
                    if dm.email
                    else (
                        f"{len(dm.email_candidates)} guessed patterns"
                        if dm.email_candidates
                        else "no email"
                    )
                )
                lines.append(
                    f"    - {dm.name} ({title}) — {email_state}, "
                    f"domain_mx_verified={dm.email_domain_verified}"
                )
        else:
            lines.append("  Decision-makers: none found")

        lines.append("\nScore this lead and submit via the tool.")
        return "\n".join(lines)

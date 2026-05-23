from app.core.growth_base_agent import BaseAgent
from app.schemas.leads import (
    DecisionMakerExtractionInput,
    DecisionMakerExtractionOutput,
)


class DecisionMakerAgent(
    BaseAgent[DecisionMakerExtractionInput, DecisionMakerExtractionOutput]
):
    name = "decision_maker_agent"
    output_model = DecisionMakerExtractionOutput

    def build_user_message(self, payload: DecisionMakerExtractionInput) -> str:
        return (
            f"Business name: {payload.business_name}\n"
            f"Website: {payload.website_url}\n\n"
            "Website text content (homepage + about/team/contact pages):\n"
            "---\n"
            f"{payload.page_text}\n"
            "---\n\n"
            "Extract decision-makers from the text and submit via the tool."
        )

from app.core.growth_base_agent import BaseAgent
from app.schemas.leads import ICPParsed, ICPQuery


class ICPBuilderAgent(BaseAgent[ICPQuery, ICPParsed]):
    name = "icp_builder_agent"
    output_model = ICPParsed

    def build_user_message(self, payload: ICPQuery) -> str:
        return (
            "User's free-text lead request:\n"
            "---\n"
            f"{payload.query}\n"
            "---\n\n"
            "Extract the structured search brief and submit via the tool."
        )

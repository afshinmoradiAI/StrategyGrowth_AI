from app.core.base_agent import BaseAgent
from app.schemas.intake import IntakeRequest, ProjectBrief


class IntakeAgent(BaseAgent[IntakeRequest, ProjectBrief]):
    name = "intake"
    prompt_name = "intake"
    input_model = IntakeRequest
    output_model = ProjectBrief

    def _user_message(self, inp: IntakeRequest) -> str:
        return f"User project description:\n\n{inp.user_input}"

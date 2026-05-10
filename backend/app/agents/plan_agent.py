from app.core.base_agent import BaseAgent
from app.schemas.pipeline import PlanInput
from app.schemas.plan import Roadmap


class PlanAgent(BaseAgent[PlanInput, Roadmap]):
    name = "plan"
    prompt_name = "plan"
    input_model = PlanInput
    output_model = Roadmap

    def _user_message(self, inp: PlanInput) -> str:
        return (
            "Produce a roadmap and KPIs for this project, then submit as "
            "structured output.\n\n"
            f"Project brief:\n{inp.brief.model_dump_json(indent=2)}\n\n"
            f"Strategy:\n{inp.strategy.model_dump_json(indent=2)}"
        )

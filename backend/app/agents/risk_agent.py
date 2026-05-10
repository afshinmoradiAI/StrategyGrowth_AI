from app.core.base_agent import BaseAgent
from app.schemas.pipeline import RiskInput
from app.schemas.risk import RiskRegister


class RiskAgent(BaseAgent[RiskInput, RiskRegister]):
    name = "risk"
    prompt_name = "risk"
    input_model = RiskInput
    output_model = RiskRegister

    def _user_message(self, inp: RiskInput) -> str:
        return (
            "Produce a risk register for this project, then submit as "
            "structured output.\n\n"
            f"Project brief:\n{inp.brief.model_dump_json(indent=2)}\n\n"
            f"Strategy:\n{inp.strategy.model_dump_json(indent=2)}"
        )

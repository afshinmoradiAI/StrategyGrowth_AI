from app.core.base_agent import BaseAgent
from app.schemas.pipeline import StrategyInput
from app.schemas.strategy import Strategy


class StrategyAgent(BaseAgent[StrategyInput, Strategy]):
    name = "strategy"
    prompt_name = "strategy"
    input_model = StrategyInput
    output_model = Strategy

    def _user_message(self, inp: StrategyInput) -> str:
        return (
            "Synthesise a strategy from the brief and research below, then "
            "submit it as structured output.\n\n"
            f"Project brief:\n{inp.brief.model_dump_json(indent=2)}\n\n"
            f"Research findings:\n{inp.research.model_dump_json(indent=2)}"
        )

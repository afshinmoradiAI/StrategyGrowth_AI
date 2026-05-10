import asyncio
from collections.abc import AsyncIterator
from typing import Any

from anthropic import AsyncAnthropic
from pydantic import BaseModel

from app.agents.intake_agent import IntakeAgent
from app.agents.plan_agent import PlanAgent
from app.agents.research_agent import ResearchAgent
from app.agents.risk_agent import RiskAgent
from app.agents.strategy_agent import StrategyAgent
from app.core.base_agent import BaseAgent
from app.core.logging import get_logger
from app.core.settings import Settings
from app.schemas.intake import IntakeRequest, ProjectBrief
from app.schemas.pipeline import (
    PlanInput,
    PlanResult,
    RiskInput,
    StrategyInput,
)

logger = get_logger("orchestrator")


class Orchestrator:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.agents: dict[str, BaseAgent] = {
            "intake": IntakeAgent(self.client, settings),
            "research": ResearchAgent(self.client, settings),
            "strategy": StrategyAgent(self.client, settings),
            "plan": PlanAgent(self.client, settings),
            "risk": RiskAgent(self.client, settings),
        }

    async def run(self, agent_name: str, inp: BaseModel) -> BaseModel:
        if agent_name not in self.agents:
            raise KeyError(f"Unknown agent: {agent_name}")
        return await self.agents[agent_name].run(inp)

    async def run_pipeline(
        self, req: IntakeRequest
    ) -> AsyncIterator[dict[str, Any]]:
        """Run intake → research → strategy → (plan ∥ risk).

        Yields events of shape {"event": <name>, "data": <dict>} suitable for SSE.
        """

        def evt(name: str, data: dict[str, Any]) -> dict[str, Any]:
            return {"event": name, "data": data}

        # 1. Intake
        yield evt("agent_start", {"agent": "intake"})
        brief: ProjectBrief = await self.agents["intake"].run(req)  # type: ignore[assignment]
        yield evt("agent_complete", {"agent": "intake", "result": brief.model_dump()})

        # 2. Research
        yield evt("agent_start", {"agent": "research"})
        research = await self.agents["research"].run(brief)
        yield evt(
            "agent_complete",
            {"agent": "research", "result": research.model_dump()},
        )

        # 3. Strategy
        yield evt("agent_start", {"agent": "strategy"})
        strategy = await self.agents["strategy"].run(
            StrategyInput(brief=brief, research=research)  # type: ignore[arg-type]
        )
        yield evt(
            "agent_complete",
            {"agent": "strategy", "result": strategy.model_dump()},
        )

        # 4. Plan + Risk in parallel
        yield evt("agent_start", {"agent": "plan"})
        yield evt("agent_start", {"agent": "risk"})
        plan_task = asyncio.create_task(
            self.agents["plan"].run(
                PlanInput(brief=brief, strategy=strategy)  # type: ignore[arg-type]
            )
        )
        risk_task = asyncio.create_task(
            self.agents["risk"].run(
                RiskInput(brief=brief, strategy=strategy)  # type: ignore[arg-type]
            )
        )
        roadmap, risks = await asyncio.gather(plan_task, risk_task)
        yield evt(
            "agent_complete", {"agent": "plan", "result": roadmap.model_dump()}
        )
        yield evt(
            "agent_complete", {"agent": "risk", "result": risks.model_dump()}
        )

        result = PlanResult(
            brief=brief,  # type: ignore[arg-type]
            research=research,  # type: ignore[arg-type]
            strategy=strategy,  # type: ignore[arg-type]
            roadmap=roadmap,  # type: ignore[arg-type]
            risks=risks,  # type: ignore[arg-type]
        )
        yield evt("done", {"result": result.model_dump()})


_orchestrator: Orchestrator | None = None


def get_orchestrator() -> Orchestrator:
    global _orchestrator
    if _orchestrator is None:
        from app.core.settings import get_settings

        _orchestrator = Orchestrator(get_settings())
    return _orchestrator

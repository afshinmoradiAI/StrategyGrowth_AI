import pytest

from app.agents.plan_agent import PlanAgent
from app.agents.research_agent import ResearchAgent
from app.agents.risk_agent import RiskAgent
from app.agents.strategy_agent import StrategyAgent
from app.core.settings import Settings
from app.schemas.intake import ProjectBrief
from app.schemas.pipeline import PlanInput, RiskInput, StrategyInput
from app.schemas.plan import Roadmap
from app.schemas.research import ResearchFindings
from app.schemas.risk import RiskRegister
from app.schemas.strategy import Strategy


@pytest.fixture
def settings():
    return Settings(anthropic_api_key="test-key")


@pytest.mark.asyncio
async def test_research_agent_uses_web_search_with_auto_choice(
    make_client, fake_research_payload, fake_brief_payload, settings
):
    client = make_client("submit_researchfindings", fake_research_payload)
    agent = ResearchAgent(client, settings)
    findings = await agent.run(ProjectBrief.model_validate(fake_brief_payload))

    assert isinstance(findings, ResearchFindings)
    kwargs = client.messages.create.await_args.kwargs
    assert kwargs["tool_choice"] == {"type": "auto"}
    tool_names = [t["name"] for t in kwargs["tools"]]
    assert "submit_researchfindings" in tool_names
    assert "web_search" in tool_names


@pytest.mark.asyncio
async def test_strategy_agent(
    make_client,
    fake_strategy_payload,
    fake_brief_payload,
    fake_research_payload,
    settings,
):
    client = make_client("submit_strategy", fake_strategy_payload)
    agent = StrategyAgent(client, settings)
    strategy = await agent.run(
        StrategyInput(
            brief=ProjectBrief.model_validate(fake_brief_payload),
            research=ResearchFindings.model_validate(fake_research_payload),
        )
    )
    assert isinstance(strategy, Strategy)
    assert strategy.value_propositions == ["Faster", "Cheaper"]


@pytest.mark.asyncio
async def test_plan_agent(
    make_client,
    fake_roadmap_payload,
    fake_brief_payload,
    fake_strategy_payload,
    settings,
):
    client = make_client("submit_roadmap", fake_roadmap_payload)
    agent = PlanAgent(client, settings)
    roadmap = await agent.run(
        PlanInput(
            brief=ProjectBrief.model_validate(fake_brief_payload),
            strategy=Strategy.model_validate(fake_strategy_payload),
        )
    )
    assert isinstance(roadmap, Roadmap)
    assert roadmap.phases[0].id == "p1"
    assert roadmap.kpis[0].name == "Activation"


@pytest.mark.asyncio
async def test_risk_agent(
    make_client,
    fake_risks_payload,
    fake_brief_payload,
    fake_strategy_payload,
    settings,
):
    client = make_client("submit_riskregister", fake_risks_payload)
    agent = RiskAgent(client, settings)
    register = await agent.run(
        RiskInput(
            brief=ProjectBrief.model_validate(fake_brief_payload),
            strategy=Strategy.model_validate(fake_strategy_payload),
        )
    )
    assert isinstance(register, RiskRegister)
    assert register.risks[0].likelihood == "medium"

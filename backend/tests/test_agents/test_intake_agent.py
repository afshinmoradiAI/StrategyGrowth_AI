import pytest

from app.agents.intake_agent import IntakeAgent
from app.core.settings import Settings
from app.schemas.intake import IntakeRequest, ProjectBrief


@pytest.mark.asyncio
async def test_intake_agent_returns_project_brief(mock_anthropic_client):
    settings = Settings(anthropic_api_key="test-key")
    agent = IntakeAgent(mock_anthropic_client, settings)

    brief = await agent.run(
        IntakeRequest(user_input="Build a SaaS for Australian property managers.")
    )

    assert isinstance(brief, ProjectBrief)
    assert brief.project_name == "Test Project"
    assert brief.goals == ["Goal 1", "Goal 2"]
    assert brief.open_questions and "budget" in brief.open_questions[0].lower()


@pytest.mark.asyncio
async def test_intake_agent_calls_model_with_forced_tool(mock_anthropic_client):
    settings = Settings(anthropic_api_key="test-key", default_model="claude-x")
    agent = IntakeAgent(mock_anthropic_client, settings)

    await agent.run(IntakeRequest(user_input="Some idea worth ten chars."))

    call = mock_anthropic_client.messages.create.await_args
    kwargs = call.kwargs
    assert kwargs["model"] == "claude-x"
    assert kwargs["tool_choice"]["type"] == "tool"
    assert kwargs["tool_choice"]["name"] == "submit_projectbrief"
    assert kwargs["tools"][0]["input_schema"]["type"] == "object"

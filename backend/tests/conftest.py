import os
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import pytest

os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")


def _client_returning(tool_name: str, payload: dict[str, Any]):
    """Build an AsyncAnthropic stub whose messages.create returns one tool_use block."""
    tool_block = SimpleNamespace(type="tool_use", name=tool_name, input=payload)
    response = SimpleNamespace(
        content=[tool_block],
        usage=SimpleNamespace(input_tokens=10, output_tokens=20),
    )
    return SimpleNamespace(
        messages=SimpleNamespace(create=AsyncMock(return_value=response))
    )


@pytest.fixture
def fake_brief_payload() -> dict:
    return {
        "project_name": "Test Project",
        "domain": "test-domain",
        "summary": "A short summary.",
        "goals": ["Goal 1", "Goal 2"],
        "target_audience": ["Users"],
        "constraints": ["Budget unspecified"],
        "success_criteria": ["At least one paying customer"],
        "timeline": None,
        "budget": None,
        "stakeholders": [{"role": "Founder", "interest": "Owns vision"}],
        "open_questions": ["What is the budget?"],
    }


@pytest.fixture
def fake_research_payload() -> dict:
    return {
        "market_overview": "Small but growing.",
        "competitors": [
            {
                "name": "Acme",
                "description": "Incumbent",
                "strengths": ["brand"],
                "weaknesses": ["legacy stack"],
            }
        ],
        "trends": ["AI adoption"],
        "benchmarks": ["~5% conversion"],
        "observed_risks": ["Regulatory shift"],
        "sources": [{"title": "Report", "url": "https://example.com", "note": None}],
    }


@pytest.fixture
def fake_strategy_payload() -> dict:
    return {
        "positioning": "For X, we offer Y unlike Z.",
        "value_propositions": ["Faster", "Cheaper"],
        "differentiators": ["Local data"],
        "objectives": [
            {"objective": "Win 10 design partners", "rationale": "Validates demand"}
        ],
        "assumptions": ["Buyers exist"],
    }


@pytest.fixture
def fake_roadmap_payload() -> dict:
    return {
        "phases": [
            {
                "id": "p1",
                "name": "Discovery",
                "duration": "4 weeks",
                "objective": "Validate problem",
                "milestones": [
                    {
                        "id": "p1-m1",
                        "title": "5 customer interviews",
                        "target": "end of week 4",
                        "tasks": [
                            {
                                "id": "p1-m1-t1",
                                "title": "Recruit",
                                "description": "Find 10 candidates",
                                "estimate": "1 week",
                                "dependencies": [],
                            }
                        ],
                    }
                ],
            }
        ],
        "kpis": [
            {"name": "Activation", "target": "30%", "measurement": "signups → first action"}
        ],
    }


@pytest.fixture
def fake_risks_payload() -> dict:
    return {
        "risks": [
            {
                "id": "r1",
                "description": "No paying customers found",
                "category": "market",
                "likelihood": "medium",
                "impact": "high",
                "mitigation": "Run paid pilot in week 6",
                "owner": "Founder",
            }
        ]
    }


@pytest.fixture
def mock_anthropic_client(fake_brief_payload):
    """Default stub: returns a ProjectBrief tool_use block."""
    return _client_returning("submit_projectbrief", fake_brief_payload)


@pytest.fixture
def make_client():
    return _client_returning

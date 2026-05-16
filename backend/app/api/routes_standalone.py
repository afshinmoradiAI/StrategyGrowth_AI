import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.core.db import PlanRepository, get_repository
from app.core.logging import get_logger
from app.core.orchestrator import Orchestrator, get_orchestrator
from app.schemas.intake import IntakeRequest, ProjectBrief
from app.schemas.lead import LeadCapture, LeadResponse
from app.schemas.pipeline import RiskInput, StrategyInput
from app.schemas.research import ResearchFindings
from app.schemas.strategy import Strategy

router = APIRouter(prefix="/api/standalone", tags=["standalone"])
logger = get_logger("api.standalone")


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@router.post("/lead", response_model=LeadResponse)
async def capture_lead(
    req: LeadCapture,
    repo: PlanRepository = Depends(get_repository),
) -> LeadResponse:
    """Capture an email + project idea before running the free research tool."""
    lead_id = await repo.save_lead(req.email, req.user_input, source="research")
    logger.info("lead_captured id=%s email=%s", lead_id, req.email)
    return LeadResponse(id=lead_id)


@router.post("/research")
async def run_research(
    req: IntakeRequest,
    orch: Orchestrator = Depends(get_orchestrator),
) -> StreamingResponse:
    """Free tier: market & competitor analysis only. Streams SSE progress."""

    async def stream():
        try:
            yield _sse("agent_start", {"agent": "intake"})
            brief = await orch.run("intake", req)
            assert isinstance(brief, ProjectBrief)
            yield _sse(
                "agent_complete",
                {"agent": "intake", "result": brief.model_dump()},
            )

            yield _sse("agent_start", {"agent": "research"})
            research = await orch.run("research", brief)
            yield _sse(
                "agent_complete",
                {"agent": "research", "result": research.model_dump()},
            )
            yield _sse("done", {})
        except Exception as exc:  # noqa: BLE001
            logger.exception("standalone_research_failed")
            yield _sse("error", {"message": str(exc), "type": type(exc).__name__})

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/strategy")
async def run_strategy(
    req: IntakeRequest,
    orch: Orchestrator = Depends(get_orchestrator),
) -> StreamingResponse:
    """Paid tier: go-to-market strategy. Runs intake → research → strategy."""

    async def stream():
        try:
            yield _sse("agent_start", {"agent": "intake"})
            brief = await orch.run("intake", req)
            assert isinstance(brief, ProjectBrief)
            yield _sse(
                "agent_complete",
                {"agent": "intake", "result": brief.model_dump()},
            )

            yield _sse("agent_start", {"agent": "research"})
            research = await orch.run("research", brief)
            assert isinstance(research, ResearchFindings)
            yield _sse(
                "agent_complete",
                {"agent": "research", "result": research.model_dump()},
            )

            yield _sse("agent_start", {"agent": "strategy"})
            strategy = await orch.run(
                "strategy", StrategyInput(brief=brief, research=research)
            )
            yield _sse(
                "agent_complete",
                {"agent": "strategy", "result": strategy.model_dump()},
            )
            yield _sse("done", {})
        except Exception as exc:  # noqa: BLE001
            logger.exception("standalone_strategy_failed")
            yield _sse("error", {"message": str(exc), "type": type(exc).__name__})

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/risk")
async def run_risk(
    req: IntakeRequest,
    orch: Orchestrator = Depends(get_orchestrator),
) -> StreamingResponse:
    """Paid tier: risk register. Runs intake → research → strategy → risk."""

    async def stream():
        try:
            yield _sse("agent_start", {"agent": "intake"})
            brief = await orch.run("intake", req)
            assert isinstance(brief, ProjectBrief)
            yield _sse(
                "agent_complete",
                {"agent": "intake", "result": brief.model_dump()},
            )

            yield _sse("agent_start", {"agent": "research"})
            research = await orch.run("research", brief)
            assert isinstance(research, ResearchFindings)
            yield _sse(
                "agent_complete",
                {"agent": "research", "result": research.model_dump()},
            )

            yield _sse("agent_start", {"agent": "strategy"})
            strategy = await orch.run(
                "strategy", StrategyInput(brief=brief, research=research)
            )
            assert isinstance(strategy, Strategy)
            yield _sse(
                "agent_complete",
                {"agent": "strategy", "result": strategy.model_dump()},
            )

            yield _sse("agent_start", {"agent": "risk"})
            risks = await orch.run(
                "risk", RiskInput(brief=brief, strategy=strategy)
            )
            yield _sse(
                "agent_complete",
                {"agent": "risk", "result": risks.model_dump()},
            )
            yield _sse("done", {})
        except Exception as exc:  # noqa: BLE001
            logger.exception("standalone_risk_failed")
            yield _sse("error", {"message": str(exc), "type": type(exc).__name__})

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.core.auth import require_api_key
from app.core.db import PlanRepository, get_repository
from app.core.logging import get_logger
from app.core.orchestrator import Orchestrator, get_orchestrator
from app.schemas.intake import IntakeRequest

router = APIRouter(prefix="/api", tags=["plan"], dependencies=[Depends(require_api_key)])
logger = get_logger("api.plan")


@router.post("/plan")
async def create_plan(
    req: IntakeRequest,
    orch: Orchestrator = Depends(get_orchestrator),
    repo: PlanRepository = Depends(get_repository),
) -> StreamingResponse:
    """Run the full planning pipeline. Streams progress as Server-Sent Events.

    First event is `plan_created` with the new plan_id; the row is updated as
    each agent completes, then marked 'done' or 'error'.
    """

    async def event_stream():
        plan_id = await repo.create(req.user_input)
        yield (
            "event: plan_created\n"
            f"data: {json.dumps({'plan_id': plan_id})}\n\n"
        )
        try:
            async for ev in orch.run_pipeline(req):
                yield f"event: {ev['event']}\ndata: {json.dumps(ev['data'])}\n\n"
                if ev["event"] == "agent_complete":
                    await repo.update_step(
                        plan_id, ev["data"]["agent"], ev["data"]["result"]
                    )
                elif ev["event"] == "done":
                    await repo.mark_done(plan_id)
        except Exception as exc:  # noqa: BLE001 — convert to SSE error frame
            logger.exception("pipeline_failed plan_id=%s", plan_id)
            await repo.mark_error(plan_id, str(exc))
            err = json.dumps({"message": str(exc), "type": type(exc).__name__})
            yield f"event: error\ndata: {err}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

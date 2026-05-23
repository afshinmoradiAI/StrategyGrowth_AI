"""Extended plan routes: PDF export and follow-up chat."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response

from app.core.db import PlanRepository, get_repository
from app.core.logging import get_logger
from app.core.orchestrator import Orchestrator, get_orchestrator
from app.core.security import require_user
from app.schemas.chat import ChatMessage, ChatRequest, ChatResponse
from app.services.chat_service import chat_about_plan
from app.services.docx_export import render_plan_docx
from app.services.pdf_export import generate_plan_pdf

router = APIRouter(prefix="/api/plans", tags=["plans-ext"])
logger = get_logger("api.plans-ext")


def _assert_owner(plan: dict, user_id: str) -> None:
    if plan.get("user_id") and plan["user_id"] != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Not your plan")


@router.get("/{plan_id}/pdf")
async def export_plan_pdf(
    plan_id: str,
    repo: PlanRepository = Depends(get_repository),
    user: dict = Depends(require_user),
) -> Response:
    """Generate and return the plan as a PDF file."""
    plan = await repo.get(plan_id)
    if plan is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Plan not found")
    _assert_owner(plan, user["sub"])

    pdf_bytes = generate_plan_pdf(plan)
    name = (plan.get("brief") or {}).get("project_name", "plan").replace(" ", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{name}.pdf"',
        },
    )


@router.get("/{plan_id}/docx")
async def export_plan_docx(
    plan_id: str,
    repo: PlanRepository = Depends(get_repository),
    user: dict = Depends(require_user),
) -> Response:
    """Generate and return the plan as a Word .docx file."""
    plan = await repo.get(plan_id)
    if plan is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Plan not found")
    _assert_owner(plan, user["sub"])

    data = render_plan_docx(plan)
    name = (plan.get("brief") or {}).get("project_name", "plan").replace(" ", "_")
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{name}.docx"'},
    )


@router.get("/{plan_id}/chat")
async def list_chat(
    plan_id: str,
    repo: PlanRepository = Depends(get_repository),
    user: dict = Depends(require_user),
) -> dict:
    plan = await repo.get(plan_id)
    if plan is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Plan not found")
    _assert_owner(plan, user["sub"])
    return {"messages": await repo.list_chat_messages(plan_id)}


@router.post("/{plan_id}/chat", response_model=ChatResponse)
async def post_chat(
    plan_id: str,
    req: ChatRequest,
    repo: PlanRepository = Depends(get_repository),
    orch: Orchestrator = Depends(get_orchestrator),
    user: dict = Depends(require_user),
) -> ChatResponse:
    plan = await repo.get(plan_id)
    if plan is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Plan not found")
    _assert_owner(plan, user["sub"])

    history = await repo.list_chat_messages(plan_id)
    await repo.add_chat_message(plan_id, role="user", content=req.message)

    reply_text = await chat_about_plan(
        client=orch.client,
        settings=orch.settings,
        plan=plan,
        history=[{"role": m["role"], "content": m["content"]} for m in history],
        user_message=req.message,
    )
    reply_id = await repo.add_chat_message(plan_id, role="assistant", content=reply_text)

    msgs = await repo.list_chat_messages(plan_id)
    reply = next(m for m in msgs if m["id"] == reply_id)
    return ChatResponse(
        reply=ChatMessage(
            id=reply["id"],
            role=reply["role"],
            content=reply["content"],
            created_at=reply["created_at"],
        )
    )

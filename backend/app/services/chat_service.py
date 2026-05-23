"""Follow-up chat about a generated plan, using Claude with plan as context."""
from __future__ import annotations

import json
from typing import Any

from anthropic import AsyncAnthropic

from app.core.logging import get_logger
from app.core.settings import Settings

logger = get_logger("chat")

SYSTEM_PROMPT = """You are a strategic advisor helping a CEO or project manager
discuss their AI-generated business plan. The user already has a complete plan
covering project brief, market research, GTM strategy, roadmap, and risks.

Your job is to answer follow-up questions, expand sections, run what-if scenarios,
and give pragmatic, specific advice grounded in the plan. Be concise (2-5 short
paragraphs unless asked for depth). Reference specific items from the plan when
relevant. If asked to modify the plan, describe the change clearly — do not
invent new structure beyond what would naturally extend the existing plan."""


def _plan_to_context(plan: dict[str, Any]) -> str:
    """Compact JSON of the plan, used as the assistant's working memory."""
    payload = {k: plan.get(k) for k in ("brief", "research", "strategy", "roadmap", "risks")}
    return json.dumps(payload, indent=2, default=str)


async def chat_about_plan(
    client: AsyncAnthropic,
    settings: Settings,
    plan: dict[str, Any],
    history: list[dict[str, str]],
    user_message: str,
) -> str:
    """Send the message + history + plan to Claude, return the reply text."""
    plan_block = _plan_to_context(plan)
    system_blocks = [
        {"type": "text", "text": SYSTEM_PROMPT},
        {
            "type": "text",
            "text": f"--- PLAN CONTEXT ---\n{plan_block}",
            "cache_control": {"type": "ephemeral"},
        },
    ]
    messages: list[dict[str, Any]] = []
    for m in history:
        messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": user_message})

    response = await client.messages.create(
        model=settings.default_model,
        max_tokens=1500,
        system=system_blocks,
        messages=messages,
    )
    reply = ""
    for block in response.content:
        if getattr(block, "type", None) == "text":
            reply += getattr(block, "text", "")
    logger.info(
        "chat_reply input=%s output=%s",
        response.usage.input_tokens, response.usage.output_tokens,
    )
    return reply.strip()

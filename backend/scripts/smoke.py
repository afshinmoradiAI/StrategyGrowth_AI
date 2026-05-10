"""Live-API smoke test.

Runs the intake agent against the real Anthropic API to validate that the
configured model accepts the tool-use schema and prompt-caching headers.

Usage:
    cd backend && uv run python scripts/smoke.py
"""

import asyncio
import sys

from app.core.orchestrator import Orchestrator
from app.core.settings import get_settings
from app.schemas.intake import IntakeRequest

PLACEHOLDER_KEYS = {"", "missing", "your-key-here"}


async def main() -> None:
    settings = get_settings()
    if settings.anthropic_api_key in PLACEHOLDER_KEYS:
        print(
            "ERROR: ANTHROPIC_API_KEY is not set in backend/.env",
            file=sys.stderr,
        )
        sys.exit(1)

    orch = Orchestrator(settings)
    print(f"Model: {settings.default_model}")
    print("Running intake agent...\n")
    brief = await orch.run(
        "intake",
        IntakeRequest(
            user_input=(
                "I want to build a SaaS that helps Australian property "
                "managers track maintenance, compliance and tenant comms. "
                "Two co-founders, six-month runway, pre-revenue."
            )
        ),
    )
    print(brief.model_dump_json(indent=2))


if __name__ == "__main__":
    asyncio.run(main())

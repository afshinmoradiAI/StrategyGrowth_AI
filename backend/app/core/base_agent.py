from abc import ABC
from typing import Any, ClassVar, Generic, TypeVar

import anthropic
from anthropic import AsyncAnthropic
from pydantic import BaseModel
from tenacity import (
    AsyncRetrying,
    RetryError,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential_jitter,
)

from app.core.logging import get_logger
from app.core.model_context import get_active_model
from app.core.prompts import load_prompt
from app.core.settings import Settings
from app.core.usage import record_anthropic_usage

InT = TypeVar("InT", bound=BaseModel)
OutT = TypeVar("OutT", bound=BaseModel)

logger = get_logger("agent")

_RETRYABLE = (
    anthropic.APIConnectionError,
    anthropic.APITimeoutError,
    anthropic.InternalServerError,
    anthropic.RateLimitError,
)


class BaseAgent(ABC, Generic[InT, OutT]):
    name: str
    prompt_name: str
    input_model: type[BaseModel]
    output_model: type[BaseModel]
    server_tools: ClassVar[list[dict[str, Any]]] = []

    def __init__(self, client: AsyncAnthropic, settings: Settings):
        self.client = client
        self.settings = settings
        self.system_prompt = load_prompt(self.prompt_name)

    def _submit_tool(self) -> dict:
        return {
            "name": f"submit_{self.output_model.__name__.lower()}",
            "description": (
                f"Return the structured {self.output_model.__name__} result. "
                "Always call this exactly once with complete data."
            ),
            "input_schema": self.output_model.model_json_schema(),
        }

    def _user_message(self, inp: InT) -> str:
        return inp.model_dump_json()

    async def _call(self, tools, tool_choice, system_blocks, user_msg, model):
        return await self.client.messages.create(
            model=model,
            max_tokens=min(
                self.settings.max_tokens,
                self.settings.max_output_tokens_per_call,
            ),
            system=system_blocks,
            tools=tools,
            tool_choice=tool_choice,
            messages=[{"role": "user", "content": user_msg}],
        )

    async def run(self, inp: InT) -> OutT:
        model = get_active_model()
        logger.info("agent_start", agent=self.name, model=model)
        submit_tool = self._submit_tool()
        tools: list[dict[str, Any]] = [submit_tool, *self.server_tools]
        # Mark last tool with cache_control so system+tools are cached.
        tools[-1] = {**tools[-1], "cache_control": {"type": "ephemeral"}}
        tool_choice: dict[str, Any] = (
            {"type": "auto"}
            if self.server_tools
            else {"type": "tool", "name": submit_tool["name"]}
        )
        system_blocks = [
            {
                "type": "text",
                "text": self.system_prompt,
                "cache_control": {"type": "ephemeral"},
            }
        ]
        user_msg = self._user_message(inp)

        retrying = AsyncRetrying(
            retry=retry_if_exception_type(_RETRYABLE),
            stop=stop_after_attempt(self.settings.agent_max_retries),
            wait=wait_exponential_jitter(
                initial=self.settings.agent_retry_min_seconds,
                max=self.settings.agent_retry_max_seconds,
            ),
            reraise=True,
        )
        try:
            async for attempt in retrying:
                with attempt:
                    message = await self._call(
                        tools, tool_choice, system_blocks, user_msg, model
                    )
        except RetryError as exc:  # pragma: no cover
            raise exc.last_attempt.exception() from exc

        usage = message.usage
        record_anthropic_usage(usage, model=model)
        cache_read = getattr(usage, "cache_read_input_tokens", 0) or 0
        cache_write = getattr(usage, "cache_creation_input_tokens", 0) or 0
        logger.info(
            "agent_end",
            agent=self.name,
            model=model,
            input_tokens=usage.input_tokens,
            output_tokens=usage.output_tokens,
            cache_read=cache_read,
            cache_write=cache_write,
        )
        for block in message.content:
            block_type = getattr(block, "type", None)
            block_name = getattr(block, "name", None)
            if block_type == "tool_use" and block_name == submit_tool["name"]:
                return self.output_model.model_validate(block.input)  # type: ignore[return-value]
        raise RuntimeError(
            f"{self.name}: model did not return a {submit_tool['name']} tool_use block"
        )

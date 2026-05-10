from abc import ABC
from typing import Any, ClassVar, Generic, TypeVar

from anthropic import AsyncAnthropic
from pydantic import BaseModel

from app.core.logging import get_logger
from app.core.prompts import load_prompt
from app.core.settings import Settings

InT = TypeVar("InT", bound=BaseModel)
OutT = TypeVar("OutT", bound=BaseModel)

logger = get_logger("agent")


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

    async def run(self, inp: InT) -> OutT:
        logger.info("agent_start name=%s", self.name)
        submit_tool = self._submit_tool()
        tools: list[dict[str, Any]] = [submit_tool, *self.server_tools]
        # Mark the last tool with cache_control so the system prompt + full
        # tool list (large JSON schema) are cached across calls.
        tools[-1] = {**tools[-1], "cache_control": {"type": "ephemeral"}}
        # When server tools are available the model must choose between them
        # and the submit tool, so tool_choice must be "auto". Otherwise force
        # the submit tool so the model cannot reply with prose.
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
        message = await self.client.messages.create(
            model=self.settings.default_model,
            max_tokens=self.settings.max_tokens,
            system=system_blocks,
            tools=tools,
            tool_choice=tool_choice,
            messages=[{"role": "user", "content": self._user_message(inp)}],
        )
        usage = message.usage
        cache_read = getattr(usage, "cache_read_input_tokens", 0) or 0
        cache_write = getattr(usage, "cache_creation_input_tokens", 0) or 0
        logger.info(
            "agent_end name=%s input=%s output=%s cache_read=%s cache_write=%s",
            self.name,
            usage.input_tokens,
            usage.output_tokens,
            cache_read,
            cache_write,
        )
        for block in message.content:
            block_type = getattr(block, "type", None)
            block_name = getattr(block, "name", None)
            if block_type == "tool_use" and block_name == submit_tool["name"]:
                return self.output_model.model_validate(block.input)  # type: ignore[return-value]
        raise RuntimeError(
            f"{self.name}: model did not return a {submit_tool['name']} tool_use block"
        )

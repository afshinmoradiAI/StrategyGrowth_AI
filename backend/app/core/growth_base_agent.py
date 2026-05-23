import json
from abc import ABC, abstractmethod
from typing import Generic, TypeVar

from anthropic import AsyncAnthropic
from pydantic import BaseModel

from app.core.growth_config import settings
from app.core.logging import get_logger
from app.core.prompts import load_prompt

InputT = TypeVar("InputT", bound=BaseModel)
OutputT = TypeVar("OutputT", bound=BaseModel)


class BaseAgent(ABC, Generic[InputT, OutputT]):
    name: str
    output_model: type[BaseModel]

    def __init__(self, client: AsyncAnthropic | None = None) -> None:
        self.client = client or AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.logger = get_logger(f"agent.{self.name}")
        self.system_prompt = load_prompt(self.name)

    @abstractmethod
    def build_user_message(self, payload: InputT) -> str: ...

    async def run(self, payload: InputT) -> OutputT:
        self.logger.info("enter agent=%s", self.name)
        tool = {
            "name": "submit_result",
            "description": f"Submit the structured result for {self.name}.",
            "input_schema": self.output_model.model_json_schema(),
        }
        response = await self.client.messages.create(
            model=settings.default_model,
            max_tokens=settings.max_tokens_per_post,
            system=self.system_prompt,
            tools=[tool],
            tool_choice={"type": "tool", "name": "submit_result"},
            messages=[{"role": "user", "content": self.build_user_message(payload)}],
        )
        usage = response.usage
        self.logger.info(
            "tokens agent=%s input=%d output=%d",
            self.name,
            usage.input_tokens,
            usage.output_tokens,
        )

        tool_block = next(
            (b for b in response.content if getattr(b, "type", None) == "tool_use"),
            None,
        )
        if tool_block is None:
            raise RuntimeError(f"{self.name}: model did not return a tool_use block")

        raw = tool_block.input
        if isinstance(raw, str):
            raw = json.loads(raw)
        result = self.output_model.model_validate(raw)
        self.logger.info("exit agent=%s ok", self.name)
        return result  # type: ignore[return-value]

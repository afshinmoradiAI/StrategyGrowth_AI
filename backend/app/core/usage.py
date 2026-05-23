"""Per-request token usage tracking via ContextVar."""
from contextvars import ContextVar
from dataclasses import dataclass, field

from app.core.model_context import get_model_info


@dataclass
class UsageAccumulator:
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_tokens: int = 0
    cache_write_tokens: int = 0
    agent_calls: int = 0
    models_used: list[str] = field(default_factory=list)

    def add(
        self,
        *,
        input_tokens: int = 0,
        output_tokens: int = 0,
        cache_read_tokens: int = 0,
        cache_write_tokens: int = 0,
        model: str | None = None,
    ) -> None:
        self.input_tokens += input_tokens
        self.output_tokens += output_tokens
        self.cache_read_tokens += cache_read_tokens
        self.cache_write_tokens += cache_write_tokens
        self.agent_calls += 1
        if model and model not in self.models_used:
            self.models_used.append(model)

    @property
    def total_input_tokens(self) -> int:
        # input_tokens and cache_read_tokens are additive — Anthropic returns
        # them as separate counters and the *total* input is their sum.
        return self.input_tokens + self.cache_read_tokens

    @property
    def cache_hit_ratio(self) -> float:
        total = self.total_input_tokens
        return (self.cache_read_tokens / total) if total else 0.0

    def estimated_cost_usd(self) -> float:
        """Best-effort cost estimate using the first model in `models_used`."""
        if not self.models_used:
            return 0.0
        info = get_model_info(self.models_used[0])
        if not info:
            return 0.0
        cost = 0.0
        cost += (self.input_tokens / 1_000_000) * info["input_per_million"]
        cost += (self.cache_read_tokens / 1_000_000) * info["cached_input_per_million"]
        cost += (self.cache_write_tokens / 1_000_000) * info["input_per_million"] * 1.25
        cost += (self.output_tokens / 1_000_000) * info["output_per_million"]
        return round(cost, 4)

    def snapshot(self) -> dict:
        return {
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "cache_read_tokens": self.cache_read_tokens,
            "cache_write_tokens": self.cache_write_tokens,
            "total_input_tokens": self.total_input_tokens,
            "cache_hit_ratio": round(self.cache_hit_ratio, 3),
            "agent_calls": self.agent_calls,
            "models_used": self.models_used,
            "estimated_cost_usd": self.estimated_cost_usd(),
        }


_usage: ContextVar[UsageAccumulator | None] = ContextVar("usage_acc", default=None)


def start_usage_scope() -> UsageAccumulator:
    acc = UsageAccumulator()
    _usage.set(acc)
    return acc


def get_usage() -> UsageAccumulator | None:
    return _usage.get()


def record_anthropic_usage(usage_obj, model: str) -> None:
    """Read an Anthropic SDK `usage` object and add to the active accumulator."""
    acc = _usage.get()
    if acc is None:
        return
    acc.add(
        input_tokens=getattr(usage_obj, "input_tokens", 0) or 0,
        output_tokens=getattr(usage_obj, "output_tokens", 0) or 0,
        cache_read_tokens=getattr(usage_obj, "cache_read_input_tokens", 0) or 0,
        cache_write_tokens=getattr(usage_obj, "cache_creation_input_tokens", 0) or 0,
        model=model,
    )

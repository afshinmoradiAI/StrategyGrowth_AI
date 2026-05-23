"""Per-request model selection via ContextVar.

Set by the request middleware reading the `X-Model` header. Read by BaseAgent
when it makes Anthropic calls. Falls back to settings.default_model.
"""
from contextvars import ContextVar

from app.core.settings import get_settings

_active_model: ContextVar[str | None] = ContextVar("active_model", default=None)


# Catalogue of models we expose to the UI. Pricing in $/1M tokens.
MODELS: list[dict] = [
    {
        "id": "claude-haiku-4-5",
        "name": "Claude Haiku 4.5",
        "tier": "fast",
        "input_per_million": 1.00,
        "output_per_million": 5.00,
        "cached_input_per_million": 0.10,
    },
    {
        "id": "claude-sonnet-4-5",
        "name": "Claude Sonnet 4.5",
        "tier": "balanced",
        "input_per_million": 3.00,
        "output_per_million": 15.00,
        "cached_input_per_million": 0.30,
    },
    {
        "id": "claude-opus-4-7",
        "name": "Claude Opus 4.7",
        "tier": "premium",
        "input_per_million": 15.00,
        "output_per_million": 75.00,
        "cached_input_per_million": 1.50,
    },
]

MODEL_IDS = {m["id"] for m in MODELS}


def set_active_model(model_id: str | None) -> None:
    if model_id and model_id in MODEL_IDS:
        _active_model.set(model_id)
    else:
        _active_model.set(None)


def get_active_model() -> str:
    """Return the active model for this request, falling back to settings."""
    chosen = _active_model.get()
    if chosen and chosen in MODEL_IDS:
        return chosen
    return get_settings().default_model


def get_model_info(model_id: str) -> dict | None:
    return next((m for m in MODELS if m["id"] == model_id), None)

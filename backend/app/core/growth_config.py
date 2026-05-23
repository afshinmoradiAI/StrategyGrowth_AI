"""Growth-specific settings. Shared values come from the main app settings."""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.settings import get_settings as _main_settings

_DEFAULT_DB = (
    Path(__file__).resolve().parent.parent.parent.parent / "data" / "growth.db"
)


class GrowthSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    google_places_api_key: str | None = None
    default_model: str = "claude-sonnet-4-5"
    max_tokens_per_post: int = 2048
    database_url: str = f"sqlite:///{_DEFAULT_DB}"


_g = GrowthSettings()
_main = _main_settings()


class _MergedSettings:
    """Read-only facade exposing both growth-specific and shared settings."""

    @property
    def anthropic_api_key(self) -> str:
        return _main.anthropic_api_key

    @property
    def google_places_api_key(self) -> str | None:
        return _g.google_places_api_key

    @property
    def default_model(self) -> str:
        return _g.default_model

    @property
    def max_tokens_per_post(self) -> int:
        return _g.max_tokens_per_post

    @property
    def database_url(self) -> str:
        return _g.database_url


settings = _MergedSettings()

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_DB_PATH = (
    Path(__file__).resolve().parent.parent.parent / "data" / "plans.db"
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str = "missing"
    default_model: str = "claude-sonnet-4-5"
    log_level: str = "INFO"
    max_tokens: int = 4096
    # Empty value disables auth (dev mode). Set in production.
    app_api_key: str = ""
    db_path: Path = DEFAULT_DB_PATH


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


def reset_settings() -> None:
    """Test helper: clear the cached singleton."""
    global _settings
    _settings = None

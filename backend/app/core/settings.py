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
    max_output_tokens_per_call: int = 8192
    enable_message_cache: bool = True
    app_api_key: str = ""
    db_path: Path = DEFAULT_DB_PATH
    secret_key: str = "dev-secret-change-in-production"

    # Rate limits
    rate_limit_default: str = "30/minute"
    rate_limit_anonymous: str = "10/minute"

    # Retries
    agent_max_retries: int = 3
    agent_retry_min_seconds: float = 1.0
    agent_retry_max_seconds: float = 10.0


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

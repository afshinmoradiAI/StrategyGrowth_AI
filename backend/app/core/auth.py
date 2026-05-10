from fastapi import Depends, Header, HTTPException, status

from app.core.settings import Settings, get_settings


async def require_api_key(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    settings: Settings = Depends(get_settings),
) -> None:
    """Require an X-API-Key header matching settings.app_api_key.

    Auth is disabled when settings.app_api_key is empty (dev default).
    """
    if not settings.app_api_key:
        return
    if x_api_key != settings.app_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )

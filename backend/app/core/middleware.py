"""Request-ID + structured-context middleware."""
import time
import uuid

import structlog
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.model_context import set_active_model

logger = structlog.get_logger("http")


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Adds a request_id to every log line and echoes it back as `X-Request-ID`.

    Also reads the `X-Model` header (when present) and stores it in the
    per-request ContextVar so agents pick it up via `get_active_model()`.
    """

    async def dispatch(self, request: Request, call_next):
        req_id = request.headers.get("x-request-id") or uuid.uuid4().hex
        model = request.headers.get("x-model")
        if model:
            set_active_model(model)
        else:
            set_active_model(None)

        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=req_id,
            method=request.method,
            path=request.url.path,
        )
        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            logger.exception("http_error")
            raise
        duration_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "http_request",
            status=response.status_code,
            duration_ms=round(duration_ms, 1),
        )
        response.headers["X-Request-ID"] = req_id
        return response


def register_middleware(app: FastAPI) -> None:
    app.add_middleware(RequestContextMiddleware)

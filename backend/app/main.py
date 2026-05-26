from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.api.routes_auth import router as auth_router
from app.api.routes_billing import router as billing_router
from app.api.routes_content import router as growth_content_router
from app.api.routes_crm import router as growth_crm_router
from app.api.routes_intake import router as intake_router
from app.api.routes_leads import router as growth_leads_router
from app.api.routes_models import router as models_router
from app.api.routes_plan import router as plan_router
from app.api.routes_plan_ext import router as plan_ext_router
from app.api.routes_plans import router as plans_router
from app.api.routes_standalone import router as standalone_router
from app.core.db import get_repository
from app.core.errors import register_error_handlers
from app.core.growth_database import init_db as init_growth_db
from app.core.logging import configure_logging, get_logger
from app.core.middleware import register_middleware
from app.core.settings import get_settings
from app.services.plan_store import get_plan_store

settings = get_settings()
configure_logging(settings.log_level)
logger = get_logger("main")

# slowapi rate limiter (per-IP)
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[settings.rate_limit_default],
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await get_repository().init()
    await get_plan_store().init()
    init_growth_db()
    logger.info("app_startup", version="0.2.0")
    yield
    logger.info("app_shutdown")


app = FastAPI(
    title="StrategyGrowth AI",
    version="0.2.0",
    lifespan=lifespan,
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

import os

_cors_origins = [
    o.strip() for o in os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:3001",
    ).split(",") if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["X-API-Key", "X-Model", "X-Request-ID", "Content-Type", "Authorization"],
    expose_headers=["X-Request-ID"],
)

register_middleware(app)
register_error_handlers(app)


# Core / strategy routes
app.include_router(auth_router)
app.include_router(intake_router)
app.include_router(plan_router)
app.include_router(plans_router)
app.include_router(plan_ext_router)
app.include_router(standalone_router)

# Growth feature routes
app.include_router(growth_leads_router, prefix="/api/growth")
app.include_router(growth_content_router, prefix="/api/growth")
app.include_router(growth_crm_router, prefix="/api/growth")

# Billing + models (public catalogue + authed usage)
app.include_router(billing_router)
app.include_router(models_router)


@app.get("/health")
async def health():
    """Scrubbed health endpoint — no model/version leak."""
    return {"status": "ok"}

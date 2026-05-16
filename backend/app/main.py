from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_intake import router as intake_router
from app.api.routes_plan import router as plan_router
from app.api.routes_plans import router as plans_router
from app.api.routes_standalone import router as standalone_router
from app.core.db import get_repository
from app.core.errors import register_error_handlers
from app.core.logging import configure_logging
from app.core.settings import get_settings

settings = get_settings()
configure_logging(settings.log_level)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await get_repository().init()
    yield


app = FastAPI(
    title="PropertyState AI — Project Planner",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["X-API-Key", "Content-Type"],
)

register_error_handlers(app)
app.include_router(intake_router)
app.include_router(plan_router)
app.include_router(plans_router)
app.include_router(standalone_router)


@app.get("/health")
async def health():
    return {"status": "ok"}

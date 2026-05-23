from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.growth_config import settings


class Base(DeclarativeBase):
    pass


_connect_args: dict = {}
if settings.database_url.startswith("sqlite"):
    _connect_args["check_same_thread"] = False

from pathlib import Path as _Path

if settings.database_url.startswith("sqlite:///"):
    _Path(settings.database_url.removeprefix("sqlite:///")).parent.mkdir(
        parents=True, exist_ok=True
    )

engine = create_engine(settings.database_url, future=True, connect_args=_connect_args)
SessionLocal = sessionmaker(engine, expire_on_commit=False, class_=Session)


def get_db() -> Iterator[Session]:
    with SessionLocal() as session:
        yield session


def init_db() -> None:
    from app.db import models  # noqa: F401 — register models

    Base.metadata.create_all(bind=engine)

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


def _problem(status: int, title: str, detail: str, type_: str = "about:blank") -> JSONResponse:
    return JSONResponse(
        status_code=status,
        media_type="application/problem+json",
        content={"type": type_, "title": title, "status": status, "detail": detail},
    )


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(KeyError)
    async def _key_error(_: Request, exc: KeyError):
        return _problem(404, "Not Found", str(exc))

    @app.exception_handler(ValueError)
    async def _value_error(_: Request, exc: ValueError):
        return _problem(400, "Bad Request", str(exc))

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception):
        return _problem(500, "Internal Server Error", str(exc))

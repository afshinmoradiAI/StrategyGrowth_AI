# Multi-stage build: install deps with uv, then run as non-root.
FROM python:3.12-slim AS deps
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

FROM python:3.12-slim
WORKDIR /app

# Non-root user
RUN groupadd -r app && useradd -r -g app -d /app -s /sbin/nologin app

# Copy installed venv from deps stage
COPY --from=deps /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

COPY --chown=app:app app ./app
COPY --chown=app:app .env.example ./

# Create writable data directory for SQLite (both plans.db and growth.db)
RUN mkdir -p /app/data && chown -R app:app /app

USER app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

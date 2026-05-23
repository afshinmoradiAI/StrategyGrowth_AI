# StrategyGrowth AI — Backend

FastAPI + Anthropic Claude + SQLite. Async everywhere.

## Layout

```
app/
├── main.py              # FastAPI app, lifespan, middleware stack
├── agents/              # 11 Claude agents (BaseAgent subclasses)
├── api/                 # 11 route files (auth, plan, plans, plan_ext, standalone,
│                        #               leads, content, crm, billing, models, intake)
├── schemas/             # Pydantic input + output models
├── services/            # Orchestrator, PDF/DOCX export, chat, lead orchestrator,
│                        #   google_places, email_finder, website_scraper, crm, plan_store
├── prompts/             # 11 *.md files — one per agent
├── core/
│   ├── settings.py          # pydantic-settings (all env vars)
│   ├── db.py                # aiosqlite repo (users, plans, leads, chat)
│   ├── base_agent.py        # tenacity retries + prompt caching + usage capture
│   ├── security.py          # JWT + bcrypt + require_user / optional_user
│   ├── plan_gate.py         # PlanGate dependency + PlanLimitExceeded (HTTP 402)
│   ├── model_context.py     # X-Model ContextVar + MODELS catalogue
│   ├── usage.py             # Per-request UsageAccumulator
│   ├── middleware.py        # Request-ID + X-Model context + structured logging
│   ├── logging.py           # structlog config
│   ├── errors.py            # RFC 7807 problem+json handlers
│   ├── orchestrator.py      # Plan pipeline (strategy side)
│   ├── prompts.py           # load_prompt() (caches markdown reads)
│   └── growth_*.py          # Growth-only SQLAlchemy bootstrap
└── db/
    └── models.py            # SQLAlchemy models (CRM leads / touches / decision-makers)
```

## Endpoints

34 total. Browse interactively at `/docs`.

Major groups:
- **`/api/auth/*`** — register / login / me
- **`/api/plan`** — full pipeline (SSE)
- **`/api/standalone/*`** — research / strategy / risk (SSE) + lead capture
- **`/api/plans/*`** — list / get / delete / pdf / docx / chat
- **`/api/growth/leads/*`** — lead finder
- **`/api/growth/content/*`** — content studio
- **`/api/growth/crm/*`** — CRM
- **`/api/billing/{plans,usage}`** — plan info + monthly usage
- **`/api/models`** — public model catalogue with pricing

## Run

```bash
# Install (uses uv)
uv sync

# Dev
.venv/Scripts/uvicorn.exe app.main:app --reload --port 8001

# Tests
.venv/Scripts/python.exe -m pytest -q

# Lint
.venv/Scripts/python.exe -m ruff check app
```

## Environment

See `.env.example` for the full list. Required: `ANTHROPIC_API_KEY`. Recommended: `SECRET_KEY` (JWT signing). Optional: `GOOGLE_PLACES_API_KEY`.

## Architecture notes

- **Auth model**: stateless JWT in `Authorization: Bearer ...` header. No sessions, no cookies.
- **Database**: SQLite with WAL pragma. Two abstractions coexist — `aiosqlite` (strategy side) and SQLAlchemy (growth CRM side). They share the same file.
- **Streaming**: All long-running endpoints stream Server-Sent Events. The frontend `streamSse()` helper parses them.
- **Caching**: Each agent sets `cache_control: ephemeral` on its system prompt + tool schema, cutting input cost ~90% across repeated calls.
- **Retries**: Transient Anthropic errors (timeout, rate limit, connection) auto-retry with exponential backoff + jitter.
- **Rate limiting**: slowapi, per-IP, 30 req/min default. Bypassed for `/health`, `/docs`, `/openapi.json`.
- **Plan gating**: `PlanGate` dependency reads JWT → looks up plan tier + monthly usage → refuses (402) if exceeded → pins model to plan's allowed list.
- **Observability**: structlog with request_id, method, path, status, duration on every HTTP request. Per-agent logs include token usage + model.

## Adding a new agent

Follow the rules in [.claude/rules/agent-conventions.md](../.claude/rules/agent-conventions.md). TL;DR:

1. `app/schemas/foo.py` — input + output Pydantic models
2. `app/prompts/foo.md` — system prompt
3. `app/agents/foo_agent.py` — `class FooAgent(BaseAgent[Input, Output])`
4. Register in `app/agents/__init__.py` + `Orchestrator.agents` map
5. Add `app/api/routes_foo.py`, include in `main.py`
6. Add a test in `tests/test_agents/test_foo.py`

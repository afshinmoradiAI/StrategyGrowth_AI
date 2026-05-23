# Working in StrategyGrowth AI

Project rules and conventions for AI assistants editing this repository.

## Repo layout

```
backend/
  app/
    main.py                 # FastAPI app + lifespan + middleware
    agents/                 # 11 agents (5 strategy + 6 growth)
    api/                    # 9 route files
    schemas/                # Pydantic input/output models
    services/               # Business logic (orchestrators, PDF, DOCX, CRM, etc.)
    prompts/                # 11 *.md system prompts
    core/                   # Settings, db, security, base_agent, middleware
    db/                     # SQLAlchemy models (growth-side tables)
  Dockerfile
  .env.example
  pyproject.toml            # uv-managed

frontend/
  app/
    page.tsx                # Home (Full Plan)
    research/ strategy/ risk/ leads/ dashboard/ plans/ login/  # Pages
    _components/            # Nav, AuthGuard, UsageBadge, SettingsDialog, Views
    _lib/                   # auth, sse, types
  package.json              # Next.js 16 + React 19

.claude/rules/              # Detailed agent + API conventions
.github/workflows/ci.yml    # pytest + ruff + tsc on push/PR
```

## Hard rules

### Agents (`backend/app/agents/`)
- Inherit from `BaseAgent` in `app/core/base_agent.py`
- Load the system prompt from `app/prompts/<name>.md` via `load_prompt()`
- Accept and return **Pydantic models only** — no raw dicts
- Be **async** (`async def run`)
- Never call another agent directly — use the orchestrator
- Never put business logic in the prompt file — that belongs in Python
- Don't catch exceptions silently — let them bubble up
- Add a corresponding test in `tests/test_agents/`
- Register in `Orchestrator.agents` map

### API routes (`backend/app/api/routes_*.py`)
- All endpoints are async
- Request and response bodies are Pydantic models from `schemas/`
- Long-running tasks return a job_id or stream progress via SSE
- Errors return RFC 7807 problem-details JSON (`core/errors.py` handles this)
- Every route has at least one test in `tests/test_api/`
- Auth: depend on `require_user` (or `optional_user`) from `core/security.py`
- Plan-gated routes: depend on `plan_gate` from `core/plan_gate.py`

### Imports
- Use absolute imports rooted at `app.` (e.g. `from app.core.settings import Settings`)
- Never re-introduce a top-level `growth/` subpackage — all code lives flat under `app/`

### Frontend (`frontend/app/`)
- This is **Next.js 16**, not 14 — APIs differ from older training data
- Read `node_modules/next/dist/docs/` before adopting deprecated patterns
- Use the App Router exclusively
- All auth-protected pages wrap in `<AuthGuard>` from `_components/AuthGuard.tsx`
- All authed fetches include `authHeaders()` from `_lib/auth.ts` (carries JWT + X-Model)
- SSE: use `streamSse()` from `_lib/sse.ts`; pass `authHeaders()` as the 4th arg

### Logging
- Use `structlog` via `app.core.logging.get_logger(name)`
- Pass structured fields, not formatted strings:
  ```python
  logger.info("agent_end", agent=self.name, tokens=usage.input_tokens)
  ```

### Adding a new tool
1. Create Pydantic input + output in `app/schemas/<name>.py`
2. Add system prompt at `app/prompts/<name>.md`
3. Create agent in `app/agents/<name>_agent.py` (subclass `BaseAgent`)
4. Register in `app/agents/__init__.py` and `Orchestrator.agents`
5. Add route in `app/api/routes_<name>.py`, include in `app/main.py`
6. Add frontend page at `app/<name>/page.tsx`, link from `Nav.tsx` and home `TOOLS` array
7. Write a test in `backend/tests/test_agents/test_<name>.py`

## Local dev

```bash
# Backend
cd backend && uv sync && .venv/Scripts/uvicorn.exe app.main:app --reload --port 8001

# Frontend
cd frontend && npm install && npm run dev
```

Auth runs on JWT — register a user, then everything else works. `GOOGLE_PLACES_API_KEY`
is optional (lead finder will return a friendly error without it).

## Things NOT to do

- Don't add new top-level folders to `app/` (e.g. `growth/`) — keep it flat
- Don't add `print()` statements — use `get_logger()`
- Don't hardcode model IDs — read `get_active_model()` so users can override via `X-Model`
- Don't bypass `PlanGate` on token-spending endpoints in production
- Don't catch `Exception` in agents — let the orchestrator's error handler turn it into a 500 + SSE error frame
- Don't commit `.env` files

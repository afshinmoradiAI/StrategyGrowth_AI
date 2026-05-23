# Feature checklist — StrategyGrowth AI

Legend: ✅ shipped · ⚠️ partial · ❌ not yet

---

## 1. Agent framework
- ✅ Custom typed agent framework on Anthropic SDK (Pydantic-tools pattern)
- ✅ Pydantic models for every agent input/output
- ✅ `BaseAgent` with `prompt_name` + `input_model` + `output_model` contract
- ✅ Prompts on disk (`app/prompts/*.md`)
- ✅ Per-request model override via `X-Model` header + ContextVar
- ✅ Workflow orchestrator (agents never call each other directly)
- ✅ Async-everywhere
- ❌ Lazy agent construction (orchestrator instantiates eagerly at startup)

## 2. Authentication & access control
- ✅ JWT-based email/password auth (`/api/auth/register`, `/login`, `/me`)
- ✅ bcrypt password hashing (passlib)
- ✅ Per-user data scoping via JWT `sub`
- ✅ `AuthGuard` client component — redirects unauthenticated users
- ✅ Sign-in / Sign-up pages
- ✅ Logout button in Nav
- ❌ OAuth / social login
- ❌ Role-based access control
- ❌ Password reset / email verification

## 3. Rate limiting & abuse protection
- ✅ Per-IP rate limit (slowapi, default 30/min)
- ✅ Pydantic input length caps (min/max on every schema)
- ✅ Per-user monthly token cap (plan-gated)
- ✅ Per-user monthly generation cap (plan-gated)
- ✅ Scrubbed `/health` endpoint (no version/model leak)
- ❌ File upload limits (no uploads yet)
- ❌ CAPTCHA for anonymous endpoints
- ❌ Abuse detection / auto-ban

## 4. Errors & observability
- ✅ RFC 7807 problem+json responses (`core/errors.py`)
- ✅ Structured logging (`structlog`, JSON in prod, pretty in dev)
- ✅ Request-ID middleware (accept-or-generate, echo back via header + log context)
- ✅ Per-agent token-usage logging (input / output / cache_read / cache_write / model)
- ✅ Cache hit ratio computed per request
- ✅ Retry on transient Anthropic failures (tenacity, exp backoff + jitter)
- ❌ Sentry
- ❌ Distributed tracing (OpenTelemetry)

## 5. Persistence & storage
- ✅ SQLite with WAL + foreign keys + synchronous=NORMAL pragmas
- ✅ `users` table (email + bcrypt hash)
- ✅ `plans` table — every plan + result saved
- ✅ `leads` table — email captures + project descriptions
- ✅ `chat_messages` table — per-plan follow-up Q&A
- ✅ `user_plans` table — plan tier per user
- ✅ `monthly_usage` table — per-month token + generation count
- ✅ Growth-side SQLAlchemy tables for CRM leads, touches, decision-makers
- ✅ Configurable `DB_PATH`
- ❌ Backups
- ❌ Postgres / LiteFS

## 6. Search / retrieval
- ❌ Not applicable — app is generation-only, no RAG yet

## 7. Prompt caching & cost optimisation
- ✅ Anthropic system-prompt + tool-schema caching (`cache_control: ephemeral`)
- ✅ Per-call `max_tokens` cap (`MAX_OUTPUT_TOKENS_PER_CALL`, default 8,192)
- ✅ Per-request usage accumulator with cache hit ratio
- ❌ Anthropic message-content caching for long inputs (env var present, not wired)
- ❌ LRU result cache
- ❌ Redis / distributed cache

## 8. Billing & subscription
- ✅ Four plan tiers: Free ($0) / Pro ($19) / Lab ($49) / Enterprise ($200)
- ✅ Monthly token + generation caps per plan
- ✅ Plan-aware model gating (Free=Haiku, Pro=+Sonnet, Lab+Ent=+Opus)
- ✅ `PlanGate` FastAPI dependency
- ✅ HTTP 402 `PlanLimitExceeded` with structured detail
- ✅ `GET /api/billing/usage` — current month + plan info
- ✅ `GET /api/billing/plans` — all plans (with `available` flag)
- ✅ "Coming Soon" badge for paid tiers in Settings dialog
- ❌ Stripe Checkout integration
- ❌ Stripe webhook → set_plan on payment

## 9. Model selection
- ✅ `GET /api/models` — public catalogue with $/M input + output pricing
- ✅ SettingsDialog frontend with cards + estimated cost per generation
- ✅ `X-Model` request header carries selection
- ✅ Middleware sets per-request ContextVar
- ✅ `get_active_model()` used by `BaseAgent` — honours per-request choice
- ✅ Plan-aware fallback (request unavailable model → downgrade to plan's cheapest)

## 10. Workflows & streaming
- ✅ Async generator workflows (`orchestrator.run_pipeline`)
- ✅ SSE events: `agent_start`, `agent_complete`, `done`, `error`, `plan_created`
- ✅ Persist on complete — every plan saved to `plans` table
- ✅ Parallel agent execution (`asyncio.gather` for plan + risk)
- ✅ Per-request usage tracking via ContextVar
- ❌ Token-level streaming (only step-level)
- ❌ Workflow resume from checkpoint

## 11. Output modes & document generation
- ✅ **Full Plan** (intake → research → strategy → plan + risk)
- ✅ **Standalone Research** (free, email-gated)
- ✅ **Standalone Strategy**
- ✅ **Standalone Risk**
- ✅ **AI Lead Finder** (ICP → Places → decision-makers → scoring → outreach)
- ✅ **Content Studio** (backend ready, no UI)
- ✅ **Pipeline CRM** (backend ready, no UI)
- ✅ PDF export (reportlab, blue brand theme)
- ✅ DOCX export (python-docx, Times New Roman 12pt)
- ❌ HTML export

## 12. Library / Dashboard
- ✅ Every plan saved
- ✅ `GET /api/plans` — paginated list for current user
- ✅ `GET /api/plans/{id}` — full content + chat history
- ✅ `DELETE /api/plans/{id}` — user-scoped delete
- ✅ Dashboard view (`/dashboard`)
- ✅ Plan detail page with PDF + DOCX download + AI chat

## 13. API design
- ✅ FastAPI + Pydantic
- ✅ All routes async
- ✅ Dependency injection (`Depends(...)`)
- ✅ Auto-generated `/docs` + `/openapi.json`
- ✅ CORS configured for frontend
- ✅ `X-Request-ID` echoed on every response

## 14. Frontend
- ✅ Next.js 16 App Router
- ✅ TypeScript strict
- ✅ Tailwind v4 + blue corporate design system
- ✅ Custom fetch-based SSE client (`streamSse`)
- ✅ `AuthGuard` + Sign-in / Sign-up pages
- ✅ Nav with mode tabs + Usage badge + Settings cog + Sign-out
- ✅ Saved plans Dashboard
- ✅ SettingsDialog: model selector + plan cards
- ✅ UsageBadge: real-time monthly token meter (green/amber/red)
- ✅ Hero photo backgrounds with blue overlay
- ❌ Loading skeletons / optimistic UI
- ❌ Service-unavailable banner
- ❌ Accessibility audit
- ❌ i18n

## 15. Testing
- ✅ pytest with `asyncio_mode = auto`
- ⚠️ `test_agents/` + `test_api/` folders exist but sparse
- ❌ Mocked LLM helpers
- ❌ Workflow end-to-end tests
- ❌ Frontend unit tests
- ❌ Playwright E2E
- ❌ Load tests

## 16. CI / quality
- ✅ GitHub Actions on push + PR (pytest + ruff + tsc + lint)
- ❌ Auto-deploy on merge
- ❌ Coverage reporting
- ❌ Secret scanning (gitleaks)
- ❌ Dependency vulnerability scanning

## 17. Configuration & deployment
- ✅ pydantic-settings with env-var aliases
- ✅ `.env.example` with every variable documented
- ✅ New env vars: `MAX_OUTPUT_TOKENS_PER_CALL`, `ENABLE_MESSAGE_CACHE`, `RATE_LIMIT_*`, `AGENT_RETRY_*`, `SECRET_KEY`
- ✅ Dockerfile (multi-stage, slim, non-root user, healthcheck)
- ✅ Docker-compose for local full-stack
- ❌ Blue/green deploys
- ❌ Multi-region

## 18. Privacy / compliance
- ✅ Per-user data isolation via JWT
- ✅ DELETE endpoint for owned plans
- ❌ GDPR data export
- ❌ Privacy policy / Terms of service
- ❌ Cookie consent

---

## File map

| Concern | Files |
|---|---|
| Agent base + caching + retries | `backend/app/core/base_agent.py` |
| Settings (all env vars) | `backend/app/core/settings.py` + `backend/.env.example` |
| Auth (JWT + bcrypt) | `backend/app/core/security.py` + `app/api/routes_auth.py` |
| Plan gating + tiers | `backend/app/core/plan_gate.py` + `app/services/plan_store.py` |
| Model context (ContextVar) | `backend/app/core/model_context.py` |
| Usage tracking + cost calc | `backend/app/core/usage.py` |
| Request-ID + middleware | `backend/app/core/middleware.py` |
| Logging (structlog) | `backend/app/core/logging.py` |
| Errors (RFC 7807) | `backend/app/core/errors.py` |
| Billing routes | `backend/app/api/routes_billing.py` |
| Model routes | `backend/app/api/routes_models.py` |
| Plan repository | `backend/app/core/db.py` |
| PDF export | `backend/app/services/pdf_export.py` |
| DOCX export | `backend/app/services/docx_export.py` |
| Frontend SSE | `frontend/app/_lib/sse.ts` |
| Frontend auth helpers | `frontend/app/_lib/auth.ts` |
| Settings dialog | `frontend/app/_components/SettingsDialog.tsx` |
| Usage badge | `frontend/app/_components/UsageBadge.tsx` |
| CI | `.github/workflows/ci.yml` |
| Backend container | `backend/Dockerfile` |

# StrategyGrowth AI

> **Turn a single sentence into a complete strategic plan _and_ a qualified sales pipeline — in minutes.**

An end-to-end AI platform for founders, CEOs, project managers, and growth teams.
Eleven specialised Claude agents work together to take a plain-text business idea and
return a project brief, market research, GTM strategy, phased roadmap, risk register,
lead list, and outreach sequences.

![status](https://img.shields.io/badge/status-active-success)
![python](https://img.shields.io/badge/python-3.12-blue)
![next.js](https://img.shields.io/badge/Next.js-16-black)
![license](https://img.shields.io/badge/license-MIT-green)

---

## What it does

| Tool | Output |
|---|---|
| 🔍 **Market Research** | Market overview, competitors, trends, benchmarks (free + email-gated) |
| 📊 **GTM Strategy** | Positioning, value props, differentiators, objectives |
| 🗺️ **Project Roadmap** | Phased plan with milestones, tasks, time estimates, KPIs |
| ⚠️ **Risk Register** | Investor-ready risks with likelihood × impact + mitigations |
| 📋 **Full Plan** | All five agents in one streaming pipeline |
| 🎯 **AI Lead Finder** | ICP parsing → Google Places → decision-maker extraction → AI scoring → 3-touch outreach |
| 📝 **Content Studio** | Platform-native posts for X / LinkedIn / IG / FB / TikTok *(API ready)* |
| 📊 **Pipeline CRM** | Track leads through New → Contacted → Won *(API ready)* |

Plus: **save & revisit plans**, **download PDF / DOCX**, **AI follow-up chat**, **per-user usage limits**.

---

## Tech stack

**Backend** · Python 3.12 · FastAPI · async everywhere · Anthropic Claude SDK · Pydantic · SQLite (aiosqlite + SQLAlchemy) · structlog · slowapi · tenacity · reportlab · python-docx

**Frontend** · Next.js 16 (App Router) · TypeScript (strict) · Tailwind v4 · custom SSE streaming · localStorage JWT

**Ops** · GitHub Actions CI · Docker (multi-stage, non-root) · `.env`-based config

---

## Quickstart

### 1. Backend

```bash
cd backend
cp .env.example .env
# Set ANTHROPIC_API_KEY in .env

# Install deps (uses uv — https://docs.astral.sh/uv/)
uv sync

# Run dev server
.venv/Scripts/uvicorn.exe app.main:app --reload --port 8001
# (on macOS/Linux: .venv/bin/uvicorn ...)
```

Backend → http://localhost:8001 — interactive docs at `/docs`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend → http://localhost:3001 (or 3000 if free).

### 3. Use it

1. Open the frontend, click **Sign up**, create an account
2. Try **Plan** for the full 5-agent pipeline
3. Try **Leads** to find businesses (requires `GOOGLE_PLACES_API_KEY`)
4. Open the ⚙ Settings dialog to switch model (Haiku / Sonnet / Opus)

---

## Docs

- **[FEATURES.md](./FEATURES.md)** — full feature checklist with status
- **[TUTORIAL.md](./TUTORIAL.md)** — step-by-step walkthrough of every tool
- **[CLAUDE.md](./CLAUDE.md)** — instructions for AI assistants working in this repo
- **[backend/README.md](./backend/README.md)** — backend architecture
- **[.claude/rules/](./.claude/rules/)** — project conventions (agent + API)

---

## Architecture (one paragraph)

A single FastAPI service exposes 34 endpoints (auth, plan pipeline, standalone tools, billing,
models, growth tools). Each AI agent inherits from `BaseAgent` which loads a system prompt
from `app/prompts/*.md`, exposes its Pydantic output as an Anthropic tool with
`cache_control` for prompt-caching, retries transient errors via tenacity, and reports usage
into a per-request ContextVar. The `Orchestrator` runs intake → research → strategy →
(plan ∥ risk) in parallel and streams each step over Server-Sent Events.
Per-user usage and plan tier are tracked in SQLite; the `PlanGate` dependency enforces
monthly token and generation caps with an HTTP 402 response. Authentication is JWT
(bcrypt-hashed passwords), and a `X-Model` header lets the frontend pick which Claude
variant to call on a per-request basis.

---

## Deployment

```bash
# Build the backend image
docker build -t strategygrowth-backend ./backend

# Run with env file
docker run --rm -p 8000:8000 --env-file ./backend/.env strategygrowth-backend
```

Frontend deploys to Vercel out of the box. Backend works on Fly.io, Railway, Render, or any
container host. SQLite persists in `/app/data` — mount a volume in production.

---

## License

MIT

# StrategyGrowth AI — User Tutorial

A step-by-step walkthrough of every tool in the app.

---

## Setup (one-time)

1. **Start the backend**
   ```bash
   cd backend
   .venv/Scripts/uvicorn.exe app.main:app --reload --port 8001
   ```

2. **Start the frontend** (new terminal)
   ```bash
   cd frontend
   npm run dev
   ```

3. Open http://localhost:3001 in your browser
4. Click **Sign up** in the top-right and create an account
   - Email + password (min 8 chars)
   - You land on the home page with all tools unlocked

---

## Tool 1 — Full Plan (the headline feature)

**What it does:** Runs all 5 strategy agents end-to-end on your idea. ~30–60 seconds.

1. Go to **Plan** (home page)
2. In the text box, describe your project — the more concrete, the better:
   > *"I want to build a SaaS that helps Australian property managers track maintenance, compliance, and tenant communications. Budget around $80k, target launch Q4 2026."*
3. Click **Generate full plan →**
4. Watch the 5 colored pipeline pills light up in sequence:
   - **Intake** (✓) — extracts goals, audience, constraints
   - **Research** (✓) — market overview, competitors, trends
   - **Strategy** (✓) — positioning, value props, differentiators
   - **Roadmap** (✓) + **Risks** (✓) — run in parallel
5. Results stream in below. Sections appear as each agent finishes.
6. Your plan is auto-saved — find it later in **Dashboard**

---

## Tool 2 — Market Research (Free)

**What it does:** Just the research agent. Email-gated for lead capture.

1. Go to **Research** in the nav
2. Enter your **email** + project description
3. Click **Get free research →**
4. Email is captured (visible to ops via `leads` table)
5. Two-step pipeline runs: Intake → Research
6. You get: market overview, competitor landscape, trends, benchmarks, sources

---

## Tool 3 — Go-To-Market Strategy

**What it does:** Three-step pipeline (Intake → Research → Strategy).

1. Go to **Strategy**, paste your idea
2. Click **Build strategy →**
3. Output: positioning statement, value propositions, differentiators, business objectives, key assumptions

> 💡 **CEOs share this with their board.** Copy it into a slide deck.

---

## Tool 4 — Risk Register

**What it does:** Four-step pipeline (Intake → Research → Strategy → Risk).

1. Go to **Risk**, paste your idea
2. Click **Generate risk register →**
3. Output: a list of risks with:
   - **Likelihood** (low / medium / high)
   - **Impact** (low / medium / high)
   - **Category**
   - **Mitigation strategy**
   - **Owner** (suggested)

> 💡 **Investors love this.** Drop the table into your pitch deck or PRD.

---

## Tool 5 — AI Lead Finder

**Prerequisite:** `GOOGLE_PLACES_API_KEY` in `backend/.env`. Without it the page works but search returns a friendly error.

**What it does:** Turns a sentence into a sorted list of real businesses with decision-makers, scores, and outreach drafts.

1. Go to **Leads**
2. Describe your ideal customer in one sentence:
   > *"Find dental clinics in Melbourne to pitch cosmetic dentistry on LinkedIn"*
3. Set **Max results** (1–20)
4. Click **Find leads →**
5. ~20–60 seconds — pipeline runs: ICP parser → Places search → website scrape → decision-maker extraction → email guessing → AI scoring → 3-touch sequencing
6. Output: cards sorted by score, each with:
   - 🔴 / 🟡 / 🟢 tier (hot / warm / cold)
   - Score 0–100 with reasons
   - Business details + decision-maker (name, title, email)
   - 3-touch outreach (Day 0 / Day 3 / Day 7) — subject lines + body, ready to send

---

## Tool 6 — Dashboard

**What it does:** Every plan you've generated, listed by date.

1. Go to **Dashboard**
2. See all your saved plans
3. Click any to open the **plan detail** page

---

## Tool 7 — Plan detail page (`/plans/{id}`)

For any saved plan you can:

- **Browse** the full output (brief, research, strategy, roadmap, risks)
- 📄 **Download PDF** — branded, professional, ready to share
- 📝 **Download DOCX** — editable Word document
- 💬 **Chat with the plan** — ask follow-up questions:
  > *"Expand phase 2 of the roadmap"*
  > *"What if my budget drops to $40k?"*
  > *"Add a marketing milestone"*
- 🗑️ **Delete** the plan

---

## Tool 8 — Settings dialog (⚙ button in nav)

**What it does:** Switch AI model + see plan tiers.

1. Click the **⚙** in the top-right
2. **AI Model** section:
   - **Haiku 4.5** — fastest, cheapest (~$0.02 / generation)
   - **Sonnet 4.5** — balanced (~$0.05 / generation)
   - **Opus 4.7** — premium (~$0.30 / generation)
3. Selecting a model stores it in localStorage as `X-Model` header for all future requests
4. **Plans** section shows the four tiers (only Free is currently active)

---

## Usage meter (badge in nav)

The pill in the top-right shows your monthly usage:
- 🟢 Green when < 60% of token limit used
- 🟡 Amber 60–85%
- 🔴 Red ≥ 85%

Click it to see a popover with exact token + generation counts.

When you hit the cap, the next request returns **HTTP 402 Payment Required** — the frontend shows a friendly upsell.

---

## API reference (for developers)

| Endpoint | What |
|---|---|
| `POST /api/auth/register` | Create account |
| `POST /api/auth/login` | Get JWT |
| `GET /api/auth/me` | Current user |
| `POST /api/plan` | Run full pipeline (SSE) |
| `POST /api/standalone/research` | Research only (SSE) |
| `POST /api/standalone/strategy` | Strategy pipeline (SSE) |
| `POST /api/standalone/risk` | Risk pipeline (SSE) |
| `GET /api/plans` | List my plans |
| `GET /api/plans/{id}` | Plan detail |
| `DELETE /api/plans/{id}` | Delete plan |
| `GET /api/plans/{id}/pdf` | Download PDF |
| `GET /api/plans/{id}/docx` | Download DOCX |
| `GET /api/plans/{id}/chat` | List chat |
| `POST /api/plans/{id}/chat` | Send chat message |
| `POST /api/growth/leads/icp/search` | Full lead finder pipeline |
| `POST /api/growth/leads/search` | Lead search with explicit ICP |
| `POST /api/growth/content/generate` | Content Studio |
| `POST /api/growth/crm/leads` | List CRM leads |
| `POST /api/growth/crm/import` | Import lead into CRM |
| `GET /api/billing/usage` | My monthly usage |
| `GET /api/billing/plans` | All plan tiers |
| `GET /api/models` | Available Claude models + pricing |
| `GET /health` | Health check |
| `GET /docs` | Swagger UI |

Browse all 34 routes interactively at http://localhost:8001/docs

---

## Troubleshooting

**Port already in use**
```bash
# Backend on different port
.venv/Scripts/uvicorn.exe app.main:app --reload --port 8002
# Then in frontend/.env.local:
echo "NEXT_PUBLIC_API_URL=http://localhost:8002" > frontend/.env.local
```

**`ANTHROPIC_API_KEY missing`** — Add it to `backend/.env`

**`Login required` on Strategy / Risk / Leads** — These routes need authentication. Sign in first.

**Lead search returns error** — Set `GOOGLE_PLACES_API_KEY` in `backend/.env`

**Pipeline runs but no output** — Check `backend` terminal — token errors and validation failures log there with full structured context.

**Rate limited (HTTP 429)** — slowapi default is 30 req/min per IP. Wait a minute or bump `RATE_LIMIT_DEFAULT` in `.env`.

**HTTP 402 Payment Required** — Hit your monthly token / generation cap. Switch to a paid tier in code (`PlanStore.set_tier`) or wait until next month.

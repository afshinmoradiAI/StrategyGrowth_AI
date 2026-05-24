"use client";

import { useState } from "react";

import { AuthGuard } from "../_components/AuthGuard";
import { Nav } from "../_components/Nav";
import { authHeaders } from "../_lib/auth";
import { API } from "../_lib/types";

type Tier = "hot" | "warm" | "cold";
type DecisionMaker = {
  name: string;
  title: string | null;
  email: string | null;
  email_candidates: string[];
  email_domain_verified: boolean;
};
type Lead = {
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  review_count: number | null;
  place_id: string;
  decision_makers: DecisionMaker[];
};
type Touch = {
  day_offset: number;
  purpose: string;
  subject: string | null;
  body: string;
};
type LeadScore = { score: number; tier: Tier; reasons: string[] };
type LeadWithOutreach = {
  lead: Lead;
  outreach: { touches: Touch[] };
  score: LeadScore | null;
};
type LeadSearchResponse = {
  business_type: string;
  location: string;
  count: number;
  leads: LeadWithOutreach[];
};

const TIER_STYLES: Record<
  Tier,
  { badge: string; bar: string; label: string }
> = {
  hot: {
    badge: "bg-slate-50 text-emerald-700 ring-1 ring-emerald-500/30",
    bar: "bg-slate-500",
    label: "HOT — go!",
  },
  warm: {
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-500/30",
    bar: "bg-amber-500",
    label: "WARM — nurture",
  },
  cold: {
    badge: "bg-red-50 text-red-700 ring-1 ring-red-500/30",
    bar: "bg-red-500",
    label: "COLD — skip",
  },
};

function LeadsTool() {
  const [query, setQuery] = useState(
    "Find dental clinics in Melbourne to pitch cosmetic dentistry on LinkedIn",
  );
  const [maxResults, setMaxResults] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LeadSearchResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch(`${API}/api/growth/leads/icp/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ query, max_results: maxResults }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `${res.status}`);
      }
      setResults(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Nav active="/leads" />

      <div
        className="relative bg-slate-800"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-slate-900/80" />
        <div className="relative mx-auto max-w-6xl px-6 py-16 text-center">
          <span className="text-5xl mb-4 block">🎯</span>
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            AI Lead Finder
          </h1>
          <p className="mt-4 text-xl text-slate-200 max-w-2xl mx-auto">
            Describe your ideal customer in plain English. We find real
            businesses, extract decision-makers, score each lead, and draft a
            3-touch outreach sequence.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl w-full px-6 py-12">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8"
        >
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            What kind of leads do you want?
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            required
            minLength={10}
            disabled={loading}
            placeholder="e.g. Find boutique cafes in Surry Hills for an Instagram growth campaign"
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />

          <div className="mt-5 flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                Max results
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                disabled={loading}
                className="w-24 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading || query.trim().length < 10}
              className="ml-auto rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-900 shadow hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Hunting…" : "Find leads →"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Search failed</p>
            <p className="mt-1">{error}</p>
            {error.toLowerCase().includes("places") && (
              <p className="mt-2 text-xs text-red-600">
                Tip: set <code className="bg-red-100 px-1 rounded">GOOGLE_PLACES_API_KEY</code>{" "}
                in <code className="bg-red-100 px-1 rounded">backend/.env</code> to enable real
                business search.
              </p>
            )}
          </div>
        )}

        {loading && (
          <div className="mt-10 text-center">
            <div className="inline-flex gap-1.5">
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="h-2 w-2 animate-pulse rounded-full bg-slate-900"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
            <p className="mt-4 text-sm font-medium text-slate-700">
              Running the pipeline
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              ICP parser → Places search → website scrape → decision-maker
              extraction → email guessing → AI scoring → 3-touch sequencing
            </p>
            <p className="mt-2 text-xs text-slate-400">~20–60 seconds</p>
          </div>
        )}

        {results && (
          <section className="mt-10">
            <div className="mb-6 flex items-baseline justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {results.count} leads
                </h2>
                <p className="text-sm text-slate-500">
                  {results.business_type} · {results.location} · sorted by score
                </p>
              </div>
              <ResultsLegend results={results} />
            </div>
            <div className="space-y-5">
              {results.leads.map((item) => (
                <LeadCard key={item.lead.place_id} item={item} />
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="mt-auto bg-slate-800 text-slate-900 text-center py-6 text-sm">
        © {new Date().getFullYear()} Strategy Business Growth — Powered by Claude AI
      </footer>
    </>
  );
}

function ResultsLegend({ results }: { results: LeadSearchResponse }) {
  const counts = { hot: 0, warm: 0, cold: 0 };
  for (const l of results.leads) {
    if (l.score) counts[l.score.tier] += 1;
  }
  return (
    <div className="flex gap-4 text-xs">
      {(["hot", "warm", "cold"] as Tier[]).map((t) => (
        <div key={t} className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${TIER_STYLES[t].bar}`} />
          <span className="font-semibold text-slate-700">{counts[t]}</span>
          <span className="text-slate-500">{t}</span>
        </div>
      ))}
    </div>
  );
}

function LeadCard({ item }: { item: LeadWithOutreach }) {
  const { lead, score, outreach } = item;
  const primaryContact = lead.decision_makers[0];
  const tierStyle = score ? TIER_STYLES[score.tier] : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-slate-400 hover:shadow-md transition-all">
      {tierStyle && <div className={`h-1 w-full ${tierStyle.bar}`} />}
      <div className="p-6">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-slate-800 truncate">
              {lead.name}
            </h3>
            {lead.address && (
              <p className="mt-1 text-sm text-slate-600">{lead.address}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {lead.rating !== null && (
                <span>
                  <span className="text-amber-500">★</span>{" "}
                  {lead.rating.toFixed(1)} · {lead.review_count ?? 0} reviews
                </span>
              )}
              {lead.phone && <span>{lead.phone}</span>}
              {lead.website && (
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-700 hover:underline"
                >
                  Website ↗
                </a>
              )}
            </div>
          </div>
          {score && tierStyle && (
            <div className="shrink-0 text-right">
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${tierStyle.badge}`}>
                {tierStyle.label}
              </div>
              <p className="mt-2 font-mono text-2xl font-semibold text-slate-800">
                {score.score}
                <span className="text-sm text-slate-400">/100</span>
              </p>
            </div>
          )}
        </header>

        {score && score.reasons.length > 0 && (
          <ul className="mt-4 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
            {score.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-slate-900 shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        )}

        {primaryContact && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm">
            <p className="font-semibold text-slate-800">
              {primaryContact.name}
              {primaryContact.title && (
                <span className="font-normal text-slate-500">
                  {" "}
                  · {primaryContact.title}
                </span>
              )}
            </p>
            {primaryContact.email ? (
              <p className="mt-1 font-mono text-xs text-slate-900">
                {primaryContact.email}
              </p>
            ) : primaryContact.email_candidates.length > 0 ? (
              <p className="mt-1 text-xs text-slate-500">
                Likely:{" "}
                <span className="font-mono">
                  {primaryContact.email_candidates.slice(0, 3).join(", ")}
                </span>
              </p>
            ) : null}
            {primaryContact.email_domain_verified && (
              <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                ✓ MX verified
              </span>
            )}
          </div>
        )}

        <div className="mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-900">
            3-touch outreach sequence
          </h4>
          <div className="mt-3 space-y-3">
            {outreach.touches.map((touch, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">
                    Day {touch.day_offset}
                  </span>
                  <span className="text-slate-500">{touch.purpose}</span>
                </div>
                {touch.subject && (
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {touch.subject}
                  </p>
                )}
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                  {touch.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function LeadsPage() {
  return (
    <AuthGuard>
      <LeadsTool />
    </AuthGuard>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";

import { AuthGuard } from "../_components/AuthGuard";
import { Nav } from "../_components/Nav";
import { authHeaders } from "../_lib/auth";
import { API } from "../_lib/types";

const STATUSES = [
  "new",
  "contacted",
  "replied",
  "qualified",
  "won",
  "lost",
] as const;
type Status = (typeof STATUSES)[number];

const TIER_COLORS: Record<string, string> = {
  hot: "bg-red-100 text-red-700 border-red-200",
  warm: "bg-amber-100 text-amber-700 border-amber-200",
  cold: "bg-slate-100 text-slate-900 border-slate-300",
};

const STATUS_COLORS: Record<Status, string> = {
  new: "bg-slate-100 text-slate-700",
  contacted: "bg-slate-100 text-slate-900",
  replied: "bg-purple-100 text-purple-700",
  qualified: "bg-amber-100 text-amber-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
};

type LeadSummary = {
  id: string;
  name: string;
  business_type: string;
  location: string;
  score: number | null;
  tier: string | null;
  status: Status;
  updated_at: string;
};

export default function CRMPage() {
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<Status | "">("");
  const [filterTier, setFilterTier] = useState<"" | "hot" | "warm" | "cold">(
    "",
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterTier) params.set("tier", filterTier);
      const res = await fetch(
        `${API}/api/growth/crm/leads?${params.toString()}`,
        { headers: authHeaders() },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      setLeads(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterTier]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(leadId: string, newStatus: Status) {
    try {
      const res = await fetch(`${API}/api/growth/crm/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function deleteLead(leadId: string) {
    if (!confirm("Delete this lead?")) return;
    try {
      const res = await fetch(`${API}/api/growth/crm/leads/${leadId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok && res.status !== 204) throw new Error(`Delete failed`);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const statusCounts = STATUSES.reduce<Record<Status, number>>(
    (acc, s) => {
      acc[s] = leads.filter((l) => l.status === s).length;
      return acc;
    },
    {} as Record<Status, number>,
  );

  return (
    <AuthGuard>
      <Nav active="/crm" />

      <div
        className="relative bg-slate-800"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-slate-900/80" />
        <div className="relative mx-auto max-w-6xl px-6 py-12 text-center">
          <span className="text-5xl mb-3 block">📊</span>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Pipeline CRM
          </h1>
          <p className="mt-3 text-lg text-slate-200 max-w-2xl mx-auto">
            Track every lead from <strong>New</strong> through to{" "}
            <strong>Won</strong>. Import results from the Lead Finder, then move
            them through your pipeline.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl w-full px-6 py-10">
        {/* Pipeline summary */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
              className={`rounded-xl border-2 p-3 text-center transition-colors ${
                filterStatus === s
                  ? "border-slate-700 bg-slate-50"
                  : "border-slate-200 bg-white hover:border-slate-400"
              }`}
            >
              <div className="text-2xl font-bold text-slate-900">
                {statusCounts[s] ?? 0}
              </div>
              <div className="text-xs font-medium text-slate-600 capitalize">
                {s}
              </div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-6 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-slate-600">Filter:</span>

          <div className="flex gap-1">
            {(["", "hot", "warm", "cold"] as const).map((t) => (
              <button
                key={t || "all-tier"}
                onClick={() => setFilterTier(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filterTier === t
                    ? "bg-slate-900 text-slate-900"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {t === "" ? "All tiers" : `${t} 🔥`.replace("🔥", "")}
                {t === "hot" && " 🔴"}
                {t === "warm" && " 🟡"}
                {t === "cold" && " 🔵"}
              </button>
            ))}
          </div>

          {(filterStatus || filterTier) && (
            <button
              onClick={() => {
                setFilterStatus("");
                setFilterTier("");
              }}
              className="text-xs font-medium text-slate-900 hover:underline"
            >
              Clear filters
            </button>
          )}

          <button
            onClick={load}
            className="ml-auto text-xs font-medium text-slate-900 hover:underline"
          >
            ↻ Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-slate-500 py-12">Loading leads…</div>
        ) : leads.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <h2 className="text-lg font-semibold text-slate-700 mb-1">
              No leads yet
            </h2>
            <p className="text-sm text-slate-500">
              Run a search in{" "}
              <a href="/leads" className="text-slate-900 underline">
                Lead Finder
              </a>{" "}
              to import leads here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-[200px]">
                  <h3 className="font-semibold text-slate-900">{lead.name}</h3>
                  <p className="text-xs text-slate-500">
                    {lead.business_type} · {lead.location}
                  </p>
                </div>

                {lead.score !== null && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-slate-900">
                      {lead.score}
                    </div>
                    <div className="text-xs text-slate-500">score</div>
                  </div>
                )}

                {lead.tier && (
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${TIER_COLORS[lead.tier] ?? ""}`}
                  >
                    {lead.tier}
                  </span>
                )}

                <select
                  value={lead.status}
                  onChange={(e) =>
                    updateStatus(lead.id, e.target.value as Status)
                  }
                  className={`rounded-lg px-2 py-1 text-xs font-semibold border-0 ${STATUS_COLORS[lead.status]}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => deleteLead(lead.id)}
                  className="text-slate-400 hover:text-red-600 text-sm"
                  title="Delete lead"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-auto bg-slate-800 text-slate-900 text-center py-6 text-sm">
        © {new Date().getFullYear()} Strategy Business Growth — Powered by Claude AI
      </footer>
    </AuthGuard>
  );
}

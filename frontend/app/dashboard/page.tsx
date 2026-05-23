"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AuthGuard } from "../_components/AuthGuard";
import { Nav } from "../_components/Nav";
import { authHeaders } from "../_lib/auth";
import { API } from "../_lib/types";

type PlanSummary = {
  id: string;
  user_input: string;
  status: "running" | "done" | "error";
  created_at: string;
  updated_at: string;
  project_name: string | null;
};

function Dashboard() {
  const [plans, setPlans] = useState<PlanSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/plans`, { headers: authHeaders() });
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        const data = await res.json();
        setPlans(data.plans);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, []);

  return (
    <>
      <Nav active="/dashboard" />

      <div
        className="relative bg-blue-900"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-blue-900/80" />
        <div className="relative mx-auto max-w-6xl px-6 py-14 text-center">
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            Your Project Dashboard
          </h1>
          <p className="mt-3 text-xl text-blue-100">
            All your saved AI-generated strategy plans, in one place.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl w-full px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Saved Plans</h2>
          <Link
            href="/"
            className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-800"
          >
            + New Plan
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {plans === null && !error && (
          <div className="text-center py-12 text-slate-500">Loading…</div>
        )}

        {plans && plans.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
            <span className="text-6xl block mb-4">📋</span>
            <h3 className="text-xl font-semibold text-slate-700">
              No plans yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Generate your first strategic plan to see it here.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-blue-800"
            >
              Create your first plan →
            </Link>
          </div>
        )}

        {plans && plans.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => (
              <Link
                key={p.id}
                href={`/plans/${p.id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-2xl">📊</span>
                  <StatusBadge status={p.status} />
                </div>
                <h3 className="font-semibold text-slate-800 group-hover:text-blue-700 line-clamp-2">
                  {p.project_name ?? "Untitled project"}
                </h3>
                <p className="mt-2 text-xs text-slate-500 line-clamp-3">
                  {p.user_input}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
                  {new Date(p.created_at).toLocaleDateString()} ·{" "}
                  {new Date(p.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-auto bg-blue-900 text-blue-300 text-center py-6 text-sm">
        © {new Date().getFullYear()} StrategyGrowth AI — Powered by Claude AI
      </footer>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "done"
      ? "bg-green-100 text-green-700"
      : status === "running"
      ? "bg-amber-100 text-amber-700 animate-pulse"
      : "bg-red-100 text-red-700";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles}`}>
      {status}
    </span>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}

"use client";

import { useEffect, useState } from "react";

import { authHeaders } from "../_lib/auth";
import { API } from "../_lib/types";

type Usage = {
  tier: string;
  tokens_used: number;
  tokens_remaining: number;
  token_limit: number;
  generations_used: number;
  generation_limit: number;
  plan: { label: string; price_usd: number };
};

export function UsageBadge() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const headers = authHeaders();
    if (!headers.Authorization) return;
    fetch(`${API}/api/billing/usage`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then(setUsage)
      .catch(() => {});
  }, []);

  if (!usage) return null;
  const pct = Math.min(100, (usage.tokens_used / usage.token_limit) * 100);
  const colour =
    pct >= 85
      ? "bg-red-500"
      : pct >= 60
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-blue-700 hover:bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
        title="Usage this month"
      >
        {usage.plan.label} · {Math.round(pct)}%
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-lg p-4 text-slate-800 z-50">
          <p className="text-sm font-semibold">{usage.plan.label} plan</p>
          <p className="text-xs text-slate-500 mb-3">
            ${usage.plan.price_usd}/month
          </p>
          <div>
            <p className="text-xs text-slate-500">Tokens</p>
            <div className="mt-1 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className={`${colour} h-full`} style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {usage.tokens_used.toLocaleString()} /{" "}
              {usage.token_limit.toLocaleString()}
            </p>
          </div>
          <div className="mt-3">
            <p className="text-xs text-slate-500">Generations</p>
            <p className="mt-1 text-xs text-slate-600">
              {usage.generations_used} / {usage.generation_limit}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

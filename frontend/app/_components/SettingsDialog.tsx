"use client";

import { useEffect, useState } from "react";

import {
  authHeaders,
  getSelectedModel,
  setSelectedModel,
} from "../_lib/auth";
import { API } from "../_lib/types";

type Model = {
  id: string;
  name: string;
  tier: string;
  input_per_million: number;
  output_per_million: number;
  cached_input_per_million: number;
};

type Plan = {
  tier: string;
  label: string;
  price_usd: number;
  monthly_token_limit: number;
  monthly_generation_limit: number;
  allowed_models: string[];
  available: boolean;
};

function formatCost(n: number): string {
  if (n < 0.01) return `<$0.01`;
  return `$${n.toFixed(2)}`;
}

export function SettingsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [models, setModels] = useState<Model[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<string | null>(getSelectedModel());

  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch(`${API}/api/models`).then((r) => r.json()),
      fetch(`${API}/api/billing/plans`).then((r) => r.json()),
    ])
      .then(([m, p]) => {
        setModels(m.models);
        setPlans(p.plans);
      })
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <section className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700 mb-3">
            AI Model
          </h3>
          <div className="space-y-2">
            {models.map((m) => {
              const isSelected = selected === m.id;
              // Rough estimate: 5k input + 2k output per generation
              const estCost =
                (5000 / 1_000_000) * m.input_per_million +
                (2000 / 1_000_000) * m.output_per_million;
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => {
                    setSelected(m.id);
                    setSelectedModel(m.id);
                  }}
                  className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
                    isSelected
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-slate-800">{m.name}</p>
                      <p className="text-xs text-slate-500 capitalize">
                        {m.tier}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-600">
                        ~{formatCost(estCost)}/generation
                      </p>
                      <p className="text-xs text-slate-400">
                        ${m.input_per_million}/M in · ${m.output_per_million}/M
                        out
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700 mb-3">
            Plans
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {plans.map((p) => (
              <div
                key={p.tier}
                className="rounded-xl border border-slate-200 p-4 relative"
              >
                {!p.available && p.tier !== "free" && (
                  <span className="absolute top-2 right-2 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-semibold">
                    Coming Soon
                  </span>
                )}
                <p className="font-bold text-slate-800">{p.label}</p>
                <p className="text-2xl font-extrabold text-blue-700 mt-1">
                  ${p.price_usd}
                  <span className="text-sm font-normal text-slate-500">
                    /mo
                  </span>
                </p>
                <ul className="mt-3 space-y-1 text-xs text-slate-600">
                  <li>{p.monthly_token_limit.toLocaleString()} tokens</li>
                  <li>{p.monthly_generation_limit} generations</li>
                  <li>{p.allowed_models.length} model(s)</li>
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

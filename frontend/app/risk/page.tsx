"use client";

import { useState } from "react";

import { AuthGuard } from "../_components/AuthGuard";
import { Nav } from "../_components/Nav";
import {
  BriefView,
  PipelineProgress,
  ResearchView,
  RiskView,
  StrategyView,
} from "../_components/Views";
import { authHeaders } from "../_lib/auth";
import { streamSse } from "../_lib/sse";
import type {
  AgentName,
  AgentStatus,
  ProjectBrief,
  ResearchFindings,
  RiskRegister,
  Strategy,
} from "../_lib/types";
import { API } from "../_lib/types";

const AGENTS: { key: AgentName; label: string }[] = [
  { key: "intake", label: "Intake" },
  { key: "research", label: "Research" },
  { key: "strategy", label: "Strategy" },
  { key: "risk", label: "Risks" },
];

function RiskTool() {
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<AgentName, AgentStatus>>({
    intake: "idle", research: "idle", strategy: "idle", plan: "idle", risk: "idle",
  });
  const [brief, setBrief] = useState<ProjectBrief | null>(null);
  const [research, setResearch] = useState<ResearchFindings | null>(null);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [risks, setRisks] = useState<RiskRegister | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBrief(null);
    setResearch(null);
    setStrategy(null);
    setRisks(null);
    setStatuses({ intake: "idle", research: "idle", strategy: "idle", plan: "idle", risk: "idle" });
    setRunning(true);
    try {
      await streamSse(
        `${API}/api/standalone/risk`,
        { user_input: input },
        (name, data) => {
          if (name === "agent_start") {
            setStatuses((s) => ({ ...s, [data.agent as AgentName]: "running" }));
          } else if (name === "agent_complete") {
            const agent = data.agent as AgentName;
            const result = data.result as Record<string, unknown>;
            setStatuses((s) => ({ ...s, [agent]: "complete" }));
            if (agent === "intake") setBrief(result as unknown as ProjectBrief);
            if (agent === "research") setResearch(result as unknown as ResearchFindings);
            if (agent === "strategy") setStrategy(result as unknown as Strategy);
            if (agent === "risk") setRisks(result as unknown as RiskRegister);
          } else if (name === "error") {
            setError((data.message as string) ?? "Error");
          }
        },
        authHeaders(),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <Nav active="/risk" />
      <div
        className="relative bg-slate-800"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-slate-900/80" />
        <div className="relative mx-auto max-w-6xl px-6 py-16 text-center">
          <span className="text-5xl mb-4 block">⚠️</span>
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            Risk Register Generator
          </h1>
          <p className="mt-4 text-xl text-slate-200 max-w-xl mx-auto">
            Investor-ready risk register with likelihood, impact ratings, and mitigation strategies.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl w-full px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Describe your project or business
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={5}
                minLength={10}
                required
                disabled={running}
                placeholder="e.g. A fintech startup providing micro-loans to small businesses in Southeast Asia…"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={running || input.trim().length < 10}
                className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-900 shadow hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {running ? "Analysing risks…" : "Generate risk register →"}
              </button>
              {running && <span className="text-sm text-slate-700 animate-pulse">AI agents are working…</span>}
            </div>
          </form>
          <PipelineProgress agents={AGENTS} statuses={statuses} />
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}
        {brief && <BriefView brief={brief} />}
        {research && <ResearchView r={research} />}
        {strategy && <StrategyView s={strategy} />}
        {risks && <RiskView r={risks} />}
      </main>

      <footer className="mt-auto bg-slate-800 text-slate-900 text-center py-6 text-sm">
        © {new Date().getFullYear()} Strategy Business Growth — Powered by Claude AI
      </footer>
    </>
  );
}

export default function RiskPage() {
  return (
    <AuthGuard>
      <RiskTool />
    </AuthGuard>
  );
}

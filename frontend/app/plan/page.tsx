"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthGuard } from "../_components/AuthGuard";
import { Nav } from "../_components/Nav";
import {
  BriefView,
  PipelineProgress,
  ResearchView,
  RiskView,
  RoadmapView,
  StrategyView,
} from "../_components/Views";
import { authHeaders, getToken } from "../_lib/auth";
import { streamSse } from "../_lib/sse";
import type {
  AgentName,
  AgentStatus,
  ProjectBrief,
  ResearchFindings,
  RiskRegister,
  Roadmap,
  Strategy,
} from "../_lib/types";
import { API } from "../_lib/types";

const AGENTS: { key: AgentName; label: string }[] = [
  { key: "intake", label: "Intake" },
  { key: "research", label: "Research" },
  { key: "strategy", label: "Strategy" },
  { key: "plan", label: "Roadmap" },
  { key: "risk", label: "Risks" },
];

export default function PlanPage() {
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<AgentName, AgentStatus>>({
    intake: "idle",
    research: "idle",
    strategy: "idle",
    plan: "idle",
    risk: "idle",
  });
  const [brief, setBrief] = useState<ProjectBrief | null>(null);
  const [research, setResearch] = useState<ResearchFindings | null>(null);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [risks, setRisks] = useState<RiskRegister | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);

  function reset() {
    setBrief(null);
    setResearch(null);
    setStrategy(null);
    setRoadmap(null);
    setRisks(null);
    setPlanId(null);
    setStatuses({
      intake: "idle",
      research: "idle",
      strategy: "idle",
      plan: "idle",
      risk: "idle",
    });
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setRunning(true);
    try {
      await streamSse(
        `${API}/api/plan`,
        { user_input: input },
        (name, data) => {
          if (name === "plan_created") {
            setPlanId(data.plan_id as string);
          } else if (name === "agent_start") {
            const agent = data.agent as AgentName;
            setStatuses((s) => ({ ...s, [agent]: "running" }));
          } else if (name === "agent_complete") {
            const agent = data.agent as AgentName;
            const result = data.result as Record<string, unknown>;
            setStatuses((s) => ({ ...s, [agent]: "complete" }));
            if (agent === "intake") setBrief(result as unknown as ProjectBrief);
            if (agent === "research")
              setResearch(result as unknown as ResearchFindings);
            if (agent === "strategy")
              setStrategy(result as unknown as Strategy);
            if (agent === "plan") setRoadmap(result as unknown as Roadmap);
            if (agent === "risk") setRisks(result as unknown as RiskRegister);
          } else if (name === "error") {
            setError((data.message as string) ?? "Pipeline error");
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

  const hasResults = brief || research || strategy || roadmap || risks;

  return (
    <AuthGuard>
      <Nav active="/plan" />

      {/* Hero */}
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
        <div className="relative mx-auto max-w-6xl px-6 py-16 text-center">
          <span className="text-5xl mb-4 block">📋</span>
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            Full Strategic Plan
          </h1>
          <p className="mt-4 text-xl text-slate-200 max-w-2xl mx-auto">
            All five AI agents in one run — brief, market research, GTM
            strategy, phased roadmap, and risk register.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl w-full px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <label className="block text-sm font-semibold text-slate-700">
              Describe your project
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={6}
              minLength={30}
              required
              disabled={running}
              placeholder="e.g. I want to build a SaaS that helps Australian property managers track maintenance, compliance, and tenant communications. Budget ~$80k, target launch Q4 2026."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-60"
            />
            <p className="text-xs text-slate-500">
              Minimum 30 characters — the more concrete, the better.
            </p>
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={running || input.trim().length < 30}
                className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-900 shadow hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {running ? "Planning…" : "Generate full plan →"}
              </button>
              {running && (
                <span className="text-sm text-slate-700 animate-pulse">
                  AI agents are working…
                </span>
              )}
            </div>
          </form>

          <PipelineProgress agents={AGENTS} statuses={statuses} />
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {planId && getToken() && !running && (
          <div className="mt-6 rounded-xl border border-slate-300 bg-slate-50 px-5 py-4 flex items-center justify-between flex-wrap gap-3">
            <div className="text-sm text-slate-900">
              ✓ Plan saved to your dashboard — open it for PDF export & AI chat.
            </div>
            <Link
              href={`/plans/${planId}`}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-slate-800"
            >
              Open plan →
            </Link>
          </div>
        )}

        {hasResults && (
          <div className="mt-8 space-y-1">
            {brief && <BriefView brief={brief} />}
            {research && <ResearchView r={research} />}
            {strategy && <StrategyView s={strategy} />}
            {roadmap && <RoadmapView r={roadmap} />}
            {risks && <RiskView r={risks} />}
          </div>
        )}
      </main>

      <footer className="mt-auto bg-slate-800 text-slate-900 text-center py-6 text-sm">
        © {new Date().getFullYear()} Strategy Business Growth — Powered by Claude AI
      </footer>
    </AuthGuard>
  );
}

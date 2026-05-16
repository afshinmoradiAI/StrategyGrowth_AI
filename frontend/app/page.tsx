"use client";

import Link from "next/link";
import { useState } from "react";

import { Nav } from "./_components/Nav";
import {
  BriefView,
  PipelineProgress,
  ResearchView,
  RiskView,
  RoadmapView,
  StrategyView,
} from "./_components/Views";
import { streamSse } from "./_lib/sse";
import type {
  AgentName,
  AgentStatus,
  ProjectBrief,
  ResearchFindings,
  RiskRegister,
  Roadmap,
  Strategy,
} from "./_lib/types";
import { API } from "./_lib/types";

const AGENTS: { key: AgentName; label: string }[] = [
  { key: "intake", label: "Intake" },
  { key: "research", label: "Research" },
  { key: "strategy", label: "Strategy" },
  { key: "plan", label: "Roadmap" },
  { key: "risk", label: "Risks" },
];

const TOOLS = [
  {
    href: "/research",
    emoji: "🔍",
    title: "Market & Competitor Analysis",
    desc: "Free for one idea — overview, competitors, trends, benchmarks.",
    tag: "Free",
    tagColor: "bg-green-100 text-green-700",
  },
  {
    href: "/strategy",
    emoji: "📊",
    title: "Go-To-Market Strategy",
    desc: "Positioning, value props, differentiators for CEOs.",
    tag: "Pro",
    tagColor: "bg-blue-100 text-blue-700",
  },
  {
    href: "/risk",
    emoji: "⚠️",
    title: "Risk Register",
    desc: "Likelihood × impact register with mitigations for investors.",
    tag: "Pro",
    tagColor: "bg-blue-100 text-blue-700",
  },
];

export default function Home() {
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

  function reset() {
    setBrief(null);
    setResearch(null);
    setStrategy(null);
    setRoadmap(null);
    setRisks(null);
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
          if (name === "agent_start") {
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
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  const hasResults = brief || research || strategy || roadmap || risks;

  return (
    <>
      <Nav active="/" />

      {/* Hero Section */}
      <div
        className="relative bg-blue-900"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-blue-900/75" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/30 px-4 py-1.5 text-sm font-medium text-blue-100 ring-1 ring-blue-400/40 mb-6">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            AI-Powered Strategy Platform
          </div>
          <h1 className="text-6xl font-extrabold tracking-tight text-white leading-tight">
            Turn Your Idea Into
            <br />
            <span className="text-blue-300">A Complete Strategy</span>
          </h1>
          <p className="mt-6 text-xl text-blue-100 max-w-2xl mx-auto">
            Five AI agents analyse your project — intake, research, strategise,
            plan, and risk-assess — in minutes, not months.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-blue-200">
            <span>✓ Market research</span>
            <span>✓ GTM strategy</span>
            <span>✓ Phased roadmap</span>
            <span>✓ Risk register</span>
          </div>
        </div>
      </div>

      {/* Tool Cards */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-blue-600 mb-6">
            Standalone Tools
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {TOOLS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="group rounded-xl border border-slate-200 bg-slate-50 p-5 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{t.emoji}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.tagColor}`}
                  >
                    {t.tag}
                  </span>
                </div>
                <div className="font-semibold text-slate-800 group-hover:text-blue-700">
                  {t.title}
                </div>
                <div className="mt-1 text-sm text-slate-500">{t.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Full Plan Form */}
      <main className="mx-auto max-w-6xl w-full px-6 py-12">
        <div className="rounded-2xl border border-blue-100 bg-white shadow-sm p-8">
          <h2 className="text-2xl font-bold text-slate-800">
            Generate Full Plan
          </h2>
          <p className="mt-1 text-slate-500">
            All five agents in one run — brief, research, strategy, roadmap, and
            risks.
          </p>
          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={5}
              minLength={10}
              required
              disabled={running}
              placeholder="e.g. I want to build a SaaS that helps Australian property managers track maintenance, compliance, and tenant communications..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
            />
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={running || input.trim().length < 10}
                className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-blue-800 disabled:opacity-50 transition-colors"
              >
                {running ? "Planning…" : "Generate full plan →"}
              </button>
              {running && (
                <span className="text-sm text-blue-600 animate-pulse">
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

      {/* Footer */}
      <footer className="mt-auto bg-blue-900 text-blue-300 text-center py-6 text-sm">
        © {new Date().getFullYear()} StrategyGrowth AI — Powered by Claude AI
      </footer>
    </>
  );
}

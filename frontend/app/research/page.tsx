"use client";

import { useState } from "react";

import { Nav } from "../_components/Nav";
import {
  BriefView,
  PipelineProgress,
  ResearchView,
} from "../_components/Views";
import { streamSse } from "../_lib/sse";
import type {
  AgentName,
  AgentStatus,
  ProjectBrief,
  ResearchFindings,
} from "../_lib/types";
import { API } from "../_lib/types";

const AGENTS: { key: AgentName; label: string }[] = [
  { key: "intake", label: "Intake" },
  { key: "research", label: "Research" },
];

export default function ResearchPage() {
  const [email, setEmail] = useState("");
  const [input, setInput] = useState("");
  const [emailCaptured, setEmailCaptured] = useState(false);
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBrief(null);
    setResearch(null);
    setStatuses({ intake: "idle", research: "idle", strategy: "idle", plan: "idle", risk: "idle" });
    setRunning(true);
    try {
      const leadRes = await fetch(`${API}/api/standalone/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, user_input: input }),
      });
      if (!leadRes.ok) throw new Error(`Lead capture failed: ${leadRes.status}`);
      setEmailCaptured(true);

      await streamSse(`${API}/api/standalone/research`, { user_input: input }, (name, data) => {
        if (name === "agent_start") {
          setStatuses((s) => ({ ...s, [data.agent as AgentName]: "running" }));
        } else if (name === "agent_complete") {
          const agent = data.agent as AgentName;
          const result = data.result as Record<string, unknown>;
          setStatuses((s) => ({ ...s, [agent]: "complete" }));
          if (agent === "intake") setBrief(result as unknown as ProjectBrief);
          if (agent === "research") setResearch(result as unknown as ResearchFindings);
        } else if (name === "error") {
          setError((data.message as string) ?? "Error");
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <Nav active="/research" />

      <div
        className="relative bg-blue-900"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-blue-900/80" />
        <div className="relative mx-auto max-w-6xl px-6 py-16 text-center">
          <span className="text-5xl mb-4 block">🔍</span>
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            Market & Competitor Analysis
          </h1>
          <p className="mt-4 text-xl text-blue-100 max-w-xl mx-auto">
            Free for one project idea — market overview, competitor landscape,
            trends, and benchmarks.
          </p>
          <div className="mt-4 inline-block rounded-full bg-green-500/20 border border-green-400/40 px-4 py-1 text-sm font-semibold text-green-300">
            Free — No credit card required
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl w-full px-6 py-12">
        <div className="rounded-2xl border border-blue-100 bg-white shadow-sm p-8">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Your email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={running}
                placeholder="your@email.com"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Describe your project idea
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={5}
                minLength={10}
                required
                disabled={running}
                placeholder="e.g. A SaaS platform that helps small retail businesses manage inventory…"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={running || input.trim().length < 10 || !email}
                className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-blue-800 disabled:opacity-50 transition-colors"
              >
                {running ? "Researching…" : "Get free research →"}
              </button>
              {emailCaptured && !running && (
                <span className="text-sm text-green-600 font-medium">
                  ✓ Saved — full strategy upsell sent to {email}
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

        {brief && <BriefView brief={brief} />}
        {research && <ResearchView r={research} />}
      </main>

      <footer className="mt-auto bg-blue-900 text-blue-300 text-center py-6 text-sm">
        © {new Date().getFullYear()} StrategyGrowth AI — Powered by Claude AI
      </footer>
    </>
  );
}

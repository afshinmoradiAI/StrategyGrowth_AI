"use client";

import { useState } from "react";

type Stakeholder = { role: string; interest: string };
type ProjectBrief = {
  project_name: string;
  domain: string;
  summary: string;
  goals: string[];
  target_audience: string[];
  constraints: string[];
  success_criteria: string[];
  timeline: string | null;
  budget: string | null;
  stakeholders: Stakeholder[];
  open_questions: string[];
};

type Competitor = {
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
};
type Source = { title: string; url: string | null; note: string | null };
type ResearchFindings = {
  market_overview: string;
  competitors: Competitor[];
  trends: string[];
  benchmarks: string[];
  observed_risks: string[];
  sources: Source[];
};

type Objective = { objective: string; rationale: string };
type Strategy = {
  positioning: string;
  value_propositions: string[];
  differentiators: string[];
  objectives: Objective[];
  assumptions: string[];
};

type Task = {
  id: string;
  title: string;
  description: string;
  estimate: string | null;
  dependencies: string[];
};
type Milestone = { id: string; title: string; target: string; tasks: Task[] };
type Phase = {
  id: string;
  name: string;
  duration: string;
  objective: string;
  milestones: Milestone[];
};
type KPI = { name: string; target: string; measurement: string };
type Roadmap = { phases: Phase[]; kpis: KPI[] };

type Severity = "low" | "medium" | "high";
type Risk = {
  id: string;
  description: string;
  category: string;
  likelihood: Severity;
  impact: Severity;
  mitigation: string;
  owner: string | null;
};
type RiskRegister = { risks: Risk[] };

type AgentName = "intake" | "research" | "strategy" | "plan" | "risk";
type AgentStatus = "idle" | "running" | "complete";

const AGENTS: { key: AgentName; label: string }[] = [
  { key: "intake", label: "Intake" },
  { key: "research", label: "Research" },
  { key: "strategy", label: "Strategy" },
  { key: "plan", label: "Roadmap" },
  { key: "risk", label: "Risks" },
];

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

  function handleEvent(name: string, data: Record<string, unknown>) {
    if (name === "agent_start") {
      const agent = data.agent as AgentName;
      setStatuses((s) => ({ ...s, [agent]: "running" }));
      return;
    }
    if (name === "agent_complete") {
      const agent = data.agent as AgentName;
      const result = data.result as Record<string, unknown>;
      setStatuses((s) => ({ ...s, [agent]: "complete" }));
      if (agent === "intake") setBrief(result as unknown as ProjectBrief);
      if (agent === "research") setResearch(result as unknown as ResearchFindings);
      if (agent === "strategy") setStrategy(result as unknown as Strategy);
      if (agent === "plan") setRoadmap(result as unknown as Roadmap);
      if (agent === "risk") setRisks(result as unknown as RiskRegister);
      return;
    }
    if (name === "error") {
      setError((data.message as string) ?? "Pipeline error");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setRunning(true);
    try {
      const res = await fetch(`${API}/api/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_input: input }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`${res.status}: ${await res.text()}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const block = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          let evName = "message";
          let dataLine = "";
          for (const line of block.split("\n")) {
            if (line.startsWith("event: ")) evName = line.slice(7);
            else if (line.startsWith("data: ")) dataLine = line.slice(6);
          }
          if (dataLine) handleEvent(evName, JSON.parse(dataLine));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        AI Project Planner
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Describe your project. Five agents intake, research, strategise, plan,
        and risk-assess it.
      </p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          minLength={10}
          required
          disabled={running}
          placeholder="e.g. I want to build a SaaS that helps Australian property managers track maintenance, compliance, and tenant communications..."
          className="w-full rounded-md border border-zinc-300 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={running || input.trim().length < 10}
          className="self-start rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {running ? "Planning…" : "Generate plan"}
        </button>
      </form>

      <PipelineProgress statuses={statuses} />

      {error && (
        <div className="mt-6 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {brief && <BriefView brief={brief} />}
      {research && <ResearchView r={research} />}
      {strategy && <StrategyView s={strategy} />}
      {roadmap && <RoadmapView r={roadmap} />}
      {risks && <RiskView r={risks} />}
    </main>
  );
}

function PipelineProgress({
  statuses,
}: {
  statuses: Record<AgentName, AgentStatus>;
}) {
  return (
    <ol className="mt-6 grid grid-cols-5 gap-2 text-xs">
      {AGENTS.map(({ key, label }) => {
        const s = statuses[key];
        const color =
          s === "complete"
            ? "bg-green-600 text-white"
            : s === "running"
            ? "bg-amber-500 text-white animate-pulse"
            : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
        return (
          <li
            key={key}
            className={`rounded-md px-2 py-2 text-center font-medium ${color}`}
          >
            {label}
          </li>
        );
      })}
    </ol>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="font-medium">{title}</h3>
      <ul className="mt-1 list-disc pl-5 text-sm space-y-1">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

function BriefView({ brief }: { brief: ProjectBrief }) {
  return (
    <Section title={brief.project_name}>
      <p className="text-sm text-zinc-500">{brief.domain}</p>
      <p>{brief.summary}</p>
      <ListBlock title="Goals" items={brief.goals} />
      <ListBlock title="Target audience" items={brief.target_audience} />
      <ListBlock title="Constraints" items={brief.constraints} />
      <ListBlock title="Success criteria" items={brief.success_criteria} />
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-zinc-500">Timeline</div>
          <div>{brief.timeline ?? "—"}</div>
        </div>
        <div>
          <div className="text-zinc-500">Budget</div>
          <div>{brief.budget ?? "—"}</div>
        </div>
      </div>
      {brief.stakeholders.length > 0 && (
        <div>
          <h3 className="font-medium">Stakeholders</h3>
          <ul className="mt-1 text-sm space-y-1">
            {brief.stakeholders.map((s, i) => (
              <li key={i}>
                <span className="font-medium">{s.role}</span> — {s.interest}
              </li>
            ))}
          </ul>
        </div>
      )}
      <ListBlock title="Open questions" items={brief.open_questions} />
    </Section>
  );
}

function ResearchView({ r }: { r: ResearchFindings }) {
  return (
    <Section title="Market research">
      <p>{r.market_overview}</p>
      <ListBlock title="Trends" items={r.trends} />
      <ListBlock title="Benchmarks" items={r.benchmarks} />
      <ListBlock title="Observed risks" items={r.observed_risks} />
      {r.competitors.length > 0 && (
        <div>
          <h3 className="font-medium">Competitors</h3>
          <ul className="mt-1 space-y-2 text-sm">
            {r.competitors.map((c, i) => (
              <li key={i} className="rounded border border-zinc-200 p-2 dark:border-zinc-800">
                <div className="font-medium">{c.name}</div>
                <div className="text-zinc-600 dark:text-zinc-400">{c.description}</div>
                {c.strengths.length > 0 && (
                  <div className="mt-1">
                    <span className="text-green-700 dark:text-green-400">+ </span>
                    {c.strengths.join(", ")}
                  </div>
                )}
                {c.weaknesses.length > 0 && (
                  <div>
                    <span className="text-red-700 dark:text-red-400">− </span>
                    {c.weaknesses.join(", ")}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {r.sources.length > 0 && (
        <div>
          <h3 className="font-medium">Sources</h3>
          <ul className="mt-1 list-disc pl-5 text-sm space-y-1">
            {r.sources.map((s, i) => (
              <li key={i}>
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {s.title}
                  </a>
                ) : (
                  s.title
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}

function StrategyView({ s }: { s: Strategy }) {
  return (
    <Section title="Strategy">
      <p className="italic">{s.positioning}</p>
      <ListBlock title="Value propositions" items={s.value_propositions} />
      <ListBlock title="Differentiators" items={s.differentiators} />
      {s.objectives.length > 0 && (
        <div>
          <h3 className="font-medium">Objectives</h3>
          <ul className="mt-1 space-y-2 text-sm">
            {s.objectives.map((o, i) => (
              <li key={i}>
                <div className="font-medium">{o.objective}</div>
                <div className="text-zinc-600 dark:text-zinc-400">{o.rationale}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ListBlock title="Assumptions" items={s.assumptions} />
    </Section>
  );
}

function RoadmapView({ r }: { r: Roadmap }) {
  return (
    <Section title="Roadmap">
      <div className="space-y-4">
        {r.phases.map((p) => (
          <div key={p.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-medium">{p.name}</h3>
              <span className="text-xs text-zinc-500">{p.duration}</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{p.objective}</p>
            {p.milestones.map((m) => (
              <div key={m.id} className="mt-3 border-l-2 border-zinc-300 pl-3 dark:border-zinc-700">
                <div className="text-sm font-medium">
                  {m.title}{" "}
                  <span className="text-xs font-normal text-zinc-500">
                    ({m.target})
                  </span>
                </div>
                <ul className="mt-1 list-disc pl-5 text-sm space-y-1">
                  {m.tasks.map((t) => (
                    <li key={t.id}>
                      <span className="font-medium">{t.title}</span>
                      {t.estimate && (
                        <span className="text-xs text-zinc-500"> · {t.estimate}</span>
                      )}
                      <div className="text-zinc-600 dark:text-zinc-400">
                        {t.description}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
      {r.kpis.length > 0 && (
        <div>
          <h3 className="font-medium">KPIs</h3>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="py-1 pr-2">Name</th>
                <th className="py-1 pr-2">Target</th>
                <th className="py-1">Measurement</th>
              </tr>
            </thead>
            <tbody>
              {r.kpis.map((k, i) => (
                <tr key={i} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="py-1 pr-2 font-medium">{k.name}</td>
                  <td className="py-1 pr-2">{k.target}</td>
                  <td className="py-1">{k.measurement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

function RiskView({ r }: { r: RiskRegister }) {
  const sev = (s: Severity) =>
    s === "high"
      ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      : s === "medium"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  return (
    <Section title="Risk register">
      <ul className="space-y-2 text-sm">
        {r.risks.map((risk) => (
          <li
            key={risk.id}
            className="rounded border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-xs text-zinc-500">{risk.id}</span>
              <span className="font-medium">{risk.description}</span>
              <span className="text-xs text-zinc-500">· {risk.category}</span>
              <span className={`rounded px-2 py-0.5 text-xs ${sev(risk.likelihood)}`}>
                L: {risk.likelihood}
              </span>
              <span className={`rounded px-2 py-0.5 text-xs ${sev(risk.impact)}`}>
                I: {risk.impact}
              </span>
            </div>
            <div className="mt-1 text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">Mitigation: </span>
              {risk.mitigation}
            </div>
            {risk.owner && (
              <div className="text-xs text-zinc-500">Owner: {risk.owner}</div>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}

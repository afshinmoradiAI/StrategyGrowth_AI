import type {
  AgentName,
  AgentStatus,
  ProjectBrief,
  ResearchFindings,
  RiskRegister,
  Roadmap,
  Severity,
  Strategy,
} from "../_lib/types";

export function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-blue-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {title}
        </h2>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </section>
  );
}

export function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">
        {title}
      </h3>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PipelineProgress({
  agents,
  statuses,
}: {
  agents: { key: AgentName; label: string }[];
  statuses: Record<AgentName, AgentStatus>;
}) {
  return (
    <ol
      className="mt-6 grid gap-2 text-xs"
      style={{ gridTemplateColumns: `repeat(${agents.length}, minmax(0,1fr))` }}
    >
      {agents.map(({ key, label }) => {
        const s = statuses[key];
        const style =
          s === "complete"
            ? "bg-blue-700 text-white"
            : s === "running"
            ? "bg-amber-500 text-white animate-pulse"
            : "bg-slate-100 text-slate-500 border border-slate-200";
        return (
          <li
            key={key}
            className={`rounded-lg px-2 py-2.5 text-center font-semibold ${style}`}
          >
            {s === "complete" ? "✓ " : s === "running" ? "⟳ " : ""}
            {label}
          </li>
        );
      })}
    </ol>
  );
}

export function BriefView({ brief }: { brief: ProjectBrief }) {
  return (
    <Section title={brief.project_name} icon="📋">
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
        {brief.domain}
      </p>
      <p className="text-slate-700">{brief.summary}</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <ListBlock title="Goals" items={brief.goals} />
        <ListBlock title="Target audience" items={brief.target_audience} />
        <ListBlock title="Constraints" items={brief.constraints} />
        <ListBlock title="Success criteria" items={brief.success_criteria} />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
            Timeline
          </div>
          <div className="mt-1 text-sm font-medium text-slate-800">
            {brief.timeline ?? "—"}
          </div>
        </div>
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
            Budget
          </div>
          <div className="mt-1 text-sm font-medium text-slate-800">
            {brief.budget ?? "—"}
          </div>
        </div>
      </div>
      {brief.stakeholders.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">
            Stakeholders
          </h3>
          <ul className="space-y-1">
            {brief.stakeholders.map((s, i) => (
              <li key={i} className="text-sm text-slate-700">
                <span className="font-medium text-slate-900">{s.role}</span> —{" "}
                {s.interest}
              </li>
            ))}
          </ul>
        </div>
      )}
      <ListBlock title="Open questions" items={brief.open_questions} />
    </Section>
  );
}

export function ResearchView({ r }: { r: ResearchFindings }) {
  return (
    <Section title="Market Research" icon="🔍">
      <p className="text-slate-700">{r.market_overview}</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <ListBlock title="Trends" items={r.trends} />
        <ListBlock title="Benchmarks" items={r.benchmarks} />
        <ListBlock title="Observed risks" items={r.observed_risks} />
      </div>
      {r.competitors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-3">
            Competitors
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {r.competitors.map((c, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="font-semibold text-slate-800">{c.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {c.description}
                </div>
                {c.strengths.length > 0 && (
                  <div className="mt-2 text-xs text-green-700">
                    ✓ {c.strengths.join(" · ")}
                  </div>
                )}
                {c.weaknesses.length > 0 && (
                  <div className="mt-1 text-xs text-red-600">
                    ✗ {c.weaknesses.join(" · ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {r.sources.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">
            Sources
          </h3>
          <ul className="space-y-1">
            {r.sources.map((s, i) => (
              <li key={i} className="text-sm">
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {s.title}
                  </a>
                ) : (
                  <span className="text-slate-600">{s.title}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}

export function StrategyView({ s }: { s: Strategy }) {
  return (
    <Section title="Go-To-Market Strategy" icon="📊">
      <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-4">
        <p className="text-blue-900 font-medium italic">{s.positioning}</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <ListBlock title="Value propositions" items={s.value_propositions} />
        <ListBlock title="Differentiators" items={s.differentiators} />
      </div>
      {s.objectives.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-3">
            Objectives
          </h3>
          <div className="space-y-2">
            {s.objectives.map((o, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="font-semibold text-slate-800">{o.objective}</div>
                <div className="text-sm text-slate-500 mt-1">{o.rationale}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <ListBlock title="Assumptions" items={s.assumptions} />
    </Section>
  );
}

export function RoadmapView({ r }: { r: Roadmap }) {
  return (
    <Section title="Project Roadmap" icon="🗺️">
      <div className="space-y-4">
        {r.phases.map((p, pi) => (
          <div
            key={p.id}
            className="rounded-xl border border-slate-200 overflow-hidden"
          >
            <div className="flex items-center justify-between bg-blue-50 border-b border-blue-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                  {pi + 1}
                </span>
                <h3 className="font-semibold text-slate-800">{p.name}</h3>
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                {p.duration}
              </span>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-slate-500 mb-3">{p.objective}</p>
              {p.milestones.map((m) => (
                <div
                  key={m.id}
                  className="mt-2 border-l-2 border-blue-300 pl-3"
                >
                  <div className="text-sm font-semibold text-slate-700">
                    {m.title}{" "}
                    <span className="font-normal text-blue-500 text-xs">
                      ({m.target})
                    </span>
                  </div>
                  <ul className="mt-1 space-y-1">
                    {m.tasks.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-start gap-2 text-sm text-slate-600"
                      >
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                        <span>
                          <span className="font-medium">{t.title}</span>
                          {t.estimate && (
                            <span className="text-xs text-slate-400">
                              {" "}
                              · {t.estimate}
                            </span>
                          )}
                          <span className="text-slate-500">
                            {" "}
                            — {t.description}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {r.kpis.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-3">
            KPIs
          </h3>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-50 text-left text-xs font-semibold uppercase tracking-wide text-blue-700">
                  <th className="px-4 py-3">Metric</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Measurement</th>
                </tr>
              </thead>
              <tbody>
                {r.kpis.map((k, i) => (
                  <tr
                    key={i}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {k.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{k.target}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {k.measurement}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Section>
  );
}

export function RiskView({ r }: { r: RiskRegister }) {
  const sev = (s: Severity) =>
    s === "high"
      ? "bg-red-100 text-red-700 border border-red-200"
      : s === "medium"
      ? "bg-amber-100 text-amber-700 border border-amber-200"
      : "bg-slate-100 text-slate-600 border border-slate-200";

  return (
    <Section title="Risk Register" icon="⚠️">
      <div className="space-y-3">
        {r.risks.map((risk) => (
          <div
            key={risk.id}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-mono text-slate-400">{risk.id}</span>
              <span className="font-semibold text-slate-800">
                {risk.description}
              </span>
              <span className="text-xs text-slate-400">· {risk.category}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${sev(risk.likelihood)}`}>
                Likelihood: {risk.likelihood}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${sev(risk.impact)}`}>
                Impact: {risk.impact}
              </span>
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-medium text-slate-700">Mitigation: </span>
              {risk.mitigation}
            </div>
            {risk.owner && (
              <div className="mt-1 text-xs text-slate-400">
                Owner: {risk.owner}
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

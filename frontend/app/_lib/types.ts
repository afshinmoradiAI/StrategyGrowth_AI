export type Stakeholder = { role: string; interest: string };
export type ProjectBrief = {
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

export type Competitor = {
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
};
export type Source = { title: string; url: string | null; note: string | null };
export type ResearchFindings = {
  market_overview: string;
  competitors: Competitor[];
  trends: string[];
  benchmarks: string[];
  observed_risks: string[];
  sources: Source[];
};

export type Objective = { objective: string; rationale: string };
export type Strategy = {
  positioning: string;
  value_propositions: string[];
  differentiators: string[];
  objectives: Objective[];
  assumptions: string[];
};

export type Task = {
  id: string;
  title: string;
  description: string;
  estimate: string | null;
  dependencies: string[];
};
export type Milestone = { id: string; title: string; target: string; tasks: Task[] };
export type Phase = {
  id: string;
  name: string;
  duration: string;
  objective: string;
  milestones: Milestone[];
};
export type KPI = { name: string; target: string; measurement: string };
export type Roadmap = { phases: Phase[]; kpis: KPI[] };

export type Severity = "low" | "medium" | "high";
export type Risk = {
  id: string;
  description: string;
  category: string;
  likelihood: Severity;
  impact: Severity;
  mitigation: string;
  owner: string | null;
};
export type RiskRegister = { risks: Risk[] };

export type AgentName = "intake" | "research" | "strategy" | "plan" | "risk";
export type AgentStatus = "idle" | "running" | "complete";

export const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

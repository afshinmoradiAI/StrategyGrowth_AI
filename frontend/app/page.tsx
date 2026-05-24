"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Nav } from "./_components/Nav";
import { getToken } from "./_lib/auth";

const TOOLS = [
  {
    href: "/plan",
    emoji: "📋",
    title: "Full Strategic Plan",
    desc: "All five agents in one streaming pipeline — brief, research, strategy, roadmap, risks.",
    tag: "Flagship",
    tagColor: "bg-slate-100 text-slate-900",
  },
  {
    href: "/research",
    emoji: "🔍",
    title: "Market & Competitor Analysis",
    desc: "Market overview, competitors, trends and benchmarks — free for one project idea.",
    tag: "Free",
    tagColor: "bg-green-100 text-green-700",
  },
  {
    href: "/strategy",
    emoji: "📊",
    title: "Go-To-Market Strategy",
    desc: "Positioning, value props, differentiators, business objectives for CEOs.",
    tag: "Pro",
    tagColor: "bg-slate-100 text-slate-900",
  },
  {
    href: "/risk",
    emoji: "⚠️",
    title: "Risk Register",
    desc: "Likelihood × impact register with mitigations — investor-ready.",
    tag: "Pro",
    tagColor: "bg-slate-100 text-slate-900",
  },
  {
    href: "/leads",
    emoji: "🎯",
    title: "AI Lead Finder",
    desc: "Real businesses + decision-makers + AI scoring + 3-touch outreach sequences.",
    tag: "Growth",
    tagColor: "bg-emerald-100 text-emerald-700",
  },
  {
    href: "/content",
    emoji: "📝",
    title: "Content Studio",
    desc: "Platform-native posts for X, LinkedIn, IG, FB and TikTok — with image prompts.",
    tag: "Growth",
    tagColor: "bg-emerald-100 text-emerald-700",
  },
  {
    href: "/crm",
    emoji: "📈",
    title: "Pipeline CRM",
    desc: "Track every lead from New → Contacted → Won with status, tier and notes.",
    tag: "Growth",
    tagColor: "bg-emerald-100 text-emerald-700",
  },
  {
    href: "/dashboard",
    emoji: "📁",
    title: "Saved Plans",
    desc: "Every plan saved automatically — re-open, download PDF/DOCX, chat with it.",
    tag: "Hub",
    tagColor: "bg-slate-100 text-slate-900",
  },
];

const STATS = [
  { value: "11", label: "AI agents working in parallel" },
  { value: "< 60s", label: "From idea to complete plan" },
  { value: "8", label: "End-to-end business tools" },
  { value: "100%", label: "Streaming, no waiting" },
];

const VALUES = [
  {
    emoji: "🚀",
    title: "From sentence to strategy",
    desc: "Describe your idea in plain English. AI agents return a board-ready strategy and a phased delivery roadmap — in under a minute.",
  },
  {
    emoji: "🎯",
    title: "Real leads, not lists",
    desc: "Google Places integration finds real businesses, scrapes their websites, identifies decision-makers, and writes outreach sequences ready to send.",
  },
  {
    emoji: "🛡️",
    title: "Investor-ready output",
    desc: "Every plan ships with a risk register (likelihood × impact + mitigations) and a phased roadmap that holds up in a pitch deck.",
  },
  {
    emoji: "💎",
    title: "Powered by Claude",
    desc: "Pick between Haiku (fast & cheap), Sonnet (balanced), or Opus (premium). Switch models per-request — pay only for what you use.",
  },
];

const WORKFLOW = [
  {
    n: "1",
    title: "Describe your business idea",
    desc: "One paragraph. Industry, budget, target market — whatever you know.",
  },
  {
    n: "2",
    title: "AI agents work in parallel",
    desc: "Intake → Research → Strategy → Roadmap + Risk, streamed live to your screen.",
  },
  {
    n: "3",
    title: "Find leads & launch outreach",
    desc: "Lead Finder turns 'dental clinics in Melbourne' into 20 scored, contactable leads.",
  },
  {
    n: "4",
    title: "Track, refine, win",
    desc: "Move leads through your CRM, generate posts in Content Studio, export plans to PDF.",
  },
];

export default function Landing() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setSignedIn(!!getToken());
  }, []);

  const ctaHref = signedIn ? "/plan" : "/login";
  const ctaLabel = signedIn ? "Open the Planner →" : "Get Started — Free →";

  return (
    <>
      <Nav active="/" />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section
        className="relative bg-slate-800"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-700/70" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-4 py-1.5 text-sm font-medium text-amber-200 ring-1 ring-amber-400/40 mb-6">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              The AI-powered growth platform for founders & CEOs
            </div>

            <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.05]">
              Turn a single idea into
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                strategy, roadmap, and revenue.
              </span>
            </h1>

            <p className="mt-6 text-xl text-slate-200 leading-relaxed max-w-2xl">
              Eleven specialised AI agents take your business idea and return a
              complete strategic plan, market research, qualified sales leads
              and ready-to-send outreach — in minutes, not months.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href={ctaHref}
                className="rounded-xl bg-white px-8 py-4 text-base font-bold text-slate-900 shadow-lg hover:bg-slate-50 hover:scale-[1.02] transition-all"
              >
                {ctaLabel}
              </Link>
              <Link
                href="/research"
                className="rounded-xl border-2 border-amber-400/60 bg-white/5 backdrop-blur px-8 py-4 text-base font-semibold text-amber-300 hover:bg-amber-500/10 transition-all"
              >
                Try Free Research →
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <span className="text-amber-400">✓</span> No credit card required
              </span>
              <span className="flex items-center gap-2">
                <span className="text-amber-400">✓</span> Powered by Claude AI
              </span>
              <span className="flex items-center gap-2">
                <span className="text-amber-400">✓</span> Streams live results
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────── */}
      <section className="bg-slate-900 border-y border-amber-500/30">
        <div className="mx-auto max-w-6xl px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-extrabold text-amber-400">{s.value}</div>
              <div className="mt-1 text-sm text-slate-300">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── VALUE PROPS ───────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              Why Strategy Business Growth
            </span>
            <h2 className="mt-3 text-4xl font-extrabold text-white">
              Everything you need to build, launch, and grow.
            </h2>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
              Replace months of consultant work and stacks of separate SaaS
              tools with one streamlined AI-powered platform.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="flex gap-5 p-6 rounded-2xl border border-slate-200 hover:border-slate-400 hover:shadow-lg transition-all"
              >
                <div className="text-4xl shrink-0">{v.emoji}</div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{v.title}</h3>
                  <p className="mt-2 text-slate-600 leading-relaxed">
                    {v.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              How it works
            </span>
            <h2 className="mt-3 text-4xl font-extrabold text-white">
              From idea to revenue in 4 steps.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW.map((step) => (
              <div
                key={step.n}
                className="relative rounded-2xl bg-white border border-slate-200 p-6 shadow-sm"
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-white to-slate-700 text-slate-900 font-extrabold text-xl flex items-center justify-center shadow-lg">
                  {step.n}
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOOLS GRID ────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              Your toolkit
            </span>
            <h2 className="mt-3 text-4xl font-extrabold text-white">
              Eight tools. One platform. Zero friction.
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TOOLS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 hover:border-slate-500 hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{t.emoji}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.tagColor}`}
                  >
                    {t.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-slate-900">
                  {t.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {t.desc}
                </p>
                <div className="mt-4 text-sm font-semibold text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open tool →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ──────────────────────────────────── */}
      <section className="bg-slate-800 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-amber-400">
            Built for
          </span>
          <h2 className="mt-3 text-4xl font-extrabold text-white">
            Founders. CEOs. Growth teams.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            <div className="bg-slate-900/60 rounded-2xl p-6 ring-1 ring-amber-500/30">
              <div className="text-3xl mb-3">👔</div>
              <h3 className="font-bold text-lg text-amber-400">CEOs & Founders</h3>
              <p className="mt-2 text-sm text-slate-300">
                Validate ideas, build investor-ready plans, present board-grade
                strategy in minutes.
              </p>
            </div>
            <div className="bg-slate-900/60 rounded-2xl p-6 ring-1 ring-amber-500/30">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="font-bold text-lg text-amber-400">Project Managers</h3>
              <p className="mt-2 text-sm text-slate-300">
                Generate phased roadmaps, KPI targets, milestones, and risk
                registers in one click.
              </p>
            </div>
            <div className="bg-slate-900/60 rounded-2xl p-6 ring-1 ring-amber-500/30">
              <div className="text-3xl mb-3">📈</div>
              <h3 className="font-bold text-lg text-amber-400">Growth Teams</h3>
              <p className="mt-2 text-sm text-slate-300">
                Find real leads, generate platform-native content, manage
                pipeline — without 5 tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-100 to-amber-50">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-4xl font-extrabold text-slate-900">
            Ready to turn your idea into a plan?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Sign up free, no credit card. Generate your first strategic plan in
            under 60 seconds.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href={ctaHref}
              className="rounded-xl bg-amber-500 px-8 py-4 text-base font-bold text-slate-900 shadow-lg hover:bg-amber-400 hover:scale-[1.02] transition-all"
            >
              {ctaLabel}
            </Link>
            <Link
              href="/research"
              className="rounded-xl border-2 border-slate-800 bg-white px-8 py-4 text-base font-bold text-slate-900 hover:bg-slate-50 transition-all"
            >
              Try Free Research First
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-300 text-center py-8 text-sm">
        <div className="font-semibold text-amber-400 mb-1">
          Strategy Business Growth
        </div>
        <div>
          © {new Date().getFullYear()} · Powered by Claude AI · Built for
          founders, CEOs and growth teams.
        </div>
      </footer>
    </>
  );
}

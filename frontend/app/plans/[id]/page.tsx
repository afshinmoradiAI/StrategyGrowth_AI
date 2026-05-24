"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AuthGuard } from "../../_components/AuthGuard";
import { Nav } from "../../_components/Nav";
import {
  BriefView,
  ResearchView,
  RiskView,
  RoadmapView,
  StrategyView,
} from "../../_components/Views";
import { authHeaders, getToken } from "../../_lib/auth";
import type {
  ProjectBrief,
  ResearchFindings,
  RiskRegister,
  Roadmap,
  Strategy,
} from "../../_lib/types";
import { API } from "../../_lib/types";

type FullPlan = {
  id: string;
  status: string;
  user_input: string;
  created_at: string;
  brief: ProjectBrief | null;
  research: ResearchFindings | null;
  strategy: Strategy | null;
  roadmap: Roadmap | null;
  risks: RiskRegister | null;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<FullPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [planRes, chatRes] = await Promise.all([
          fetch(`${API}/api/plans/${id}`, { headers: authHeaders() }),
          fetch(`${API}/api/plans/${id}/chat`, { headers: authHeaders() }),
        ]);
        if (!planRes.ok) throw new Error(`${planRes.status}: ${await planRes.text()}`);
        setPlan(await planRes.json());
        if (chatRes.ok) {
          const data = await chatRes.json();
          setMessages(data.messages);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, chatBusy]);

  async function downloadPdf() {
    if (!plan) return;
    setDownloading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API}/api/plans/${plan.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`PDF failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${plan.brief?.project_name ?? "plan"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDownloading(false);
    }
  }

  async function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || chatBusy || !plan) return;
    const userMsg: ChatMessage = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: chatInput,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    const text = chatInput;
    setChatInput("");
    setChatBusy(true);
    try {
      const res = await fetch(`${API}/api/plans/${plan.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      const data = await res.json();
      setMessages((m) => [...m, data.reply]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : String(err)}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setChatBusy(false);
    }
  }

  return (
    <>
      <Nav active="/dashboard" />

      {error && (
        <div className="mx-auto max-w-6xl mt-6 px-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        </div>
      )}

      {!plan && !error && (
        <div className="text-center py-20 text-slate-500">Loading plan…</div>
      )}

      {plan && (
        <>
          {/* Hero */}
          <div
            className="relative bg-slate-800"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-slate-900/80" />
            <div className="relative mx-auto max-w-6xl px-6 py-14">
              <p className="text-xs uppercase tracking-widest text-slate-900">
                Saved plan · {new Date(plan.created_at).toLocaleDateString()}
              </p>
              <h1 className="mt-2 text-5xl font-extrabold text-white tracking-tight">
                {plan.brief?.project_name ?? "Untitled Project"}
              </h1>
              {plan.brief?.domain && (
                <p className="mt-3 text-lg text-slate-600">{plan.brief.domain}</p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={downloadPdf}
                  disabled={downloading}
                  className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow hover:bg-slate-50 disabled:opacity-50"
                >
                  {downloading ? "Generating PDF…" : "📄 Download PDF"}
                </button>
                <a
                  href="#chat"
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow hover:bg-slate-900 ring-1 ring-slate-400"
                >
                  💬 Chat with this plan
                </a>
              </div>
            </div>
          </div>

          <main className="mx-auto max-w-6xl w-full px-6 py-10">
            {plan.brief && <BriefView brief={plan.brief} />}
            {plan.research && <ResearchView r={plan.research} />}
            {plan.strategy && <StrategyView s={plan.strategy} />}
            {plan.roadmap && <RoadmapView r={plan.roadmap} />}
            {plan.risks && <RiskView r={plan.risks} />}

            {/* Chat Section */}
            <section
              id="chat"
              className="mt-10 rounded-2xl border border-slate-300 bg-white shadow-sm overflow-hidden"
            >
              <div className="bg-slate-900 px-6 py-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  💬 Ask AI about this plan
                </h2>
                <p className="text-sm text-slate-700 mt-0.5">
                  Refine, expand, or run what-if scenarios with full context of your plan.
                </p>
              </div>

              <div className="px-6 py-4 max-h-[500px] overflow-y-auto">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-400 mb-3">Try asking:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        "Expand phase 2 with more detail",
                        "What if the budget drops 30%?",
                        "Add a marketing milestone to phase 1",
                        "Which risk should we tackle first?",
                      ].map((q) => (
                        <button
                          key={q}
                          onClick={() => setChatInput(q)}
                          className="rounded-full bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 hover:bg-slate-100"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        m.role === "user"
                          ? "bg-slate-900 text-slate-900"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                  </div>
                ))}

                {chatBusy && (
                  <div className="flex justify-start mb-3">
                    <div className="bg-slate-100 rounded-2xl px-4 py-3 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-slate-800 animate-bounce" />
                        <span className="h-2 w-2 rounded-full bg-slate-800 animate-bounce" style={{ animationDelay: "0.15s" }} />
                        <span className="h-2 w-2 rounded-full bg-slate-800 animate-bounce" style={{ animationDelay: "0.3s" }} />
                      </span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              <form
                onSubmit={sendChat}
                className="border-t border-slate-200 p-4 flex gap-2"
              >
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatBusy}
                  placeholder="Ask anything about your plan…"
                  className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                <button
                  type="submit"
                  disabled={chatBusy || !chatInput.trim()}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow hover:bg-slate-800 disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </section>
          </main>
        </>
      )}

      <footer className="mt-auto bg-slate-800 text-slate-900 text-center py-6 text-sm">
        © {new Date().getFullYear()} Strategy Business Growth — Powered by Claude AI
      </footer>
    </>
  );
}

export default function PlanPage() {
  return (
    <AuthGuard>
      <PlanDetail />
    </AuthGuard>
  );
}

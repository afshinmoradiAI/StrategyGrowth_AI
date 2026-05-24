"use client";

import { useState } from "react";

import { AuthGuard } from "../_components/AuthGuard";
import { Nav } from "../_components/Nav";
import { authHeaders } from "../_lib/auth";
import { API } from "../_lib/types";

const PLATFORMS = [
  { id: "x", label: "X (Twitter)", icon: "𝕏" },
  { id: "linkedin", label: "LinkedIn", icon: "in" },
  { id: "instagram", label: "Instagram", icon: "IG" },
  { id: "facebook", label: "Facebook", icon: "f" },
  { id: "tiktok", label: "TikTok", icon: "TT" },
] as const;

const TONES = [
  "professional",
  "casual",
  "inspirational",
  "humorous",
  "educational",
] as const;

type PlatformId = (typeof PLATFORMS)[number]["id"];

type PlatformPost = {
  platform: PlatformId;
  content: string;
  hashtags: string[];
  image_prompt: string;
  image_aspect_ratio: string;
};

type ContentResponse = {
  topic: string;
  posts: PlatformPost[];
};

export default function ContentPage() {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [cta, setCta] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("professional");
  const [selected, setSelected] = useState<Set<PlatformId>>(
    new Set(["linkedin", "x"]),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContentResponse | null>(null);

  function togglePlatform(id: PlatformId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/growth/content/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          topic,
          platforms: Array.from(selected),
          tone,
          audience: audience || null,
          call_to_action: cta || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      setResult((await res.json()) as ContentResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGuard>
      <Nav active="/content" />

      <div
        className="relative bg-slate-800"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-slate-900/80" />
        <div className="relative mx-auto max-w-6xl px-6 py-16 text-center">
          <span className="text-5xl mb-4 block">📝</span>
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            Content Studio
          </h1>
          <p className="mt-4 text-xl text-slate-200 max-w-2xl mx-auto">
            Generate platform-native posts for X, LinkedIn, Instagram, Facebook,
            and TikTok — with hashtags and AI-generated image prompts.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl w-full px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8">
          <form onSubmit={submit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Topic
              </label>
              <input
                type="text"
                required
                minLength={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
                placeholder="e.g. Launching a new property management app for landlords"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Platforms
              </label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => {
                  const isSelected = selected.has(p.id);
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                        isSelected
                          ? "border-slate-700 bg-slate-900 text-slate-900"
                          : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                      }`}
                    >
                      <span className="mr-2 font-bold">{p.icon}</span>
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) =>
                    setTone(e.target.value as (typeof TONES)[number])
                  }
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Target audience (optional)
                </label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. Australian property managers"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Call to action (optional)
              </label>
              <input
                type="text"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                disabled={loading}
                placeholder="e.g. Book a free demo"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <button
              type="submit"
              disabled={
                loading || topic.trim().length < 3 || selected.size === 0
              }
              className="self-start rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-900 shadow hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {loading ? "Generating…" : "Generate posts →"}
            </button>
          </form>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-6">
            {result.posts.map((post) => {
              const meta = PLATFORMS.find((p) => p.id === post.platform);
              return (
                <div
                  key={post.platform}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center gap-3">
                    <span className="font-bold text-slate-900">{meta?.icon}</span>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {meta?.label}
                    </h3>
                    <span className="ml-auto text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded px-2 py-0.5">
                      {post.image_aspect_ratio}
                    </span>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {post.content}
                    </p>

                    {post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.hashtags.map((h) => (
                          <span
                            key={h}
                            className="text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded px-2 py-1"
                          >
                            #{h.replace(/^#/, "")}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-4">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        Image prompt
                      </div>
                      <p className="text-sm text-slate-700 italic">
                        {post.image_prompt}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(post.content)}
                      className="text-xs font-medium text-slate-900 hover:text-slate-900"
                    >
                      📋 Copy post text
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="mt-auto bg-slate-800 text-slate-900 text-center py-6 text-sm">
        © {new Date().getFullYear()} Strategy Business Growth — Powered by Claude AI
      </footer>
    </AuthGuard>
  );
}

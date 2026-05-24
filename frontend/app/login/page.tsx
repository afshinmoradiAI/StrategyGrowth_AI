"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { apiLogin, apiRegister, saveSession } from "../_lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data =
        mode === "login"
          ? await apiLogin(email, password)
          : await apiRegister(email, password);
      saveSession(data.access_token, data.email);
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top bar */}
      <div className="bg-slate-800 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <span className="text-sm font-bold text-slate-900">SG</span>
          </div>
          <span className="text-lg font-bold text-slate-900">Strategy Business Growth</span>
        </Link>
      </div>

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
        <div className="relative px-6 py-14 text-center">
          <h1 className="text-4xl font-extrabold text-white">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-slate-600">
            {mode === "login"
              ? "Sign in to access Strategy and Risk Register tools"
              : "Join free — unlock Go-To-Market Strategy and Risk Register"}
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="mx-auto w-full max-w-md px-6 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8">
          {/* Toggle */}
          <div className="flex rounded-xl border border-slate-200 p-1 mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                  mode === m
                    ? "bg-slate-900 text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {m === "login" ? "Sign in" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Password {mode === "register" && <span className="font-normal text-slate-400">(min 8 chars)</span>}
              </label>
              <input
                type="password"
                required
                minLength={mode === "register" ? 8 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 py-3 text-sm font-semibold text-slate-900 shadow hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {loading
                ? mode === "login" ? "Signing in…" : "Creating account…"
                : mode === "login" ? "Sign in →" : "Create account →"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            {mode === "login" ? "No account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
              className="text-slate-700 font-medium hover:underline"
            >
              {mode === "login" ? "Register free" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      <footer className="mt-auto bg-slate-800 text-slate-900 text-center py-6 text-sm">
        © {new Date().getFullYear()} Strategy Business Growth — Powered by Claude AI
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

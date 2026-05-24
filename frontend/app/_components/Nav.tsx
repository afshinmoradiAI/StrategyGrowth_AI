"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { clearSession, getEmail } from "../_lib/auth";
import { SettingsDialog } from "./SettingsDialog";
import { UsageBadge } from "./UsageBadge";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/plan", label: "Plan" },
  { href: "/research", label: "Research" },
  { href: "/strategy", label: "Strategy" },
  { href: "/risk", label: "Risk" },
  { href: "/leads", label: "Leads" },
  { href: "/content", label: "Content" },
  { href: "/crm", label: "CRM" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Nav({ active }: { active: string }) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setEmail(getEmail());
  }, []);

  function logout() {
    clearSession();
    router.push("/login");
  }

  return (
    <>
      <nav className="bg-slate-800 shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 shadow">
              <span className="text-sm font-bold text-slate-900">SBG</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
              Strategy Business Growth
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-1 flex-wrap">
            {LINKS.map((l) => {
              const isActive = l.href === active;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-amber-500 text-slate-900"
                      : "text-slate-200 hover:bg-slate-700 hover:text-amber-400"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}

            {email ? (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-600">
                <UsageBadge />
                <button
                  onClick={() => setSettingsOpen(true)}
                  title="Settings"
                  className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-amber-400 transition-colors"
                >
                  ⚙
                </button>
                <span className="text-xs text-slate-400 hidden lg:block">
                  {email}
                </span>
                <button
                  onClick={logout}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-amber-400 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400 transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

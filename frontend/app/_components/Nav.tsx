"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { clearSession, getEmail } from "../_lib/auth";
import { SettingsDialog } from "./SettingsDialog";
import { UsageBadge } from "./UsageBadge";

const LINKS = [
  { href: "/", label: "Plan" },
  { href: "/research", label: "Research" },
  { href: "/strategy", label: "Strategy" },
  { href: "/risk", label: "Risk" },
  { href: "/leads", label: "Leads" },
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
      <nav className="bg-blue-800 shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <span className="text-sm font-bold text-white">SG</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              StrategyGrowth AI
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
                      ? "bg-white text-blue-800"
                      : "text-blue-100 hover:bg-blue-700 hover:text-white"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}

            {email ? (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-blue-600">
                <UsageBadge />
                <button
                  onClick={() => setSettingsOpen(true)}
                  title="Settings"
                  className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-blue-100 hover:bg-blue-700 hover:text-white transition-colors"
                >
                  ⚙
                </button>
                <span className="text-xs text-blue-200 hidden lg:block">
                  {email}
                </span>
                <button
                  onClick={logout}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-blue-100 hover:bg-blue-700 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50 transition-colors"
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

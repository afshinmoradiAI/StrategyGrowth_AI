import Link from "next/link";

const LINKS = [
  { href: "/", label: "Full Plan" },
  { href: "/research", label: "Research (Free)" },
  { href: "/strategy", label: "Strategy" },
  { href: "/risk", label: "Risk Register" },
];

export function Nav({ active }: { active: string }) {
  return (
    <nav className="bg-blue-800 shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <span className="text-sm font-bold text-white">SG</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            StrategyGrowth AI
          </span>
        </Link>
        <div className="ml-auto flex gap-1">
          {LINKS.map((l) => {
            const isActive = l.href === active;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white text-blue-800"
                    : "text-blue-100 hover:bg-blue-700 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

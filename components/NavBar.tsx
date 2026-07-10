"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/shows", label: "Shows", icon: "📺" },
  { href: "/movies", label: "Movies", icon: "🎬" },
  { href: "/discover", label: "Discover", icon: "🧭" },
  { href: "/profile", label: "Profile", icon: "◐" },
];

export default function NavBar() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname?.startsWith("/auth")) return null;

  return (
    <nav
      className="fixed z-40 flex border-surface2 bg-surface/95 backdrop-blur
                 bottom-0 left-0 right-0 flex-row justify-around border-t py-2
                 md:bottom-0 md:top-0 md:right-auto md:w-20 md:flex-col md:justify-start md:gap-6 md:border-r md:border-t-0 md:py-8"
    >
      <div className="hidden md:block md:mb-4 md:text-center">
        <span className="font-display text-2xl text-glow">◈</span>
      </div>
      {TABS.map((tab) => {
        const active = pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`focus-ring flex flex-col items-center gap-1 rounded-card px-3 py-1 text-xs transition-colors
              ${active ? "text-glow" : "text-muted hover:text-ink"}`}
          >
            <span className="text-lg" aria-hidden>
              {tab.icon}
            </span>
            <span className="font-body">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

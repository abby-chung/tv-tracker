"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, CircleUserRound, Sparkles } from "lucide-react";

const TABS = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/profile", label: "Profile", icon: CircleUserRound },
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
      <div className="hidden md:mb-4 md:flex md:justify-center">
        <Sparkles className="h-6 w-6 text-primary" strokeWidth={2} />
      </div>
      {TABS.map((tab) => {
        const active = pathname?.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`focus-ring flex flex-col items-center gap-1 rounded-md px-3 py-1.5 text-body-sm transition-colors
              ${active ? "text-primary" : "text-muted hover:text-ink"}`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors
                ${active ? "bg-primarySoft" : ""}`}
              aria-hidden
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="font-body">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

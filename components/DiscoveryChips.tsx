import Link from "next/link";
import type { ReactNode } from "react";

/* Quick discovery shortcuts row (home + feeds). Horizontal scroll on mobile. */

const CHIPS: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: "/search",
    label: "Search",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
        <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/new",
    label: "New",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M12 3l2 6 6 .5-4.5 4 1.4 6L12 16l-4.9 3.5 1.4-6L4 9.5 10 9z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/near",
    label: "Near me",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    href: "/following",
    label: "Following",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M12 20s-7-4.3-7-9.3A4.2 4.2 0 0112 7a4.2 4.2 0 017 3.7c0 5-7 9.3-7 9.3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/communities",
    label: "Communities",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="10" r="2.2" stroke="currentColor" strokeWidth="2" />
        <path d="M4 18c0-2.5 2.2-3.8 5-3.8S14 15.5 14 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function DiscoveryChips() {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {CHIPS.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          className="ds-press inline-flex shrink-0 items-center gap-1.5 rounded-pill border-2 border-ink bg-paper-pure px-3.5 py-2 text-sm font-semibold"
        >
          {c.icon}
          {c.label}
        </Link>
      ))}
    </div>
  );
}

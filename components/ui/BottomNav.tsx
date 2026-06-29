import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type Item = { href: string; label: string; icon: ReactNode };

const ICON = {
  browse: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  community: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="2" />
      <circle cx="17" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="2" />
      <path d="M3.5 19c0-3 2.6-4.6 5.5-4.6S14.5 16 14.5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M15.5 14.6c2.6 0 5 1.3 5 4.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  inbox: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M5 5h14a2 2 0 012 2v8a2 2 0 01-2 2H9l-4 3v-3a2 2 0 01-2-2V7a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  orders: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  wallet: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M16 12h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

const ITEMS: Item[] = [
  { href: "/marketplace", label: "Browse", icon: ICON.browse },
  { href: "/communities", label: "Community", icon: ICON.community },
  { href: "/messages", label: "Inbox", icon: ICON.inbox },
  { href: "/wallet", label: "Wallet", icon: ICON.wallet },
  { href: "/profile", label: "You", icon: ICON.profile },
];

/**
 * Bottom nav — mobile only (hidden md+). Dark pill bar; the active item expands
 * into a yellow pill that SMART-ANIMATES between tabs (shared layoutId), with
 * the label fading in. Matches the reference, premium feel.
 */
export function BottomNav({ active }: { active: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4 md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between gap-1 rounded-pill border-2 border-ink bg-ink p-2">
        {ITEMS.map((it) => {
          const isActive = active === it.href || active.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-label={it.label}
              aria-current={isActive ? "page" : undefined}
              className={[
                "ds-press relative flex h-12 items-center justify-center gap-2 rounded-pill px-3",
                isActive ? "text-ink" : "text-text-on-dark",
              ].join(" ")}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-active-pill"
                  className="absolute inset-0 rounded-pill bg-yellow"
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">{it.icon}</span>
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
                  className="ds-display relative z-10 overflow-hidden whitespace-nowrap pr-1 text-sm leading-none"
                >
                  {it.label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

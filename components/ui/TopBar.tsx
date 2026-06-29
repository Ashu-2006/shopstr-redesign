import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";

/**
 * Discovery top bar: logo + promoted search + cart. Sticky. Mobile-primary;
 * search is full-width on mobile, inline on desktop. Pure presentation —
 * search value/handlers passed in by the page.
 */
export function TopBar({
  search,
  onSearch,
  searchHref,
  autoFocus = false,
  cartCount = 0,
  right,
}: {
  search?: string;
  onSearch?: (v: string) => void;
  /** When set, the search field is a Link to this href (home → /search). */
  searchHref?: string;
  autoFocus?: boolean;
  cartCount?: number;
  right?: ReactNode;
}) {
  const icon = (
    <span
      aria-hidden
      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
  return (
    <header className="sticky top-0 z-30 bg-paper border-b-2 border-ink">
      <div className="mx-auto flex max-w-[1240px] items-center gap-3 px-4 py-3 md:gap-5">
        <Link href="/marketplace" aria-label="Shopstr home" className="shrink-0">
          <Logo />
        </Link>

        {searchHref ? (
          <>
            <span className="flex-1" />
            <Link
              href={searchHref}
              aria-label="Search"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper-pure ds-press"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Link>
          </>
        ) : (
          <label className="relative flex-1">
            <span className="sr-only">Search listings</span>
            {icon}
            <input
              type="search"
              value={search}
              autoFocus={autoFocus}
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder="Search by name, price, or seller"
              className="w-full rounded-pill border-2 border-ink bg-paper-pure py-2.5 pl-11 pr-4 text-sm font-medium outline-none placeholder:text-text-subtle focus:border-purple"
            />
          </label>
        )}

        {right}

        <Link
          href="/cart"
          aria-label={`Cart, ${cartCount} items`}
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-yellow ds-press"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M5 7h14l-1.4 11H6.4L5 7z" stroke="#121212" strokeWidth="2" strokeLinejoin="round" />
            <path d="M8.5 7a3.5 3.5 0 017 0" stroke="#121212" strokeWidth="2" />
          </svg>
          {cartCount > 0 && (
            <motion.span
              key={cartCount}
              initial={{ scale: 0.4 }}
              animate={{ scale: [1.35, 1] }}
              transition={{ duration: 0.35, ease: [0.34, 1.36, 0.64, 1] }}
              className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 font-mono text-[0.62rem] font-bold text-text-on-dark tabular-nums"
            >
              {cartCount}
            </motion.span>
          )}
        </Link>
      </div>
    </header>
  );
}

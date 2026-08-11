import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MagnifyingGlass, ShoppingBag } from "@phosphor-icons/react";
import { Logo } from "@/components/ui/Logo";
import { bump } from "@/lib/motion";

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
      <MagnifyingGlass size={18} />
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
            {/* Desktop has the room: show the field itself (it links to /search).
                Mobile keeps the icon-only progressive disclosure. */}
            <Link href={searchHref} className="relative hidden flex-1 md:block">
              {icon}
              <span className="block w-full rounded-pill border-2 border-ink bg-paper-pure py-2.5 pl-11 pr-4 text-sm font-medium text-text-subtle">
                Search by name, price, or seller
              </span>
            </Link>
            <span className="flex-1 md:hidden" />
            <Link
              href={searchHref}
              aria-label="Search"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper-pure ds-press md:hidden"
            >
              <MagnifyingGlass size={19} />
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
          <ShoppingBag size={20} color="#121212" />
          {cartCount > 0 && (
            <motion.span
              key={cartCount}
              initial={{ scale: 0.4 }}
              animate={bump}
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

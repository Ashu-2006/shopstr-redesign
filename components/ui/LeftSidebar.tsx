import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  House,
  MagnifyingGlass,
  UsersThree,
  ChatCircle,
  Package,
  Wallet,
  Plus,
  User,
  Gear,
} from "@phosphor-icons/react";
import { Sticker } from "@/components/ui/Sticker";

type Item = { href: string; label: string; icon: ReactNode };

const ICON = {
  browse: <House size={22} />,
  search: <MagnifyingGlass size={22} />,
  community: <UsersThree size={22} />,
  inbox: <ChatCircle size={22} />,
  orders: <Package size={22} />,
  wallet: <Wallet size={22} />,
  sell: <Plus size={22} />,
  profile: <User size={22} />,
  settings: <Gear size={22} />,
};

const MAIN: Item[] = [
  { href: "/marketplace", label: "Browse", icon: ICON.browse },
  { href: "/search", label: "Search", icon: ICON.search },
  { href: "/communities", label: "Community", icon: ICON.community },
  { href: "/messages", label: "Inbox", icon: ICON.inbox },
  { href: "/orders", label: "Orders", icon: ICON.orders },
  { href: "/wallet", label: "Wallet", icon: ICON.wallet },
];

const FOOT: Item[] = [
  { href: "/profile", label: "You", icon: ICON.profile },
  { href: "/settings", label: "Settings", icon: ICON.settings },
];

function isActive(path: string, href: string) {
  if (href === "/marketplace") return path === "/marketplace" || path === "/";
  return path === href || path.startsWith(href + "/");
}

function Row({ item, active }: { item: Item; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      title={item.label}
      className={[
        "ds-press flex h-12 items-center rounded-lg transition-colors duration-150",
        active ? "bg-ink text-text-on-dark" : "text-ink hover:bg-paper-2",
      ].join(" ")}
    >
      <span className="grid w-14 shrink-0 place-items-center">{item.icon}</span>
      <span className="whitespace-nowrap pr-4 text-sm font-semibold opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none">
        {item.label}
      </span>
    </Link>
  );
}

/**
 * Desktop-only left navigation rail. Icon-only collapsed (5rem) by default;
 * expands to icons + labels (16rem) on hover as an overlay drawer, so the page
 * content (inset by the collapsed width in _app) never reflows. Hidden below md,
 * where the mobile BottomNav takes over. Pure presentation apart from reading the
 * current route for the active state.
 */
export function LeftSidebar() {
  const router = useRouter();
  const path = router.asPath.split(/[?#]/)[0];

  return (
    <aside
      className="group fixed inset-y-0 left-0 z-40 hidden w-20 flex-col overflow-hidden border-r-2 border-ink bg-paper transition-[width] duration-300 ease-out hover:w-64 motion-reduce:transition-none md:flex"
    >
      {/* Brand — sparkle mark always visible; wordmark reveals on hover */}
      <Link
        href="/marketplace"
        aria-label="Shopstr home"
        className="flex h-16 shrink-0 items-center border-b-2 border-ink"
      >
        <span className="grid w-14 shrink-0 place-items-center">
          <Sticker name="shape-sparkle-4pt" className="h-6 w-6" />
        </span>
        <span className="ds-display whitespace-nowrap pr-4 text-xl leading-none opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none">
          shopstr
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {MAIN.map((it) => (
          <Row key={it.href} item={it} active={isActive(path, it.href)} />
        ))}

        {/* Sell — purple primary-accent CTA */}
        <Link
          href="/sell/new"
          aria-label="Sell an item"
          title="Sell"
          className="ds-press mt-2 flex h-12 items-center rounded-lg bg-purple text-on-purple transition-colors duration-150 hover:bg-purple-press"
        >
          <span className="grid w-14 shrink-0 place-items-center">{ICON.sell}</span>
          <span className="ds-display whitespace-nowrap pr-4 text-sm leading-none opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none">
            Sell
          </span>
        </Link>

        <div className="mt-auto flex flex-col gap-1">
          <div className="mx-3 my-2 border-t-2 border-ink/10" />
          {FOOT.map((it) => (
            <Row key={it.href} item={it} active={isActive(path, it.href)} />
          ))}
        </div>
      </nav>
    </aside>
  );
}

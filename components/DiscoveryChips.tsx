import Link from "next/link";
import type { ReactNode } from "react";
import { MagnifyingGlass, Sparkle, MapPin, Heart, UsersThree } from "@phosphor-icons/react";

/* Quick discovery shortcuts row (home + feeds). Horizontal scroll on mobile. */

const CHIPS: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: "/search",
    label: "Search",
    icon: <MagnifyingGlass size={15} />,
  },
  {
    href: "/new",
    label: "New",
    icon: <Sparkle size={15} />,
  },
  {
    href: "/near",
    label: "Near me",
    icon: <MapPin size={15} />,
  },
  {
    href: "/following",
    label: "Following",
    icon: <Heart size={15} />,
  },
  {
    href: "/communities",
    label: "Communities",
    icon: <UsersThree size={15} />,
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

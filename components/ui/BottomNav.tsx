import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { House, UsersThree, ChatCircle, Wallet, User } from "@phosphor-icons/react";

type Item = { href: string; label: string; icon: ReactNode };

const ICON = {
  browse: <House size={22} />,
  community: <UsersThree size={22} />,
  inbox: <ChatCircle size={22} />,
  wallet: <Wallet size={22} />,
  profile: <User size={22} />,
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

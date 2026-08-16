import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "@/data/hooks";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import {
  User,
  CurrencyBtc,
  SlidersHorizontal,
  Lightning,
  Key,
  SignOut,
  CaretRight,
  type Icon,
} from "@phosphor-icons/react";

/* Settings index. Structured like upstream: one Account group plus Log out.
   Saved addresses and Relays are deliberately NOT top-level rows: they live
   inside Preferences, where upstream keeps them (and where they belong, since
   both are lists rather than screens).

   Every row here goes somewhere real. A row with no destination is a lie. */

type Item = {
  icon: Icon;
  title: string;
  sub: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
};

export default function Settings() {
  const router = useRouter();
  const { profile, wallet, relays, mints, addresses } = useSession();

  const items: Item[] = [
    {
      icon: User,
      title: "Profile & identity",
      sub: `@${profile.handle}${profile.nip05 ? ` · ${profile.nip05}` : ""}`,
      href: "/settings/profile",
    },
    {
      icon: CurrencyBtc,
      title: "Payouts",
      sub: "Where sats land after a sale",
      href: "/wallet/payout",
    },
    {
      // The sub-label counts what's actually configured, so the row reports
      // real state instead of a static description.
      icon: SlidersHorizontal,
      title: "Preferences",
      sub: `${relays.length} relays · ${mints.length} mints · ${addresses.length} ${addresses.length === 1 ? "address" : "addresses"}`,
      href: "/settings/preferences",
    },
    {
      icon: Lightning,
      title: "Nostr Wallet Connect",
      sub: wallet?.type === "nwc" ? `Connected · ${wallet.walletName}` : "Not connected",
      href: "/settings/wallet-connect",
    },
    {
      icon: Key,
      title: "Keys & backup",
      sub: "Export your nsec",
      href: "/settings/keys",
    },
    {
      icon: SignOut,
      title: "Sign out",
      sub: "End this session",
      danger: true,
      onClick: () => router.push("/marketplace"),
    },
  ];

  return (
    <>
      <Head><title>Settings · Shopstr</title></Head>
      <SheetHeader title="Settings" backTo="/profile" contentMax="max-w-[760px]" />
      <main className="mx-auto max-w-[760px] px-4 pb-28 pt-3 md:pb-12">
        <div className="flex flex-col gap-2.5">
          {items.map((it) => {
            const Glyph = it.icon;
            const inner = (
              <>
                <span className={`shrink-0 ${it.danger ? "text-red" : ""}`}><Glyph size={20} /></span>
                <span className="min-w-0 flex-1 leading-snug">
                  <span className={`block ${it.danger ? "text-red" : ""}`}>{it.title}</span>
                  <span className="mt-0.5 block truncate font-mono text-[0.62rem] uppercase tracking-[0.06em] text-text-muted">
                    {it.sub}
                  </span>
                </span>
                <CaretRight size={16} className="shrink-0 text-text-subtle" />
              </>
            );
            const cls =
              "ds-press flex items-center gap-3 rounded-lg border-2 border-ink bg-paper-pure p-3.5 font-bold transition-colors duration-(--ds-dur-instant) hover:bg-paper-2";
            return it.href ? (
              <Link key={it.title} href={it.href} className={cls}>{inner}</Link>
            ) : (
              <button key={it.title} onClick={it.onClick} className={`${cls} text-left`}>{inner}</button>
            );
          })}
        </div>
      </main>
      <BottomNav active="/profile" />
    </>
  );
}

import Head from "next/head";
import Link from "next/link";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";

type Item = { icon: string; title: string; sub?: string; href?: string; danger?: boolean };

const ITEMS: Item[] = [
  { icon: "👤", title: "Profile & identity", sub: "name, avatar, nip-05", href: "/shop/ekko" },
  { icon: "💸", title: "Payouts", sub: "where sats land after a sale", href: "/wallet/payout" },
  { icon: "📍", title: "Saved addresses", sub: "shipping details" },
  { icon: "📡", title: "Relays", sub: "NIP-65 outbox" },
  { icon: "⚡", title: "Nostr Wallet Connect", sub: "external wallet" },
  { icon: "🎚", title: "Preferences", sub: "theme · content filters" },
  { icon: "🔑", title: "Keys & backup", sub: "export nsec" },
  { icon: "🚪", title: "Sign out", danger: true, href: "/marketplace" },
];

export default function Settings() {
  return (
    <>
      <Head><title>Settings · Shopstr</title></Head>
      <SheetHeader title="Settings" backTo="/profile" />
      <main className="mx-auto max-w-[760px] px-4 pb-28 pt-3 md:pb-12">
        <div className="flex flex-col gap-2.5">
          {ITEMS.map((it) => {
            const inner = (
              <>
                <span className="text-lg">{it.icon}</span>
                <span>
                  <span className={it.danger ? "text-red" : ""}>{it.title}</span>
                  {it.sub && <span className="block font-mono text-[0.62rem] uppercase tracking-[0.06em] text-text-muted">{it.sub}</span>}
                </span>
                <span className="ml-auto text-text-subtle">→</span>
              </>
            );
            const cls = "ds-press flex items-center gap-3 rounded-lg border-2 border-ink bg-paper-pure p-3.5 font-bold";
            return it.href ? (
              <Link key={it.title} href={it.href} className={cls}>{inner}</Link>
            ) : (
              <div key={it.title} className={cls + " cursor-pointer"}>{inner}</div>
            );
          })}
        </div>
      </main>
      <BottomNav active="/profile" />
    </>
  );
}

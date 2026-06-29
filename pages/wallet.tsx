import Head from "next/head";
import Link from "next/link";
import { useTxns, useClaimable, useSession } from "@/data/hooks";
import { groupInt } from "@/lib/format";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Sticker } from "@/components/ui/Sticker";

export default function Wallet() {
  const { data: txns } = useTxns();
  const { data: claim } = useClaimable();
  const { walletBalance } = useSession();

  return (
    <>
      <Head><title>Wallet · Shopstr</title></Head>
      <SheetHeader title="Wallet" backTo="/marketplace" />
      <main className="mx-auto max-w-[760px] px-4 pb-28 pt-4 md:pb-12">
        {claim && (
          <Link href="/wallet/claim" className="ds-press mb-3 flex items-center gap-3 rounded-lg border-2 border-ink bg-green p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink font-mono text-text-on-dark">↓</span>
            <div className="min-w-0 flex-1">
              <div className="font-bold">New sale from @{claim.fromHandle}</div>
              <div className="font-mono text-[0.8rem] tabular-nums">{groupInt(claim.amount)} sats ready to claim</div>
            </div>
            <span className="rounded-pill bg-ink px-3 py-1.5 text-sm font-bold text-text-on-dark">Claim</span>
          </Link>
        )}

        <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-ink p-6 text-text-on-dark">
          <Sticker name="shape-sunstar-yellow" className="absolute right-3.5 top-3.5 h-14 w-14" />
          <div className="font-mono text-[0.66rem] uppercase tracking-[0.1em] text-[#bdbcb4]">Spendable balance</div>
          <div className="mt-1.5 font-mono text-5xl font-bold leading-none tabular-nums">
            {groupInt(walletBalance)} <span className="text-base text-[#bdbcb4]">sats</span>
          </div>
          <div className="mt-4 flex gap-2.5">
            <Link href="/wallet/receive" className="ds-press inline-flex flex-1 items-center justify-center rounded-pill border-2 border-ink bg-paper-pure py-3 font-bold text-ink">Receive</Link>
            <Link href="/wallet/send" className="ds-press inline-flex flex-1 items-center justify-center rounded-pill border-2 border-purple bg-purple py-3 font-bold text-on-purple">Send</Link>
          </div>
        </div>

        <div className="mb-3 mt-6 flex items-baseline justify-between">
          <h2 className="ds-display text-xl">Activity</h2>
          <span className="font-mono text-xs text-text-subtle">NIP-60 · Cashu</span>
        </div>
        {txns.map((t, i) => (
          <div key={i} className="flex items-center gap-3 border-b-2 border-ink py-3">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-mono ${t.dir === "out" ? "bg-pink" : "bg-green"}`}>
              {t.dir === "out" ? "↑" : "↓"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-bold">{t.title}</div>
              <div className="font-mono text-[0.66rem] text-text-subtle">{t.sub}</div>
            </div>
            <span className={`font-mono font-bold tabular-nums ${t.dir === "out" ? "text-ink" : "text-green"}`}>
              {t.amount > 0 ? "+" : ""}{groupInt(t.amount)}
            </span>
          </div>
        ))}
      </main>
      <BottomNav active="/wallet" />
    </>
  );
}

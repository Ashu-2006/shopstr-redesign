import Head from "next/head";
import Link from "next/link";
import { useListings, useClaimable } from "@/data/hooks";
import { groupInt } from "@/lib/format";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Sticker } from "@/components/ui/Sticker";
import { SectionTitle } from "@/components/ui/Section";
import { RecRow } from "@/components/RecRow";

export default function Claim() {
  const { data: claim } = useClaimable();
  const { data: listings } = useListings();
  const amount = claim?.amount ?? 45000;
  const recs = listings.filter((l) => l.price <= amount).slice(0, 3);

  return (
    <>
      <Head><title>Sale claimed · Shopstr</title></Head>
      <SheetHeader title="Sale claimed" backTo="/wallet" />
      <main className="mx-auto max-w-[760px] px-4 pb-28 pt-4 md:pb-12">
        <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-green p-6 text-center text-ink">
          <Sticker name="shape-sparkle-4pt" className="absolute left-4 top-3.5 h-12 w-12" />
          <Sticker name="shape-daisy-yellow" className="absolute bottom-3.5 right-4 h-12 w-12" />
          <div className="font-mono text-[2.6rem] font-bold leading-none tabular-nums">+{groupInt(amount)}</div>
          <div className="mt-1.5 font-mono text-[0.66rem] uppercase tracking-[0.1em]">sats added to your Shopstr wallet</div>
        </div>

        <SectionTitle note={`Under ${groupInt(amount)} sats`}>Spend it here</SectionTitle>
        <p className="-mt-1 mb-3 text-text-muted">Three things you can buy with this, right now — keep the sats circulating.</p>
        <div className="flex flex-col gap-2.5">
          {recs.map((p) => <RecRow key={p.id} product={p} />)}
        </div>

        <Link href="/marketplace" className="ds-press mt-4 flex w-full items-center justify-center rounded-pill border-2 border-ink bg-paper-pure py-3.5 font-bold">
          Or just browse the market
        </Link>
        <Link href="/wallet/payout" className="ds-press mt-2.5 flex w-full items-center justify-center gap-2 rounded-pill border-2 border-purple bg-paper py-3.5 font-bold text-purple">
          ⚙ Change where sats go after a sale
        </Link>
      </main>
      <BottomNav active="/wallet" />
    </>
  );
}

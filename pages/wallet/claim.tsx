import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useListings, useClaimable, useCartStore, useSession, CLAIMABLE_ID } from "@/data/hooks";
import { groupInt } from "@/lib/format";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Sticker } from "@/components/ui/Sticker";
import { SectionTitle } from "@/components/ui/Section";
import { LineItem } from "@/components/LineItem";
import { RowSkeleton } from "@/components/skeletons";
import { Gear } from "@phosphor-icons/react";

export default function Claim() {
  const router = useRouter();
  const cart = useCartStore();
  const { data: claim } = useClaimable();
  const { data: listings, isLoading } = useListings();
  const { claim: sweep } = useSession();

  /* Landing here IS the claim, so sweep the payout into the ledger on mount.
     The amount is snapshotted first: `claim` goes null the moment it's swept
     (that's what stops it being claimed twice), and the success screen still
     needs the figure it just credited. */
  const [amount] = useState(() => claim?.amount ?? 45000);
  const [fromHandle] = useState(() => claim?.fromHandle ?? "bagelmaker");
  const swept = useRef(false);
  useEffect(() => {
    if (swept.current) return;
    swept.current = true;
    sweep(CLAIMABLE_ID, amount, fromHandle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recs = listings.filter((l) => l.price <= amount).slice(0, 3);
  // One-tap Buy on a recommendation: straight into checkout.
  const buyNow = (id: string) => {
    cart.add(id, 1);
    router.push("/checkout");
  };

  return (
    <>
      <Head><title>Sale claimed · Shopstr</title></Head>
      <SheetHeader title="Sale claimed" backTo="/wallet" contentMax="max-w-[760px]" />
      <main className="mx-auto max-w-[760px] px-4 pb-28 pt-4 md:pb-12">
        <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-green p-6 text-center text-ink">
          <Sticker name="shape-sparkle-4pt" className="absolute left-4 top-3.5 h-12 w-12" />
          <Sticker name="shape-daisy-yellow" className="absolute bottom-3.5 right-4 h-12 w-12" />
          <div className="font-mono text-[2.6rem] font-bold leading-none tabular-nums">+{groupInt(amount)}</div>
          <div className="mt-1.5 font-mono text-[0.66rem] uppercase tracking-[0.1em]">sats added to your Shopstr wallet</div>
        </div>

        {/* Optional discovery module: hides entirely when there is nothing to
            recommend; the copy never promises items that aren't there. */}
        {(isLoading || recs.length > 0) && (
          <>
            <SectionTitle note={`Under ${groupInt(amount)} sats`}>Spend it here</SectionTitle>
            <p className="-mt-1 mb-3 text-text-muted">Things you can buy with this right now, to keep the sats circulating.</p>
            <div className="flex flex-col gap-2.5">
              {isLoading
                ? Array.from({ length: 3 }, (_, i) => <RowSkeleton key={i} avatarSize={50} />)
                : recs.map((p) => (
                    <LineItem
                      key={p.id}
                      product={p}
                      trailing={
                        <button onClick={() => buyNow(p.id)} className="rounded-pill bg-ink px-3.5 py-2 text-[0.78rem] font-bold text-text-on-dark">
                          Buy
                        </button>
                      }
                    />
                  ))}
            </div>
          </>
        )}

        <Link href="/marketplace" className="ds-press mt-4 flex w-full items-center justify-center rounded-pill border-2 border-ink bg-paper-pure py-3.5 font-bold">
          Or just browse the market
        </Link>
        <Link href="/wallet/payout" className="ds-press mt-2.5 flex w-full items-center justify-center gap-2 rounded-pill border-2 border-purple bg-paper py-3.5 font-bold text-purple">
          <Gear size={18} /> Change where sats go after a sale
        </Link>
      </main>
      <BottomNav active="/wallet" />
    </>
  );
}

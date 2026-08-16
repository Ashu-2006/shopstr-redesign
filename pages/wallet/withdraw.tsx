import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useListings, useCartStore, useSession } from "@/data/hooks";
import { groupInt } from "@/lib/format";
import { OneWayFrame, FlowLead } from "@/components/ui/OneWayFrame";
import { LineItem } from "@/components/LineItem";

export default function Withdraw() {
  const router = useRouter();
  const cart = useCartStore();
  const { data: listings } = useListings();
  const { txns, walletBalance } = useSession();

  /* The debit already happened in /wallet/send (this is the "before you go"
     interstitial on the way out), so read the amount off the ledger's most
     recent melt rather than charging again or hardcoding a figure. */
  const AMOUNT = (() => {
    const melt = txns.find((t) => t.kind === "melt");
    return melt ? Math.abs(melt.amount) : Math.min(45000, walletBalance);
  })();

  const recs = listings.filter((l) => l.price <= AMOUNT).slice(0, 3);
  const [done, setDone] = useState(false);
  // One-tap Buy on a recommendation: straight into checkout.
  const buyNow = (id: string) => {
    cart.add(id, 1);
    router.push("/checkout");
  };

  if (done) {
    // Completion reward: the same stroke-draw check as the paid screen, so every
    // finished flow in the app lands the same way.
    return (
      <>
        <Head><title>Withdrawn · Shopstr</title></Head>
        <OneWayFrame tone="green" step="Withdrawal" closeTo="/wallet" sticker="shape-sunstar-yellow">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="grid h-[92px] w-[92px] place-items-center rounded-full bg-ink">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" className="check-draw">
                <path d="M5 13l4 4L19 7" stroke="#25c26e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="ds-display text-2xl leading-[0.95]">Withdrawn</h3>
            <div className="pop-in rounded-pill border-2 border-ink bg-paper px-4 py-2 font-mono font-bold tabular-nums [animation-delay:300ms]">
              − {groupInt(AMOUNT)} sats
            </div>
            <p className="text-[0.88rem] text-text-muted">On its way over Lightning. Your balance updates when it settles.</p>
            <button onClick={() => router.push("/wallet")} className="ds-press mt-1 w-full rounded-pill border-2 border-ink bg-ink px-6 py-3.5 font-bold text-text-on-dark">
              Back to wallet
            </button>
          </div>
        </OneWayFrame>
      </>
    );
  }

  return (
    <>
      <Head><title>Withdraw · Shopstr</title></Head>
      <OneWayFrame tone="green" step="Before you go" closeTo="/wallet">
        <FlowLead>Withdraw {groupInt(AMOUNT)} sats</FlowLead>
        <h3 className="ds-display mt-2 text-2xl leading-[0.95]">3 things under<br />your balance</h3>
        <p className="mt-2 text-[0.92rem] text-text-muted">
          Spending keeps your sats in the circular economy. These are ready to buy right now, or continue the withdrawal.
        </p>
        <div className="mt-4 flex flex-col gap-2.5">
          {recs.map((p) => (
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
        <button onClick={() => router.push("/marketplace")} className="ds-press mt-4 w-full rounded-pill border-2 border-ink bg-ink px-6 py-3.5 font-bold text-text-on-dark">
          Stay &amp; browse
        </button>
        <button onClick={() => setDone(true)} className="ds-press mt-2 w-full py-2 font-bold text-text-muted underline">
          Continue withdrawal
        </button>
      </OneWayFrame>
    </>
  );
}

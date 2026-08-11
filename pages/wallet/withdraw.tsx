import Head from "next/head";
import { useRouter } from "next/router";
import { useListings } from "@/data/hooks";
import { OneWayFrame, FlowLead } from "@/components/ui/OneWayFrame";
import { RecRow } from "@/components/RecRow";

export default function Withdraw() {
  const router = useRouter();
  const { data: listings } = useListings();
  const recs = listings.filter((l) => l.price <= 45000).slice(0, 3);

  return (
    <>
      <Head><title>Withdraw · Shopstr</title></Head>
      <OneWayFrame tone="green" step="Before you go" closeTo="/wallet">
        <FlowLead>Withdraw 45,000 sats</FlowLead>
        <h3 className="ds-display mt-2 text-2xl leading-[0.95]">3 things under<br />your balance</h3>
        <p className="mt-2 text-[0.92rem] text-text-muted">
          Spending keeps your sats in the circular economy. These are ready to buy right now, or continue the withdrawal.
        </p>
        <div className="mt-4 flex flex-col gap-2.5">
          {recs.map((p) => <RecRow key={p.id} product={p} />)}
        </div>
        <button onClick={() => router.push("/marketplace")} className="ds-press mt-4 w-full rounded-pill border-2 border-ink bg-ink px-6 py-3.5 font-bold text-text-on-dark">
          Stay &amp; browse
        </button>
        <button onClick={() => router.push("/wallet")} className="ds-press mt-2 w-full py-2 font-bold text-text-muted underline">
          Continue withdrawal
        </button>
      </OneWayFrame>
    </>
  );
}

import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "@/data/hooks";
import { OneWayFrame, FlowLead } from "@/components/ui/OneWayFrame";
import { Lightning, ArrowUpRight, type Icon } from "@phosphor-icons/react";

export default function Payout() {
  const router = useRouter();
  const { payout, setPayout } = useSession();

  const Opt = ({ value, icon: IconGlyph, title, sub, rec }: { value: "shopstr" | "lightning"; icon: Icon; title: string; sub: string; rec?: boolean }) => (
    <button
      onClick={() => setPayout(value)}
      className={`ds-press flex items-center gap-3 rounded-lg border-2 border-ink p-3.5 text-left ${payout === value ? "bg-ink text-text-on-dark" : "bg-paper-pure"}`}
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[8px] text-lg ${value === "shopstr" ? "bg-green text-ink" : "border-2 border-current"}`}><IconGlyph size={20} /></span>
      <span>
        <span className="font-bold">
          {title}
          {rec && <span className="ml-2 rounded-pill bg-purple px-2 py-0.5 text-[0.58rem] font-bold text-on-purple align-middle">Recommended</span>}
        </span>
        <br />
        <span className="font-mono text-[0.76rem] opacity-70">{sub}</span>
      </span>
    </button>
  );

  return (
    <>
      <Head><title>Payout · Shopstr</title></Head>
      <OneWayFrame tone="purple" step="Payout" sticker="shape-sunstar-yellow" closeTo="/wallet">
        <FlowLead>Seller setup</FlowLead>
        <h3 className="ds-display mt-2 text-2xl leading-[0.95]">Where do your<br />sats go?</h3>
        <div className="mt-4 flex flex-col gap-2.5">
          <Opt value="shopstr" icon={Lightning} title="Keep them in Shopstr" sub="Land in your in-app wallet. Spend on the market with one tap." rec />
          <Opt value="lightning" icon={ArrowUpRight} title="Send to my Lightning wallet" sub="Auto-melt to an external wallet on every sale." />
        </div>
        <button onClick={() => router.push("/wallet")} className="ds-press mt-4 w-full rounded-pill border-2 border-ink bg-ink px-6 py-3.5 font-bold text-text-on-dark">
          Continue →
        </button>
        <p className="mt-2 text-center font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">You can change this any time in Wallet settings.</p>
      </OneWayFrame>
    </>
  );
}

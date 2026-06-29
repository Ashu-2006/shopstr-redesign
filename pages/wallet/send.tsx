import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "@/data/hooks";
import { groupInt } from "@/lib/format";
import { OneWayFrame, FlowLead } from "@/components/ui/OneWayFrame";

const inputCls = "rounded-md border-2 border-ink bg-paper-pure px-3.5 py-3 text-[0.92rem] outline-none focus:border-purple w-full";

export default function Send() {
  const router = useRouter();
  const { walletBalance } = useSession();
  return (
    <>
      <Head><title>Send sats · Shopstr</title></Head>
      <OneWayFrame tone="purple" step="Send sats" closeTo="/wallet">
        <FlowLead>From your Cashu balance · {groupInt(walletBalance)} sats</FlowLead>
        <h3 className="ds-display mt-2 text-2xl leading-[0.95]">Send</h3>
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">Lightning address or invoice</span>
            <input className={inputCls} placeholder="name@walletofsatoshi.com" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">Amount (sats)</span>
            <input className={`${inputCls} font-mono text-xl font-bold`} defaultValue="45000" />
          </label>
        </div>
        <button onClick={() => router.push("/wallet/withdraw")} className="ds-press mt-4 w-full rounded-pill border-2 border-ink bg-ink px-6 py-3.5 font-bold text-text-on-dark">
          Withdraw to Lightning ↗
        </button>
      </OneWayFrame>
    </>
  );
}

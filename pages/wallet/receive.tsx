import Head from "next/head";
import { useRouter } from "next/router";
import { OneWayFrame, FlowLead } from "@/components/ui/OneWayFrame";

const inputCls = "rounded-md border-2 border-ink bg-paper-pure px-3.5 py-3 text-[0.92rem] outline-none focus:border-purple w-full";

export default function Receive() {
  const router = useRouter();
  return (
    <>
      <Head><title>Receive sats · Shopstr</title></Head>
      <OneWayFrame tone="green" step="Receive sats" closeTo="/wallet">
        <FlowLead>Show this to the sender</FlowLead>
        <h3 className="ds-display mt-2 text-2xl leading-[0.95]">Receive</h3>
        <div
          className="mx-auto mt-4 grid h-[200px] w-[200px] place-items-center rounded-lg border-2 border-ink"
          style={{
            background:
              "conic-gradient(from 0deg,#121212 0 25%,#fff 0 50%,#121212 0 75%,#fff 0),repeating-conic-gradient(#121212 0 12.5%,#fff 0 25%)",
            backgroundSize: "24px 24px",
          }}
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-ink bg-white text-purple">⚡</span>
        </div>
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">Or request an amount</span>
          <input className={inputCls} placeholder="Amount in sats" />
        </label>
        <button onClick={() => router.push("/wallet")} className="ds-press mt-4 w-full rounded-pill border-2 border-ink bg-ink px-6 py-3.5 font-bold text-text-on-dark">
          Copy invoice
        </button>
      </OneWayFrame>
    </>
  );
}

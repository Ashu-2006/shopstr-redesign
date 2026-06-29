import Head from "next/head";
import { useRouter } from "next/router";
import { OneWayFrame, FlowLead } from "@/components/ui/OneWayFrame";

const inputCls = "rounded-md border-2 border-ink bg-paper-pure px-3.5 py-3 text-[0.92rem] outline-none focus:border-purple w-full";

export default function SellNew() {
  const router = useRouter();
  return (
    <>
      <Head><title>New listing · Shopstr</title></Head>
      <OneWayFrame tone="yellow" step="New listing" current={1} total={3} sticker="shape-sunstar-purple" closeTo="/sell/mine">
        <FlowLead>Step 1 of 3 · the basics</FlowLead>
        <h3 className="ds-display mt-2 text-2xl leading-[0.95]">List an<br />item</h3>
        <div className="mt-4 flex flex-col gap-3">
          <div className="cursor-pointer rounded-lg border-2 border-dashed border-ink p-6 text-center">
            <div className="text-2xl">＋</div>
            <div className="mt-1.5 font-mono text-[0.66rem] uppercase tracking-[0.1em] text-text-muted">Add photos</div>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">Title</span>
            <input className={inputCls} placeholder="e.g. Hand-thrown stoneware mug" />
          </label>
          <div className="flex gap-2.5">
            <div className="flex-1">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">Price (sats)</span>
                <input className={inputCls} defaultValue="18000" />
              </label>
            </div>
            <div className="w-32">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">Quantity</span>
                <input className={inputCls} defaultValue="6" />
              </label>
            </div>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">Category</span>
            <input className={inputCls} defaultValue="Ceramics" />
          </label>
        </div>
        <button onClick={() => router.push("/sell/mine")} className="ds-press mt-4 w-full rounded-pill border-2 border-ink bg-ink px-6 py-3.5 font-bold text-text-on-dark">
          Continue →
        </button>
      </OneWayFrame>
    </>
  );
}

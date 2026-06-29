import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useListing, useProfile } from "@/data/hooks";
import { OneWayFrame, FlowLead } from "@/components/ui/OneWayFrame";

export default function ReviewComposer() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const { data: product } = useListing(id);
  const { data: seller } = useProfile(product?.pubkey ?? "");
  const [score, setScore] = useState(5);

  if (!product) return null;

  return (
    <>
      <Head><title>Leave a review · Shopstr</title></Head>
      <OneWayFrame tone="green" step="Leave a review" sticker="shape-daisy-yellow" closeTo={`/orders`}>
        <FlowLead>Your purchase · @{seller?.handle}</FlowLead>
        <h3 className="ds-display mt-2 text-2xl leading-[0.95]">How was<br />it?</h3>

        <div className="mt-4 flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.images[0]} alt="" className="h-12 w-12 rounded-[10px] border-2 border-ink object-cover" />
          <div className="text-[0.9rem] font-bold">{product.title}</div>
        </div>

        <div className="my-3 flex justify-center gap-2 text-4xl">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              onClick={() => setScore(i)}
              aria-label={`${i} stars`}
              className={`ds-press leading-none transition-transform ${i <= score ? "scale-110 text-yellow" : "text-ink/25"}`}
            >
              ★
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">Say more (optional)</span>
          <textarea rows={3} placeholder="Beautifully packed, exactly as described…" className="w-full resize-none rounded-md border-2 border-ink bg-paper-pure px-3.5 py-3 outline-none focus:border-purple" />
        </label>

        <button onClick={() => router.push("/orders")} className="ds-press mt-4 w-full rounded-pill border-2 border-ink bg-ink px-6 py-3.5 font-bold text-text-on-dark">
          Publish review ✦
        </button>
        <p className="mt-2 text-center font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">Signed to your key · published as NIP-85</p>
      </OneWayFrame>
    </>
  );
}

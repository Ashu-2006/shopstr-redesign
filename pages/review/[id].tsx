import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { useListing, useProfile, weightedScore } from "@/data/hooks";
import { REVIEW_DIMENSIONS, type ReviewDimension } from "@/data/types";
import { OneWayFrame, FlowLead } from "@/components/ui/OneWayFrame";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Sparkle, ThumbsUp, ThumbsDown } from "@phosphor-icons/react";

export default function ReviewComposer() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const { data: product, isLoading } = useListing(id);
  const { data: seller } = useProfile(product?.pubkey ?? "");
  // Upstream shape: a mandatory binary thumb (50% of the score) plus optional
  // named dimensions splitting the other 50%. Not a star rating.
  const [thumb, setThumb] = useState<boolean | null>(null);
  const [dimensions, setDimensions] = useState<Partial<Record<ReviewDimension, boolean>>>({});
  const [text, setText] = useState("");

  const toggleDim = (d: ReviewDimension) =>
    setDimensions((prev) => {
      const next = { ...prev };
      // Cycle: unrated -> good -> bad -> unrated. Unrated must stay reachable,
      // since "not rated" is a real state upstream and is NOT the same as bad.
      if (next[d] === undefined) next[d] = true;
      else if (next[d]) next[d] = false;
      else delete next[d];
      return next;
    });

  // Genuinely missing purchase (never during a route transition or load).
  if (router.isReady && id && !isLoading && !product) {
    return (
      <>
        <Head><title>Leave a review · Shopstr</title></Head>
        <main className="mx-auto max-w-[700px] px-4 py-16">
          <EmptyState
            sticker="shape-daisy-yellow"
            headline="Nothing to review"
            body="This purchase moved or never existed."
            cta={
              <Link href="/orders">
                <Button variant="secondary">Back to orders</Button>
              </Link>
            }
          />
        </main>
      </>
    );
  }
  // Loading: keep the flow shell so the frame doesn't pop in after the data.
  if (!product) {
    return (
      <>
        <Head><title>Leave a review · Shopstr</title></Head>
        <OneWayFrame tone="green" step="Leave a review" sticker="shape-daisy-yellow" closeTo={`/orders`}>
          <Skeleton shape="line" w={160} />
          <Skeleton shape="rect" w="60%" h="1.8rem" className="mt-3" />
          <div className="mt-4 flex items-center gap-2.5">
            <Skeleton shape="rect" w={48} h={48} className="!rounded-[8px]" />
            <Skeleton shape="line" w="45%" h="0.9rem" />
          </div>
          <Skeleton shape="rect" w="100%" h={110} className="mt-4" />
        </OneWayFrame>
      </>
    );
  }

  return (
    <>
      <Head><title>Leave a review · Shopstr</title></Head>
      <OneWayFrame tone="green" step="Leave a review" sticker="shape-daisy-yellow" closeTo={`/orders`}>
        <FlowLead>Your purchase · @{seller?.handle}</FlowLead>
        <h3 className="ds-display mt-2 text-2xl leading-[0.95]">How was<br />it?</h3>

        <div className="mt-4 flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.images[0]} alt="" className="h-12 w-12 rounded-[8px] border-2 border-ink object-cover" />
          <div className="text-[0.9rem] font-bold">{product.title}</div>
        </div>

        {/* The thumb is the whole review's backbone: mandatory and worth half
            the score, so it gets the largest hit targets on the screen. */}
        <div className="mt-4">
          <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">
            Would you deal with @{seller?.handle} again?
          </span>
          <div className="mt-2 flex gap-2.5">
            <button
              onClick={() => setThumb(true)}
              aria-pressed={thumb === true}
              className={`ds-press flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-ink py-3.5 font-bold ${
                thumb === true ? "bg-green" : "bg-paper-pure"
              }`}
            >
              <ThumbsUp size={20} weight={thumb === true ? "fill" : "regular"} /> Yes
            </button>
            <button
              onClick={() => setThumb(false)}
              aria-pressed={thumb === false}
              className={`ds-press flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-ink py-3.5 font-bold ${
                thumb === false ? "bg-pink" : "bg-paper-pure"
              }`}
            >
              <ThumbsDown size={20} weight={thumb === false ? "fill" : "regular"} /> No
            </button>
          </div>
        </div>

        {/* Dimensions are optional and tri-state. Tapping cycles good -> bad ->
            not rated, because silence on a dimension is not a complaint. */}
        <div className="mt-4">
          <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">
            What stood out? (optional)
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {REVIEW_DIMENSIONS.map((d) => {
              const v = dimensions[d];
              return (
                <button
                  key={d}
                  onClick={() => toggleDim(d)}
                  aria-pressed={v !== undefined}
                  className={`ds-press inline-flex items-center gap-1.5 rounded-pill border-2 border-ink px-3.5 py-2 text-sm font-semibold capitalize ${
                    v === undefined ? "bg-paper-pure" : v ? "bg-green" : "bg-pink"
                  }`}
                >
                  {v === undefined ? null : v ? <ThumbsUp size={13} weight="fill" /> : <ThumbsDown size={13} weight="fill" />}
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* Show the resulting score so the weighting is never a mystery. */}
        {thumb !== null && (
          <div className="mt-4 flex items-baseline justify-between rounded-lg border-2 border-ink bg-paper-2 px-3.5 py-2.5">
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">
              This review scores
            </span>
            <span className="font-mono text-lg font-bold tabular-nums">
              {Math.round(
                weightedScore({
                  id: "draft",
                  authorPubkey: "me",
                  productId: product.id,
                  thumb,
                  dimensions,
                  createdAt: 0,
                }) * 100
              )}
              %
            </span>
          </div>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">Say more (optional)</span>
          <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Beautifully packed, exactly as described…" className="w-full resize-none rounded-md border-2 border-ink bg-paper-pure px-3.5 py-3 outline-none focus:border-purple" />
        </label>

        <button
          onClick={() => router.push("/orders")}
          disabled={thumb === null}
          className="ds-press mt-4 inline-flex w-full items-center justify-center gap-2 rounded-pill border-2 border-ink bg-ink px-6 py-3.5 font-bold text-text-on-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          Publish review <Sparkle size={18} />
        </button>
        {thumb === null && (
          <p className="mt-2 text-center font-mono text-[0.66rem] text-text-muted">
            Answer the question above to publish.
          </p>
        )}
        <p className="mt-2 text-center font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">Signed to your key · published as a kind 31555 review</p>
      </OneWayFrame>
    </>
  );
}

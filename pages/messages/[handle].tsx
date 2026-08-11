import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useListing, useChats, profileByHandle } from "@/data/hooks";
import { MOCK_LISTINGS } from "@/data/mock/listings";
import { groupInt } from "@/lib/format";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { InboxList } from "@/components/InboxList";
import { Star, Check, PaperPlaneTilt } from "@phosphor-icons/react";

// Fixed reference time so relative stamps are stable (no SSR/CSR mismatch).
const NOW = 1717372800000;

function QuotedCard({ pid }: { pid: string }) {
  const product = MOCK_LISTINGS.find((l) => l.id === pid);
  if (!product) return null;
  return (
    <div className="mb-2 flex items-center gap-2.5 rounded-[10px] bg-black/10 p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.images[0]} alt="" className="h-9 w-9 rounded-[7px] object-cover" />
      <div className="min-w-0">
        <div className="truncate text-[0.8rem] font-bold">{product.title}</div>
        <div className="font-mono text-[0.72rem] tabular-nums">{groupInt(product.price)} sats</div>
      </div>
    </div>
  );
}

export default function Thread() {
  const router = useRouter();
  const handle = typeof router.query.handle === "string" ? router.query.handle : "";
  const pid = typeof router.query.pid === "string" ? router.query.pid : "";
  const fromListing = router.query.from === "listing";

  const seller = profileByHandle(handle);
  const { data: chats } = useChats();
  // The product this thread is about: explicit pid, else the seller's first listing.
  const fallbackPid = MOCK_LISTINGS.find((l) => l.pubkey === seller?.pubkey)?.id ?? "lst_007";
  const { data: product } = useListing(pid || fallbackPid);

  const [sent, setSent] = useState<string[]>([]);
  const [draft, setDraft] = useState(fromListing && product ? `Hi! Is the ${product.title} still available?` : "");
  const [snoozed, setSnoozed] = useState(false);
  const [problem, setProblem] = useState(false);

  const send = () => {
    if (!draft.trim()) return;
    setSent((s) => [...s, draft.trim()]);
    setDraft("");
  };

  const showReviewPrompt = !fromListing && handle === "ekko";

  return (
    <>
      <Head><title>@{handle} · Shopstr</title></Head>
      <div className="flex min-h-screen flex-col">
        <SheetHeader
          title={`@${handle}`}
          backTo="/messages"
          contentMax="max-w-[760px] lg:max-w-[1200px]"
          right={<button aria-label="More" className="ds-press grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-paper-pure">⋯</button>}
        />

        <div className="mx-auto w-full max-w-[760px] flex-1 lg:grid lg:max-w-[1200px] lg:grid-cols-[400px_1fr] lg:items-start lg:gap-8 lg:px-6 lg:pb-10">
          {/* Desktop split view: inbox rail stays visible next to the open thread. */}
          <aside className="hidden lg:block">
            <InboxList chats={chats} now={NOW} activeHandle={handle} />
          </aside>

          <section className="flex min-h-0 flex-col lg:h-[calc(100dvh-140px)] lg:overflow-hidden lg:rounded-2xl lg:border-2 lg:border-ink lg:bg-paper">
        <div className="w-full flex-1 overflow-y-auto px-4 pb-4">
          {/* .stagger gives every bubble the ds-rise entrance (rises from the
              composer edge). Seed history staggers 55ms/bubble on mount; a
              newly sent message mounts with no delay, so it rises immediately. */}
          <div className="stagger flex flex-col gap-2.5 py-4">
            {fromListing ? (
              <>
                <div className="max-w-[80%] self-end rounded-lg rounded-br-[5px] bg-purple p-3 text-on-purple">
                  {product && <QuotedCard pid={product.id} />}
                  Hi! Is this still available?
                </div>
                <div style={{ animationDelay: "55ms" }} className="text-center font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">
                  Draft ready. Your question is grounded in the listing.
                </div>
              </>
            ) : (
              <>
                <div className="max-w-[80%] self-start rounded-lg rounded-bl-[5px] border-2 border-ink bg-paper-pure p-3">
                  {product && <QuotedCard pid={product.id} />}
                  Hey! Thanks for your interest
                </div>
                <div style={{ animationDelay: "55ms" }} className="max-w-[80%] self-end rounded-lg rounded-br-[5px] bg-purple p-3 text-on-purple">
                  Hi! Is this still available? Could you combine shipping if I take two?
                </div>
                <div style={{ animationDelay: "110ms" }} className="max-w-[80%] self-start rounded-lg rounded-bl-[5px] border-2 border-ink bg-paper-pure p-3">
                  Yes, I can ship two together to save on postage. Want me to send an updated invoice?
                </div>
                <div style={{ animationDelay: "165ms" }} className="max-w-[80%] self-end rounded-lg rounded-br-[5px] bg-purple p-3 text-on-purple">Perfect, yes please.</div>
              </>
            )}

            {sent.map((m, i) => (
              <div key={i} className="max-w-[80%] self-end rounded-lg rounded-br-[5px] bg-purple p-3 text-on-purple">{m}</div>
            ))}

            {/* PDF Issue 1: 7-day post-purchase review prompt with three branches. */}
            {showReviewPrompt && !problem && (
              <>
                <div className="text-center font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">Today</div>
                <div className={`flex flex-col gap-2.5 rounded-lg border-2 border-ink bg-paper-pure p-3.5 ${snoozed ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-2 font-bold">
                    <span className="grid h-7 w-7 place-items-center rounded-[9px] border-2 border-ink bg-yellow"><Star weight="fill" size={16} /></span>
                    Did your order arrive?
                  </div>
                  <p className="text-[0.84rem] text-text-muted">
                    It&apos;s been 7 days since @{handle} shipped your {product?.title}. A quick review helps the next buyer trust them.
                  </p>
                  {!snoozed && (
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/review/${product?.id ?? "lst_007"}`} className="ds-press inline-flex items-center gap-1.5 rounded-pill border-2 border-ink bg-ink px-3.5 py-2 text-sm font-semibold text-text-on-dark"><Check size={16} /> Yes, leave a review</Link>
                      <button onClick={() => setSnoozed(true)} className="ds-press rounded-pill border-2 border-ink bg-paper-pure px-3.5 py-2 text-sm font-semibold">Not yet</button>
                      <button onClick={() => setProblem(true)} className="ds-press rounded-pill border-2 border-ink bg-pink px-3.5 py-2 text-sm font-semibold">There&apos;s a problem</button>
                    </div>
                  )}
                  {snoozed && <div className="font-mono text-[0.72rem] text-text-subtle">Snoozed for 3 days.</div>}
                </div>
              </>
            )}
            {problem && (
              <div className="rounded-lg border-2 border-red bg-pink-soft p-3.5 text-[0.86rem]">
                <b>Dispute opened with @{handle}.</b> When escrow ships, refunds resolve here.
              </div>
            )}
          </div>
        </div>

        {/* Sticky to the viewport on mobile; a static footer of the thread panel at lg+. */}
        <div className="sticky bottom-0 flex gap-2.5 border-t-2 border-ink bg-paper px-4 py-3 lg:static">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={`Message @${handle}…`}
            className="flex-1 rounded-pill border-2 border-ink bg-paper-pure px-4 py-2.5 outline-none focus:border-purple"
          />
          <button onClick={send} aria-label="Send" className="ds-press grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-purple bg-purple text-white">
            <PaperPlaneTilt size={18} />
          </button>
        </div>
          </section>
        </div>
      </div>
    </>
  );
}

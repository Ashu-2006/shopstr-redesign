import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useListing,
  useChats,
  useThreadFor,
  useThreadMessages,
  useReviews,
  useOrders,
  profileByHandle,
  averageRating,
} from "@/data/hooks";
import type { ChatMessage } from "@/data/types";
import { groupInt, formatRating, timeAgo } from "@/lib/format";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Sticker } from "@/components/ui/Sticker";
import { InboxList } from "@/components/InboxList";
import {
  Star,
  Check,
  PaperPlaneTilt,
  SealCheck,
  Storefront,
  DotsThree,
  ImageSquare,
  LockKey,
  Lightning,
} from "@phosphor-icons/react";

// Fixed reference time so relative stamps are stable (no SSR/CSR mismatch).
const NOW = 1717372800000;
const NOW_S = 1717372800;

/** "Today" / "Yesterday" / "3d ago" bucket for day dividers. */
function dayLabel(at: number): string {
  const d = Math.floor((NOW_S - at) / 86400);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}

function QuotedCard({ pid, onDark }: { pid: string; onDark: boolean }) {
  const { data: product } = useListing(pid);
  if (!product) return null;
  return (
    <Link
      href={`/listing/${product.id}`}
      className={`mb-2 flex items-center gap-2.5 rounded-[8px] p-2 ${onDark ? "bg-black/15" : "bg-paper-2"}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.images[0]} alt="" className="h-10 w-10 rounded-[6px] border-2 border-ink object-cover" />
      <div className="min-w-0">
        <div className="truncate text-[0.8rem] font-bold">{product.title}</div>
        <div className="font-mono text-[0.72rem] tabular-nums">{groupInt(product.price)} sats</div>
      </div>
    </Link>
  );
}

type SentMsg = { text?: string; img?: string };
type RenderMsg = ChatMessage & { img?: string };

export default function Thread() {
  const router = useRouter();
  const handle = typeof router.query.handle === "string" ? router.query.handle : "";
  const pid = typeof router.query.pid === "string" ? router.query.pid : "";
  const fromListing = router.query.from === "listing";

  const seller = profileByHandle(handle);
  const { data: chats } = useChats();
  const { data: thread } = useThreadFor(handle);
  const { data: history, isLoading } = useThreadMessages(handle);
  const { data: reviews } = useReviews(seller?.pubkey ?? "");
  const { data: orders } = useOrders();

  // The listing this thread is about: the explicit pid wins, else the thread's
  // own item. No guessing from the seller's catalog: a wrong pin is worse than none.
  const { data: product } = useListing(pid || thread?.productId || "");

  // PDF Issue 1: post-purchase review prompt, driven by real order state.
  const order = orders.find(
    (o) => o.sellerHandle === handle && (o.status === "shipped" || o.status === "delivered")
  );
  const { data: orderProduct } = useListing(order?.productId ?? "");

  const selling = thread?.kind === "selling";
  const avg = averageRating(reviews.scores);

  const [sent, setSent] = useState<SentMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [snoozed, setSnoozed] = useState(false);
  const [problem, setProblem] = useState(false);
  const [spark, setSpark] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // From a listing, arrive with the question drafted (not fake-sent) and focused.
  useEffect(() => {
    if (fromListing && product) {
      setDraft(`Hi! Is the ${product.title} still available?`);
      inputRef.current?.focus();
    }
  }, [fromListing, product]);

  // Keep the newest message in view. Re-run after paint and after images land,
  // since late layout growth would otherwise leave the tail cut off.
  const messageCount = history.length + sent.length;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const toBottom = () => {
      el.scrollTop = el.scrollHeight;
    };
    toBottom();
    const t1 = setTimeout(toBottom, 150);
    const t2 = setTimeout(toBottom, 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [messageCount, isLoading]);

  const send = () => {
    if (!draft.trim()) return;
    setSent((s) => [...s, { text: draft.trim() }]);
    setDraft("");
    setSpark((n) => n + 1);
  };

  const attach = (file: File | undefined) => {
    if (!file) return;
    setSent((s) => [...s, { img: URL.createObjectURL(file) }]);
    setSpark((n) => n + 1);
  };

  // Quick replies follow the role and the moment.
  const chips = useMemo(() => {
    const offer =
      product && !selling ? `Would you take ${groupInt(Math.round((product.price * 0.9) / 500) * 500)} sats?` : null;
    if (selling) return ["Yes, still available", "I can ship tomorrow", "Sending an invoice now"];
    if (fromListing || history.length === 0)
      return ["Is this available?", "Do you combine shipping?", ...(offer ? [offer] : [])];
    return ["Sounds good!", "Can you send an invoice?", ...(offer ? [offer] : [])];
  }, [selling, fromListing, history.length, product]);

  const showReviewPrompt = !fromListing && !problem && !!order && !!orderProduct;

  // History + locally sent messages, as one render list.
  const messages: RenderMsg[] = useMemo(
    () => [
      ...history,
      ...sent.map((m, i) => ({ id: `sent_${i}`, from: "me" as const, text: m.text ?? "", img: m.img, at: NOW_S })),
    ],
    [history, sent]
  );

  if (router.isReady && handle && !seller) {
    return (
      <>
        <SheetHeader title="Messages" backTo="/messages" />
        <main className="mx-auto max-w-[700px] px-4 py-16">
          <EmptyState
            headline="No such chat"
            body="This handle doesn't match anyone you've talked to."
            cta={
              <Link href="/messages" className="font-bold text-purple underline">
                Back to your inbox
              </Link>
            }
          />
        </main>
      </>
    );
  }

  return (
    <>
      <Head><title>{handle ? `@${handle}` : "Chat"} · Shopstr</title></Head>
      <div className="flex h-dvh flex-col">
        <SheetHeader title="Messages" backTo="/messages" contentMax="max-w-[760px] lg:max-w-[1200px]" />

        <div className="mx-auto min-h-0 w-full max-w-[760px] flex-1 lg:grid lg:max-w-[1200px] lg:grid-cols-[400px_1fr] lg:gap-8 lg:px-6 lg:pb-8">
          {/* Desktop split view: inbox rail stays visible next to the open thread. */}
          <aside className="hidden min-h-0 lg:flex lg:flex-col lg:overflow-y-auto lg:pt-2">
            <InboxList chats={chats} now={NOW} activeHandle={handle} />
          </aside>

          <section className="flex h-full min-h-0 flex-col lg:overflow-hidden lg:rounded-2xl lg:border-2 lg:border-ink lg:bg-paper-pure">
            {/* Identity strip: who you're talking to, and why you can trust them. */}
            <header className="flex items-center gap-3 border-b-2 border-ink bg-paper-pure px-4 py-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={seller?.picture} alt="" className="h-10 w-10 rounded-full border-2 border-ink object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 font-bold">
                  @{handle}
                  {seller?.nip05 && <SealCheck size={15} weight="fill" className="text-green" />}
                </div>
                {reviews.scores.length > 0 && (
                  <div className="flex items-center gap-1 font-mono text-[0.68rem] text-text-muted">
                    <Star weight="fill" size={11} />
                    <span className="tabular-nums font-bold">{formatRating(avg)}</span>
                    <span>· {reviews.scores.length} reviews</span>
                  </div>
                )}
              </div>
              <Link
                href={`/shop/${handle}`}
                className="ds-press inline-flex shrink-0 items-center gap-1.5 rounded-pill border-2 border-ink bg-paper-pure px-3 py-1.5 text-xs font-bold"
              >
                <Storefront size={14} /> Shop
              </Link>
              <button aria-label="More" className="ds-press grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper-pure">
                <DotsThree size={18} weight="bold" />
              </button>
            </header>

            {/* Pinned listing: the thing this conversation is about. */}
            {product && (
              <div className="flex items-center gap-3 border-b-2 border-ink bg-yellow-soft px-4 py-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.images[0]} alt="" className="h-11 w-11 shrink-0 rounded-lg border-2 border-ink object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{product.title}</div>
                  <div className="flex items-center gap-2 font-mono text-xs tabular-nums">
                    {groupInt(product.price)} sats
                    {product.quantity != null && product.quantity > 0 && (
                      <span className="rounded-pill bg-green px-1.5 py-px text-[0.58rem] font-bold uppercase tracking-[0.06em]">
                        Available
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/listing/${product.id}`}
                  className="ds-press inline-flex shrink-0 items-center gap-1.5 rounded-pill border-2 border-ink bg-ink px-3.5 py-2 text-xs font-bold text-text-on-dark"
                >
                  {selling ? "View listing" : (<><Lightning size={14} /> Buy</>)}
                </Link>
              </div>
            )}

            {/* Messages. */}
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-paper px-4">
              <div className="flex min-h-full flex-col justify-end py-4">
                <div className="mb-3 flex items-center justify-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-text-subtle">
                  <LockKey size={12} /> End-to-end encrypted · Nostr DM
                </div>

                {isLoading ? (
                  <div className="flex flex-col gap-2.5" aria-hidden="true">
                    <Skeleton className="h-16 w-[70%] rounded-2xl" />
                    <Skeleton className="h-10 w-[55%] self-end rounded-2xl" />
                    <Skeleton className="h-10 w-[60%] rounded-2xl" />
                  </div>
                ) : (
                  messages.map((m, i) => {
                    const prev = messages[i - 1];
                    const next = messages[i + 1];
                    const newDay = !prev || dayLabel(prev.at) !== dayLabel(m.at);
                    const firstOfGroup = newDay || !prev || prev.from !== m.from;
                    const lastOfGroup = !next || next.from !== m.from || dayLabel(next.at) !== dayLabel(m.at);
                    const mine = m.from === "me";
                    return (
                      <div key={m.id} className="flex flex-col">
                        {newDay && (
                          <div className="my-3 self-center rounded-pill border-2 border-ink bg-paper-pure px-3 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-[0.12em]">
                            {dayLabel(m.at)}
                          </div>
                        )}
                        <div
                          className={`${firstOfGroup && !newDay ? "mt-3" : "mt-1"} max-w-[80%] rounded-2xl p-3 lg:max-w-[440px] ${
                            mine
                              ? `self-end bg-purple text-on-purple ${lastOfGroup ? "rounded-br-[5px]" : ""}`
                              : `self-start border-2 border-ink bg-paper-pure ${lastOfGroup ? "rounded-bl-[5px]" : ""}`
                          }`}
                        >
                          {m.productId && <QuotedCard pid={m.productId} onDark={mine} />}
                          {m.img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.img} alt="Attached" className="max-h-[240px] rounded-lg object-cover" />
                          ) : (
                            m.text
                          )}
                        </div>
                        {lastOfGroup && (
                          <span className={`mt-1 font-mono text-[0.58rem] text-text-subtle ${mine ? "self-end" : "self-start"}`}>
                            {m.at >= NOW_S ? "just now" : timeAgo(m.at, NOW)}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}

                {fromListing && sent.length === 0 && (
                  <div className="mt-3 text-center font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">
                    Draft ready. Your question is grounded in the listing.
                  </div>
                )}

                {/* Post-purchase review prompt: a system event, not a bubble. */}
                {showReviewPrompt && (
                  <div className={`mt-4 flex flex-col gap-2.5 self-center w-full max-w-[440px] rounded-xl border-2 border-ink bg-paper-pure p-3.5 ${snoozed ? "opacity-50" : ""}`}>
                    <div className="flex items-center gap-2 font-bold">
                      <span className="grid h-7 w-7 place-items-center rounded-[6px] border-2 border-ink bg-yellow"><Star weight="fill" size={16} /></span>
                      Did your order arrive?
                    </div>
                    <p className="text-[0.84rem] text-text-muted">
                      Your {orderProduct?.title} was marked {order?.status}. A quick review helps the next buyer trust @{handle}.
                    </p>
                    {!snoozed && (
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/review/${order?.productId}`} className="ds-press inline-flex items-center gap-1.5 rounded-pill border-2 border-ink bg-ink px-3.5 py-2 text-sm font-semibold text-text-on-dark"><Check size={16} /> Yes, leave a review</Link>
                        <button onClick={() => setSnoozed(true)} className="ds-press rounded-pill border-2 border-ink bg-paper-pure px-3.5 py-2 text-sm font-semibold">Not yet</button>
                        <button onClick={() => setProblem(true)} className="ds-press rounded-pill border-2 border-ink bg-pink px-3.5 py-2 text-sm font-semibold">There&apos;s a problem</button>
                      </div>
                    )}
                    {snoozed && <div className="font-mono text-[0.72rem] text-text-subtle">Snoozed for 3 days.</div>}
                  </div>
                )}
                {problem && (
                  <div className="mt-4 w-full max-w-[440px] self-center rounded-xl border-2 border-red bg-pink-soft p-3.5 text-[0.86rem]">
                    <b>Dispute opened with @{handle}.</b> When escrow ships, refunds resolve here.
                  </div>
                )}
              </div>
            </div>

            {/* Quick replies. */}
            <div className="flex gap-2 overflow-x-auto border-t-2 border-ink bg-paper-pure px-4 pb-1 pt-2.5">
              {chips.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setDraft(c);
                    inputRef.current?.focus();
                  }}
                  className="ds-press shrink-0 rounded-pill border-2 border-ink bg-paper-2 px-3 py-1.5 text-xs font-semibold"
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Composer. */}
            <div className="bg-paper-pure px-4 pb-3 pt-2">
              <div className="relative flex items-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => attach(e.target.files?.[0])} />
                <button
                  onClick={() => fileRef.current?.click()}
                  aria-label="Attach photo"
                  className="ds-press grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-yellow"
                >
                  <ImageSquare size={18} />
                </button>
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder={`Message @${handle}…`}
                  className="min-w-0 flex-1 rounded-pill border-2 border-ink bg-paper px-4 py-2.5 outline-none focus:border-purple"
                />
                <button onClick={send} aria-label="Send" className="ds-press grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-purple bg-purple text-white">
                  <PaperPlaneTilt size={18} />
                </button>
                <AnimatePresence>
                  {spark > 0 && !reduceMotion && (
                    <motion.span
                      key={spark}
                      initial={{ scale: 0, rotate: -30, opacity: 1 }}
                      animate={{ scale: 1.15, rotate: 10, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", bounce: 0, duration: 0.35 }}
                      onAnimationComplete={() => setTimeout(() => setSpark(0), 450)}
                      className="pointer-events-none absolute -top-8 right-1"
                    >
                      <Sticker name="shape-sparkle-4pt" className="h-8 w-8" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

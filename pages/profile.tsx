import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Sticker } from "@/components/ui/Sticker";
import { ListingCard } from "@/components/ListingCard";
import { Stars } from "@/components/ui/Stars";
import { X, Gear, Star, ArrowUpRight, Lightning, ThumbsUp, ThumbsDown } from "@phosphor-icons/react";
import {
  useProfile,
  useReviews,
  useSellerListings,
  useSession,
  averageRating,
} from "@/data/hooks";
import { groupInt } from "@/lib/format";

const TILTS = [
  { label: "@ekko", href: "/shop/ekko", bg: "bg-pink", rot: -4, ml: 0 },
  { label: "My listings", href: "/sell/mine", bg: "bg-green", rot: 2.5, ml: 24 },
  { label: "Reviews", href: "/orders", bg: "bg-paper-pure", rot: -2, ml: 8 },
  { label: "Wallet", href: "/wallet", bg: "bg-blue", rot: 3, ml: 40 },
  { label: "Settings", href: "/settings", bg: "bg-paper-pure", rot: -3, ml: 14 },
];

export default function Profile() {
  const router = useRouter();
  const { data: me } = useProfile("pk_ekko");
  const { data: reviews } = useReviews("pk_ekko");
  const { data: myListings } = useSellerListings("pk_ekko");
  const { walletBalance } = useSession();

  const avg = averageRating(reviews.reviews);
  // Newest review that actually carries a written note.
  const latest = reviews.reviews.find((r) => r.text);

  return (
    <>
      <Head><title>You · Shopstr</title></Head>
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-yellow">
        <div className="flex items-center justify-between px-5 py-[18px]">
          <button onClick={() => router.push("/marketplace")} aria-label="Close" className="ds-press grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-paper-pure"><X size={20} /></button>
          <span className="font-mono text-[0.78rem] uppercase tracking-[0.2em]">Profile</span>
          <Link href="/settings" aria-label="Settings" className="ds-press grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-paper-pure"><Gear size={20} /></Link>
        </div>

        <Sticker name="shape-starburst" className="spin-slow absolute right-6 top-[62px] z-0 h-20 w-20 lg:hidden" />

        {/* ---- Mobile / tablet: the sticker pill screen ---- */}
        <div className="z-10 mx-auto flex w-full max-w-[600px] flex-1 flex-col items-start gap-4 px-6 pt-4 md:pt-10 lg:hidden">
          {TILTS.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className={`ds-press ds-display rounded-pill border-2 border-ink px-7 py-3.5 text-[1.7rem] ${t.bg}`}
              style={{ transform: `rotate(${t.rot}deg)`, marginLeft: t.ml }}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="z-10 mx-3.5 flex gap-3 rounded-t-2xl border-2 border-b-0 border-ink bg-paper-pure p-4 md:mx-auto md:w-full md:max-w-[600px] lg:hidden">
          <Link href="/marketplace" className="ds-press flex min-h-[118px] flex-1 flex-col justify-between rounded-lg border-2 border-ink bg-pink p-3.5">
            <span className="text-xl"><Star weight="fill" size={20} /></span>
            <span className="font-bold leading-tight">Rate Shopstr</span>
          </Link>
          <Link href="/shop/ekko" className="ds-press flex min-h-[118px] flex-1 flex-col justify-between rounded-lg border-2 border-ink bg-purple p-3.5 text-on-purple">
            <span className="text-xl">↗</span>
            <span className="font-bold leading-tight">Share your shop</span>
          </Link>
        </div>

        {/* ---- Desktop: master-detail. Identity + pill nav left, content right. ---- */}
        <div className="z-10 mx-auto hidden w-full max-w-[1200px] flex-1 grid-cols-[380px_1fr] gap-10 px-6 pb-16 pt-4 lg:grid">
          {/* Left rail: who you are, then where you can go. */}
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border-2 border-ink bg-paper-pure p-5">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={me?.picture} alt="" className="h-20 w-20 rounded-full border-2 border-ink object-cover" />
                <div>
                  <p className="ds-display text-3xl">@{me?.handle}</p>
                  <p className="mt-1 font-mono text-xs text-text-muted">{me?.nip05}</p>
                </div>
              </div>
              <Stars avg={avg} count={reviews.reviews.length} className="mt-4 text-sm" />
              {me?.about && <p className="mt-2 text-sm leading-relaxed text-text-muted">{me.about}</p>}
            </div>

            <div className="flex flex-col items-start gap-4 pl-2 pt-1">
              {TILTS.map((t) => (
                <Link
                  key={t.label}
                  href={t.href}
                  className={`ds-press ds-display rounded-pill border-2 border-ink px-6 py-3 text-[1.45rem] ${t.bg}`}
                  style={{ transform: `rotate(${t.rot}deg)`, marginLeft: t.ml * 0.6 }}
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right pane: the useful stuff, ordered by how often you need it. */}
          <div className="flex flex-col gap-6">
            <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border-2 border-ink bg-ink p-6 text-text-on-dark">
              <div>
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-text-on-dark-muted">Spendable balance</p>
                <p className="mt-2 font-mono text-4xl font-bold leading-none tabular-nums">
                  {groupInt(walletBalance)} <span className="text-sm font-normal text-text-on-dark-muted">sats</span>
                </p>
              </div>
              <Link href="/wallet" className="ds-press inline-flex items-center gap-1.5 rounded-pill bg-paper-pure px-5 py-2.5 text-sm font-bold text-ink">
                <Lightning size={16} /> Open wallet
              </Link>
              <Sticker name="shape-sunstar-purple" className="pointer-events-none absolute -right-5 -top-6 h-20 w-20 opacity-90" />
            </div>

            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="ds-display text-xl">My listings</h2>
                <Link href="/sell/mine" className="font-mono text-xs font-bold text-purple underline">
                  See all {groupInt(myListings.length)} →
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {/* Own listings: no save heart on your own stock */}
                {myListings.slice(0, 3).map((p) => (
                  <ListingCard key={p.id} product={p} density="tile" />
                ))}
              </div>
            </section>

            <div className="grid grid-cols-3 gap-3">
              <Link href="/marketplace" className="ds-press flex min-h-[132px] flex-col justify-between rounded-xl border-2 border-ink bg-pink p-4">
                <Star weight="fill" size={22} />
                <span className="font-bold leading-tight">Rate Shopstr</span>
              </Link>
              <Link href="/shop/ekko" className="ds-press flex min-h-[132px] flex-col justify-between rounded-xl border-2 border-ink bg-purple p-4 text-on-purple">
                <ArrowUpRight size={22} />
                <span className="font-bold leading-tight">Share your shop</span>
              </Link>
              {latest && (
                <div className="flex min-h-[132px] flex-col justify-between rounded-xl border-2 border-ink bg-paper-pure p-4">
                  <p className="line-clamp-3 text-sm text-text-muted">&ldquo;{latest.text}&rdquo;</p>
                  <span className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs font-bold">
                    {latest.thumb ? <ThumbsUp size={14} weight="fill" /> : <ThumbsDown size={14} weight="fill" />}
                    latest review
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Sticker name="shape-daisy-yellow" className="pointer-events-none absolute -bottom-8 left-8 z-0 hidden h-28 w-28 rotate-12 lg:block" />
      </div>
    </>
  );
}

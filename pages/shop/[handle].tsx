import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { tLayout } from "@/lib/motion";
import { profileByHandle, useSellerListings, useReviews, averageRating, useSession } from "@/data/hooks";
import { timeAgo } from "@/lib/format";
import Link from "next/link";
import { BottomNav } from "@/components/ui/BottomNav";
import { ProductCard } from "@/components/ProductCard";
import { Stars } from "@/components/ui/Stars";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductCardSkeleton } from "@/components/skeletons";
import { CaretLeft, Check, Plus, Star } from "@phosphor-icons/react";

const NOW = 1717372800000;

export default function Shop() {
  const router = useRouter();
  const handle = typeof router.query.handle === "string" ? router.query.handle : "";
  const profile = profileByHandle(handle);
  const { data: items, isLoading: itemsLoading } = useSellerListings(profile?.pubkey ?? "");
  const { data: reviews } = useReviews(profile?.pubkey ?? "");
  const { follows, toggleFollow } = useSession();
  const [tab, setTab] = useState<"items" | "reviews" | "policies">("items");

  // profileByHandle is synchronous, so a missing profile with a real handle is
  // genuinely not-found (never a blank screen). An empty handle is just a
  // route transition; render nothing for that one frame.
  if (router.isReady && handle && !profile) {
    return (
      <>
        <Head><title>Shop not found · Shopstr</title></Head>
        <main className="mx-auto max-w-[700px] px-4 py-16">
          <EmptyState
            sticker="shape-daisy-yellow"
            headline="Shop not found"
            body="This seller moved on or never existed."
            cta={
              <Link href="/marketplace">
                <Button variant="secondary">Back to the market</Button>
              </Link>
            }
          />
        </main>
        <BottomNav active="/profile" />
      </>
    );
  }
  if (!profile) return null;
  const avg = averageRating(reviews.scores);
  const following = follows.has(handle);

  return (
    <>
      <Head><title>@{profile.handle} · Shopstr</title></Head>
      <div className="relative border-b-2 border-ink">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} aria-label="Back" className="ds-press grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-paper-pure">
            <CaretLeft size={18} />
          </button>
          <button aria-label="More" className="ds-press grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-ink text-text-on-dark">⋯</button>
        </div>
        <div className="h-[120px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={profile.banner ?? "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900"} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="mx-auto max-w-[1100px] px-4 pb-1">
          <div className="flex items-end gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.picture} alt="" className="-mt-11 h-[74px] w-[74px] rounded-[18px] border-2 border-ink object-cover" />
            <button
              onClick={() => toggleFollow(handle)}
              className={`ds-press mb-1.5 ml-auto rounded-pill border-2 px-5 py-2.5 font-bold ${following ? "border-ink bg-paper-pure text-ink" : "border-ink bg-purple text-on-purple"}`}
            >
              {following ? <span className="inline-flex items-center gap-1.5"><Check size={18} /> Following</span> : <span className="inline-flex items-center gap-1.5"><Plus size={18} /> Follow</span>}
            </button>
          </div>
          <h1 className="ds-display mt-3 text-3xl">@{profile.handle}</h1>
          <div className="mt-1 font-mono text-[0.7rem] text-text-subtle">
            <Stars avg={avg} count={reviews.scores.length} /> · {items[0]?.location ?? "-"}{profile.nip05 ? ` · ${profile.nip05}` : ""}
          </div>
          {profile.about && <p className="mt-2.5 text-text-muted">{profile.about}</p>}
          <div className="mt-3.5 flex gap-2 border-b-2 border-ink">
            {(["items", "reviews", "policies"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative px-1 py-3 font-bold capitalize transition-colors ${tab === t ? "text-ink" : "text-text-muted"}`}
              >
                {t === "items" ? (items.length > 0 ? `Items ${items.length}` : "Items") : t}
                {tab === t && (
                  <motion.span
                    layoutId="shop-tab-underline"
                    className="absolute inset-x-0 -bottom-0.5 h-[3px] rounded-full bg-purple"
                    transition={tLayout}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1100px] px-4 pb-28 pt-4 md:pb-12">
        {tab === "items" &&
          (itemsLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 8 }, (_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              sticker="shape-smiley"
              headline="Shelf's empty"
              body="This seller hasn't listed anything yet. Check back soon."
              cta={
                <Link href="/marketplace">
                  <Button variant="secondary">Back to the market</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ))}
        {tab === "reviews" && (
          <div className="flex flex-col gap-2.5">
            {reviews.scores.length === 0 && (reviews.comments ?? []).length === 0 && (
              <EmptyState
                variant="inline"
                headline="No reviews yet"
                body="Reviews land here after a sale closes."
                className="!py-8"
              />
            )}
            {(reviews.comments ?? []).length === 0 && reviews.scores.length > 0 && (
              <p className="inline-flex items-center gap-1 text-text-muted"><Star weight="fill" size={16} /> {avg.toFixed(1)} from {reviews.scores.length} reviews.</p>
            )}
            {(reviews.comments ?? []).map((c) => (
              <div key={c.id} className="rounded-lg border-2 border-ink bg-paper-pure p-3.5">
                <div className="flex justify-between">
                  <span className="inline-flex items-center gap-1 font-mono text-sm font-bold tabular-nums"><Star weight="fill" size={15} /> {c.score.toFixed(1)}</span>
                  <span className="font-mono text-[0.7rem] text-text-subtle">{timeAgo(c.createdAt, NOW)}</span>
                </div>
                <p className="mt-1.5 text-sm text-text-muted">{c.text}</p>
              </div>
            ))}
          </div>
        )}
        {tab === "policies" && (
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border-2 border-ink bg-ink text-sm">
            {[["Ships from", items[0]?.location ?? "-"], ["Delivery", "3-5 days"], ["Returns", "14 days"], ["Payment", "Lightning · Cashu"]].map(([k, v]) => (
              <div key={k} className="bg-paper-pure p-3">
                <dt className="font-mono text-[0.66rem] uppercase tracking-[0.1em] text-text-subtle">{k}</dt>
                <dd className="mt-0.5 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </main>
      <BottomNav active="/profile" />
    </>
  );
}

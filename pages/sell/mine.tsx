import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  useSellerListings,
  useSoldListings,
  useDrafts,
  usePendingSales,
  useSession,
  productById,
  ME_PUBKEY,
} from "@/data/hooks";
import { groupInt, timeAgo } from "@/lib/format";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListingCard } from "@/components/ListingCard";
import { ListingTileSkeleton, RowSkeleton } from "@/components/skeletons";
import { CaretRight, PencilSimple, Trash } from "@phosphor-icons/react";

/* The seller dashboard. Three lanes (Active / Sold / Drafts), all REAL now:
   Sold reads its own fixture, Drafts reads the composer's autosaves. Above
   the lanes sits the needs-action band — pending sales are the seller's
   actual job; their own stock grid is just inventory. */

const LANES = ["Active", "Sold", "Drafts"] as const;
type Lane = (typeof LANES)[number];

export default function MyListings() {
  const { data: active, isLoading } = useSellerListings(ME_PUBKEY);
  const { data: sold } = useSoldListings();
  const { data: drafts } = useDrafts();
  const { data: pendingSales, isLoading: salesLoading } = usePendingSales();
  const { deleteDraft, unlistListing } = useSession();
  const [lane, setLane] = useState<Lane>("Active");

  const laneCount: Record<Lane, number> = {
    Active: active.length,
    Sold: sold.length,
    Drafts: drafts.length,
  };

  return (
    <>
      <Head><title>My listings · Shopstr</title></Head>
      <SheetHeader title="My listings" backTo="/profile" contentMax="max-w-(--ds-measure)" />
      <main className="mx-auto max-w-(--ds-measure) px-4 pb-28 pt-4 md:pb-12">
        {/* ---- Needs your action: a paid, unconfirmed sale blocks a BUYER,
             so it outranks everything else on this screen. Hidden entirely
             when there is nothing to act on (rails rule). ---- */}
        {(salesLoading || pendingSales.length > 0) && (
          <section className="mb-5">
            {salesLoading ? (
              <RowSkeleton />
            ) : (
              pendingSales.map((o) => {
                const p = productById(o.productId);
                if (!p) return null;
                return (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className="ds-press mb-2 flex items-center gap-3 rounded-xl border-2 border-ink bg-yellow p-3.5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.images[0]} alt="" className="h-12 w-12 shrink-0 rounded-md border-2 border-ink object-cover" />
                    <span className="min-w-0 flex-1 leading-snug">
                      <b>@{o.buyerHandle}</b> paid {groupInt(p.price)} sats for{" "}
                      <b className="line-clamp-1">{p.title}</b>
                      <span className="block font-mono text-[0.66rem]">
                        Confirm the order so they know you have it
                      </span>
                    </span>
                    <CaretRight size={18} weight="bold" className="shrink-0" />
                  </Link>
                );
              })
            )}
          </section>
        )}

        {/* Mobile: full-width thumb CTA. md+: compact button docked beside the
            lane pills (a stretched pill reads as a banner at desktop widths). */}
        <div className="mb-3 flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between">
          <Link
            href="/sell/new"
            className="ds-press flex w-full items-center justify-center gap-2 rounded-pill border-2 border-purple bg-purple py-3.5 font-bold text-on-purple md:order-last md:w-auto md:px-6 md:py-2.5"
          >
            ＋ New listing
          </Link>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {LANES.map((f) => (
              <Pill key={f} interactive active={lane === f} onClick={() => setLane(f)}>
                {laneCount[f] > 0 ? `${f} ${laneCount[f]}` : f}
              </Pill>
            ))}
          </div>
        </div>

        {/* ---- Active ---- */}
        {lane === "Active" &&
          (isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 4 }, (_, i) => (
                <ListingTileSkeleton key={i} />
              ))}
            </div>
          ) : active.length === 0 ? (
            <EmptyState
              sticker="shape-hand"
              headline="Nothing listed yet"
              body="Your shop is ready. Put your first thing up for sats."
              cta={
                <Link href="/sell/new">
                  <Button variant="secondary">Create a listing</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {/* Own stock: no save heart; unlist is the per-tile action. */}
              {active.map((p) => (
                <div key={p.id} className="group/tile relative">
                  <ListingCard product={p} density="tile" />
                  {p.id.startsWith("own_") && (
                    <button
                      onClick={() => unlistListing(p.id)}
                      className="ds-press absolute right-2 top-2 rounded-pill border-2 border-ink bg-paper-pure px-2.5 py-1 font-mono text-[0.62rem] font-bold"
                    >
                      Unlist
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}

        {/* ---- Sold: a record, not a shop. Dimmed tiles, sats banked. ---- */}
        {lane === "Sold" &&
          (sold.length === 0 ? (
            <EmptyState
              variant="inline"
              headline="Nothing sold yet"
              body="When something sells, it moves here."
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {sold.map((p) => (
                <div key={p.id} className="relative">
                  <div className="opacity-60 saturate-50">
                    <ListingCard product={p} density="tile" />
                  </div>
                  <span className="absolute left-2 top-2 rounded-pill border-2 border-ink bg-ink px-2.5 py-1 font-mono text-[0.62rem] font-bold text-text-on-dark">
                    Sold
                  </span>
                </div>
              ))}
            </div>
          ))}

        {/* ---- Drafts: the composer's autosaves. Tap to resume. ---- */}
        {lane === "Drafts" &&
          (drafts.length === 0 ? (
            <EmptyState
              variant="inline"
              headline="No drafts"
              body="Start a listing and it saves here as you type, finished or not."
              cta={
                <Link href="/sell/new">
                  <Button variant="secondary">Start one</Button>
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {drafts.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-lg border-2 border-dashed border-ink/40 bg-paper-pure p-3">
                  {d.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.images[0]} alt="" className="h-12 w-12 shrink-0 rounded-md border-2 border-ink object-cover" />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded-md bg-paper-3" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{d.title.trim() || "Untitled draft"}</div>
                    <div className="font-mono text-[0.66rem] text-text-subtle tabular-nums">
                      {d.price ? `${d.price} sats · ` : ""}edited {timeAgo(d.updatedAt, Date.now())}
                    </div>
                  </div>
                  <Link
                    href={`/sell/new?draft=${d.id}`}
                    aria-label="Resume draft"
                    className="ds-press grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper-pure"
                  >
                    <PencilSimple size={16} />
                  </Link>
                  <button
                    onClick={() => deleteDraft(d.id)}
                    aria-label="Delete draft"
                    className="ds-press grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper-pure text-red"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>
          ))}
      </main>
      <BottomNav active="/profile" />
    </>
  );
}

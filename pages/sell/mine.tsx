import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useSellerListings } from "@/data/hooks";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/skeletons";

// Honest lane empties: Sold and Drafts have no mock data, so they say so
// instead of silently re-showing the Active grid (a fake-empty).
const LANE_EMPTY: Record<string, { headline: string; body: string }> = {
  Sold: { headline: "Nothing sold yet", body: "When something sells, it moves here." },
  Drafts: { headline: "No drafts", body: "Half-finished listings save here until you publish them." },
};

export default function MyListings() {
  const { data: mine, isLoading } = useSellerListings("pk_ekko");
  const [filter, setFilter] = useState("Active");
  return (
    <>
      <Head><title>My listings · Shopstr</title></Head>
      <SheetHeader title="My listings" backTo="/profile" />
      <main className="mx-auto max-w-[1100px] px-4 pb-28 pt-4 md:pb-12">
        {/* Mobile: full-width thumb CTA. md+: compact button docked in the
            header row beside the lane pills (a stretched pill reads as a
            banner, not an action, at desktop widths). */}
        <div className="mb-3 flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between">
          <Link
            href="/sell/new"
            className="ds-press flex w-full items-center justify-center gap-2 rounded-pill border-2 border-purple bg-purple py-3.5 font-bold text-on-purple md:order-last md:w-auto md:px-6 md:py-2.5"
          >
            ＋ New listing
          </Link>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {["Active", "Sold", "Drafts"].map((f) => (
              <Pill key={f} interactive active={filter === f} onClick={() => setFilter(f)}>
                {f === "Active" && mine.length > 0 ? `Active ${mine.length}` : f}
              </Pill>
            ))}
          </div>
        </div>
        {filter !== "Active" ? (
          <EmptyState
            variant="inline"
            headline={LANE_EMPTY[filter].headline}
            body={LANE_EMPTY[filter].body}
          />
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : mine.length === 0 ? (
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
            {mine.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </main>
      <BottomNav active="/profile" />
    </>
  );
}

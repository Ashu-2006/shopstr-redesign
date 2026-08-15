import Head from "next/head";
import type { ProductData } from "@/data/types";
import { useCartStore, useSession, ratingForPubkey } from "@/data/hooks";
import { TopBar } from "@/components/ui/TopBar";
import { BottomNav } from "@/components/ui/BottomNav";
import { SectionTitle } from "@/components/ui/Section";
import { DiscoveryChips } from "@/components/DiscoveryChips";
import { ListingCard } from "@/components/ListingCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeedSkeleton } from "@/components/skeletons";
import type { ReactNode } from "react";

/** Shared discovery feed: top bar + chips + a staggered column of H5 list cards.
   2-up on desktop. Used by /new, /near, /following. Chrome (chips + title)
   paints immediately; the list area is skeleton-first while loading. */
export function FeedScreen({
  title,
  sub,
  listings,
  loading = false,
  empty,
}: {
  title: string;
  sub: string;
  listings: ProductData[];
  loading?: boolean;
  /** Override the default empty treatment (e.g. /following's page empty). */
  empty?: ReactNode;
}) {
  const { count } = useCartStore();
  const { favs, toggleFav } = useSession();
  return (
    <>
      <Head>
        <title>{title} · Shopstr</title>
      </Head>
      <TopBar searchHref="/search" cartCount={count} />
      <main className="mx-auto max-w-(--ds-measure) px-4 pb-28 pt-4 md:pb-12">
        <DiscoveryChips />
        <SectionTitle note={loading ? undefined : sub}>{title}</SectionTitle>
        {loading ? (
          <FeedSkeleton />
        ) : listings.length === 0 ? (
          empty ?? (
            <EmptyState
              variant="inline"
              headline="Nothing here yet"
              body="Try a different filter or come back soon."
            />
          )
        ) : (
          <div className="stagger grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {listings.map((p, i) => (
              <div key={p.id} className="self-start" style={{ animationDelay: `${i * 55}ms` }}>
                <ListingCard
                  product={p}
                  rating={ratingForPubkey(p.pubkey)}
                  fav={favs.has(p.id)}
                  onToggleFav={toggleFav}
                />
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav active="/marketplace" />
    </>
  );
}

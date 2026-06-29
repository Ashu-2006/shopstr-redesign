import Head from "next/head";
import type { ProductData } from "@/data/types";
import { useCartStore, ratingForPubkey } from "@/data/hooks";
import { TopBar } from "@/components/ui/TopBar";
import { BottomNav } from "@/components/ui/BottomNav";
import { SectionTitle } from "@/components/ui/Section";
import { DiscoveryChips } from "@/components/DiscoveryChips";
import { ListCard } from "@/components/cards";

/** Shared discovery feed: top bar + chips + a staggered column of H5 list cards.
   2-up on desktop. Used by /new, /near, /following. */
export function FeedScreen({
  title,
  sub,
  listings,
}: {
  title: string;
  sub: string;
  listings: ProductData[];
}) {
  const { count } = useCartStore();
  return (
    <>
      <Head>
        <title>{title} · Shopstr</title>
      </Head>
      <TopBar searchHref="/search" cartCount={count} />
      <main className="mx-auto max-w-[1240px] px-4 pb-28 pt-4 md:pb-12">
        <DiscoveryChips />
        <SectionTitle note={sub}>{title}</SectionTitle>
        {listings.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-ink/30 px-6 py-16 text-center">
            <p className="ds-display text-2xl">Nothing here yet</p>
            <p className="mt-2 text-text-muted">Try a different filter or come back soon.</p>
          </div>
        ) : (
          <div className="stagger grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {listings.map((p, i) => (
              <div key={p.id} style={{ animationDelay: `${i * 55}ms` }}>
                <ListCard product={p} rating={ratingForPubkey(p.pubkey)} />
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav active="/marketplace" />
    </>
  );
}

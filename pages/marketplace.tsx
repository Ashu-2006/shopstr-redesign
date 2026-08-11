import Head from "next/head";
import Link from "next/link";
import type { ProductData } from "@/data/types";
import { useListings, useTopSellers, useCartStore, ratingForPubkey } from "@/data/hooks";
import { TopBar } from "@/components/ui/TopBar";
import { BottomNav } from "@/components/ui/BottomNav";
import { SectionTitle } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Carousel } from "@/components/Carousel";
import {
  HeroCard,
  ListCard,
  BreakCard,
  NearCard,
  SolidTile,
  SellerCard,
} from "@/components/cards";
import {
  HeroSkeleton,
  ListCardSkeleton,
  NearCardSkeleton,
  SellerCardSkeleton,
} from "@/components/skeletons";

const catHref = (c: string) => `/c/${encodeURIComponent(c)}`;

export default function Marketplace() {
  const { data: listings, isLoading } = useListings();
  const { data: topSellers, isLoading: sellersLoading } = useTopSellers(4);
  const { count } = useCartStore();

  // Editorial picks by id, but never non-null asserted: a missing id degrades
  // to "fewer cards", not a crash on an empty/late dataset.
  const byId = (id: string) => listings.find((l) => l.id === id);
  const pick = (ids: string[]) =>
    ids.map(byId).filter((p): p is ProductData => Boolean(p));
  const featured = pick(["lst_007", "lst_005", "lst_017"]);
  const near = listings.slice(8, 13);
  const feedA = pick(["lst_001", "lst_003"]);
  const breakItem = byId("lst_016");
  const feedB = pick(["lst_011", "lst_013", "lst_009", "lst_002"]);

  const card = (p: ProductData) => (
    <ListCard key={p.id} product={p} rating={ratingForPubkey(p.pubkey)} />
  );

  return (
    <>
      <Head>
        <title>Marketplace · Shopstr</title>
        <meta name="description" content="Browse a circular Bitcoin marketplace. Buy and sell for sats." />
      </Head>

      <TopBar searchHref="/search" cartCount={count} />

      <main className="pb-28 md:pb-12">
        {/* Featured — full-bleed, edge-to-edge, borderless hero carousel.
            Skeleton-first: the hero block holds its exact height while the
            listings family loads, so nothing below it reflows. */}
        {isLoading ? (
          <HeroSkeleton />
        ) : featured.length > 0 ? (
          <Carousel auto fullBleed>
            {featured.map((p, i) => (
              <HeroCard key={p.id} product={p} n={i + 1} />
            ))}
          </Carousel>
        ) : null}

        <div className="mx-auto max-w-[1240px] px-4">
          {/* Browse categories — static chrome, paints immediately */}
          <SectionTitle>Browse categories</SectionTitle>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <SolidTile label="Ceramics" href={catHref("Ceramics")} tone="green" sticker="shape-smiley" />
            <SolidTile label="Zines & print" href={catHref("Art & Print")} tone="pink" sticker="shape-sparkle-4pt" />
            <SolidTile label="Photography" href={catHref("Photography")} tone="blue" sticker="shape-sunstar-purple" />
            <SolidTile label="Electronics" href={catHref("Electronics")} tone="orange" sticker="shape-starburst" />
          </div>

          {/* For you — H5 feed with an H4 break card; 2-col on desktop */}
          <SectionTitle seeAllHref="/new">For you</SectionTitle>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <ListCardSkeleton key={i} />
              ))}
            </div>
          ) : feedA.length + feedB.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {feedA.map(card)}
              {breakItem && (
                <div className="lg:col-span-2">
                  <BreakCard product={breakItem} kicker="Editor's pick" />
                </div>
              )}
              {feedB.map(card)}
            </div>
          ) : (
            <EmptyState
              headline="The market is quiet"
              body="No listings right now. Be the one who puts something up."
              cta={
                <Link href="/sell/new">
                  <Button variant="secondary">List something</Button>
                </Link>
              }
            />
          )}

          {/* Top sellers — optional discovery rail: hides entirely (header
              included) when empty, never renders an empty rail. */}
          {(sellersLoading || topSellers.length > 0) && (
            <>
              <SectionTitle note="This week">Top sellers</SectionTitle>
              {/* Scroll rail on mobile; a grid that fills the container at lg
                  (fixed-width tiles left a dead track at desktop widths). */}
              <div className="lg:hidden">
                <Carousel snap={false}>
                  {sellersLoading
                    ? Array.from({ length: 4 }, (_, i) => <SellerCardSkeleton key={i} />)
                    : topSellers.map((s, i) => (
                        <SellerCard
                          key={s.profile.pubkey}
                          profile={s.profile}
                          avg={s.avg}
                          count={s.count}
                          tone={(["pink", "blue", "green", "yellow"] as const)[i % 4]}
                        />
                      ))}
                </Carousel>
              </div>
              <div className="hidden gap-3 lg:grid lg:grid-cols-4 [&>*]:w-full">
                {sellersLoading
                  ? Array.from({ length: 4 }, (_, i) => <SellerCardSkeleton key={i} />)
                  : topSellers.map((s, i) => (
                      <SellerCard
                        key={s.profile.pubkey}
                        profile={s.profile}
                        avg={s.avg}
                        count={s.count}
                        tone={(["pink", "blue", "green", "yellow"] as const)[i % 4]}
                      />
                    ))}
              </div>
            </>
          )}

          {/* Near you — optional rail, same hide-when-empty rule */}
          {(isLoading || near.length > 0) && (
            <>
              <SectionTitle note="Berlin · 5km">Near you</SectionTitle>
              <Carousel snap={false}>
                {isLoading
                  ? Array.from({ length: 5 }, (_, i) => <NearCardSkeleton key={i} />)
                  : near.map((p) => <NearCard key={p.id} product={p} />)}
              </Carousel>
            </>
          )}
        </div>
      </main>

      <BottomNav active="/marketplace" />
    </>
  );
}

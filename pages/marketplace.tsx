import Head from "next/head";
import Link from "next/link";
import type { ProductData } from "@/data/types";
import {
  useListings,
  useEndlessListings,
  useTopSellers,
  useCartStore,
  useSession,
  ratingForPubkey,
} from "@/data/hooks";
import { TopBar } from "@/components/ui/TopBar";
import { BottomNav } from "@/components/ui/BottomNav";
import { SectionTitle } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Carousel } from "@/components/Carousel";
import { InfiniteSentinel } from "@/components/InfiniteSentinel";
import { SolidTile, SellerCard } from "@/components/cards";
import { ListingCard } from "@/components/ListingCard";
import { FeatureCard } from "@/components/FeatureCard";
import {
  HeroSkeleton,
  ListingTileSkeleton,
  SellerCardSkeleton,
} from "@/components/skeletons";

const catHref = (c: string) => `/c/${encodeURIComponent(c)}`;

export default function Marketplace() {
  const { data: listings, isLoading } = useListings();
  const { data: topSellers, isLoading: sellersLoading } = useTopSellers(4);
  const { count } = useCartStore();
  const { favs, toggleFav } = useSession();
  // The endless tail below the editorial sections: browsing never dead-ends.
  const { items: more, isLoadingMore, loadMore } = useEndlessListings(8);

  // Editorial picks by id, but never non-null asserted: a missing id degrades
  // to "fewer cards", not a crash on an empty/late dataset.
  const byId = (id: string) => listings.find((l) => l.id === id);
  const pick = (ids: string[]) =>
    ids.map(byId).filter((p): p is ProductData => Boolean(p));
  const featured = pick(["lst_007", "lst_005", "lst_017"]);
  const near = listings.slice(8, 13);
  // Four per band so each fills a complete 4-up row: a 2-card band left two
  // dead columns beside it before the break card.
  const feedA = pick(["lst_001", "lst_003", "lst_011", "lst_013"]);
  // Two picks so the desktop band fills its 2-up row.
  const breaks = pick(["lst_016", "lst_008"]);
  const feedB = pick(["lst_009", "lst_002", "lst_004", "lst_006"]);

  /* The tail is "everything ELSE", so drop anything already rendered above it.
     Without this the first rows of the endless feed repeat the cards the user
     just scrolled past. Base ids only: repeat laps carry a __rN suffix and are
     intentionally allowed once the catalogue has been exhausted. */
  const shownAbove = new Set(
    [...featured, ...near, ...feedA, ...breaks, ...feedB].map((p) => p.id)
  );
  const tail = more.filter((p) => !shownAbove.has(p.id));

  /* One card for every product grid in the app: the same tile the search
     results render, so browse and search never disagree about what a listing
     looks like. */
  const card = (p: ProductData) => (
    <ListingCard
      key={p.id}
      product={p}
      density="tile"
      rating={ratingForPubkey(p.pubkey)}
      fav={favs.has(p.id)}
      onToggleFav={toggleFav}
    />
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
              <FeatureCard key={p.id} product={p} format="hero" n={i + 1} />
            ))}
          </Carousel>
        ) : null}

        {/* Fixed measure, generous side gutters. The content column stops
            growing at --ds-measure and the padding steps up with the viewport,
            so the feed keeps a comfortable margin instead of running to the
            window edge on a wide screen. */}
        <div className="mx-auto max-w-(--ds-measure) px-5 sm:px-8 lg:px-12">
          {/* Browse categories — static chrome, paints immediately */}
          <SectionTitle>Browse categories</SectionTitle>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <SolidTile label="Ceramics" href={catHref("Ceramics")} tone="green" sticker="shape-smiley" />
            <SolidTile label="Zines & print" href={catHref("Art & Print")} tone="pink" sticker="shape-sparkle-4pt" />
            <SolidTile label="Photography" href={catHref("Photography")} tone="blue" sticker="shape-sunstar-purple" />
            <SolidTile label="Electronics" href={catHref("Electronics")} tone="orange" sticker="shape-starburst" />
          </div>

          {/* For you: the same tile card and 4-up grid the search results use,
              so a product reads identically wherever it is browsed. */}
          <SectionTitle seeAllHref="/new">For you</SectionTitle>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-10">
              {Array.from({ length: 8 }, (_, i) => (
                <ListingTileSkeleton key={i} />
              ))}
            </div>
          ) : feedA.length + feedB.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-10">
              {feedA.map(card)}
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

          {/* Editor's picks: its own band, not a row hijacked from the feed.
              Two side by side on desktop; a horizontal rail on mobile, where
              two stacked full-width feature cards would push the feed a whole
              screen down. Same Carousel/grid split the Top sellers rail uses. */}
          {(isLoading || breaks.length > 0) && (
            <>
              <SectionTitle note="Curated">Editor's picks</SectionTitle>
              <div className="lg:hidden">
                <Carousel snap={false}>
                  {(isLoading ? [] : breaks).map((p) => (
                    <div key={p.id} className="w-[85vw] max-w-[400px] shrink-0 snap-start">
                      <FeatureCard product={p} format="break" kicker="Editor's pick" />
                    </div>
                  ))}
                </Carousel>
              </div>
              <div className="hidden lg:grid lg:grid-cols-2 lg:gap-5">
                {(isLoading ? [] : breaks).map((p) => (
                  <FeatureCard key={p.id} product={p} format="break" kicker="Editor's pick" />
                ))}
              </div>
            </>
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
                  ? Array.from({ length: 5 }, (_, i) => (
                      <ListingTileSkeleton key={i} className="w-[200px] shrink-0 snap-start" />
                    ))
                  : near.map((p) => (
                      <ListingCard
                        key={p.id}
                        product={p}
                        density="tile"
                        fav={favs.has(p.id)}
                        onToggleFav={toggleFav}
                        className="w-[200px] shrink-0 snap-start"
                      />
                    ))}
              </Carousel>
            </>
          )}

          {/* Everything else: the endless tail. The editorial sections above
              are curated and finite; this is the part that keeps going, so
              reaching the bottom loads more instead of ending the page. */}
          <SectionTitle note="Keeps going">Everything else</SectionTitle>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-10">
            {isLoading
              ? Array.from({ length: 8 }, (_, i) => <ListingTileSkeleton key={i} />)
              : tail.map((p) => (
                  <ListingCard
                    key={p.id}
                    product={p}
                    density="tile"
                    /* Same rating the editorial bands pass: without it the same
                       product shows a star above and none down here. */
                    rating={ratingForPubkey(p.pubkey)}
                    fav={favs.has(p.id)}
                    onToggleFav={toggleFav}
                  />
                ))}
            {/* Appended pages land as skeletons first, so the grid grows into
                real geometry instead of jumping when the data arrives. */}
            {isLoadingMore &&
              Array.from({ length: 4 }, (_, i) => <ListingTileSkeleton key={`more-${i}`} />)}
          </div>

          {!isLoading && (
            <>
              <InfiniteSentinel
                onReach={loadMore}
                disabled={isLoadingMore}
                resetKey={tail.length}
              />
              {/* Keyboard and no-IO fallback: the sentinel is invisible and
                  unreachable by tab, so the same action needs a real control. */}
              <div className="mt-4 flex justify-center">
                <Button
                  variant="secondary"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            </>
          )}
        </div>
      </main>

      <BottomNav active="/marketplace" />
    </>
  );
}

import Head from "next/head";
import { useListings, useTopSellers, useCartStore, ratingForPubkey } from "@/data/hooks";
import { TopBar } from "@/components/ui/TopBar";
import { BottomNav } from "@/components/ui/BottomNav";
import { SectionTitle } from "@/components/ui/Section";
import { Carousel } from "@/components/Carousel";
import {
  HeroCard,
  ListCard,
  BreakCard,
  NearCard,
  SolidTile,
  SellerCard,
} from "@/components/cards";

const catHref = (c: string) => `/c/${encodeURIComponent(c)}`;

export default function Marketplace() {
  const { data: listings } = useListings();
  const { data: topSellers } = useTopSellers(4);
  const { count } = useCartStore();

  const byId = (id: string) => listings.find((l) => l.id === id)!;
  const featured = ["lst_007", "lst_005", "lst_017"].map(byId);
  const near = listings.slice(8, 13);
  const feedA = ["lst_001", "lst_003"].map(byId);
  const breakItem = byId("lst_016");
  const feedB = ["lst_011", "lst_013", "lst_009", "lst_002"].map(byId);

  const card = (id: string) => {
    const p = byId(id);
    return <ListCard key={id} product={p} rating={ratingForPubkey(p.pubkey)} />;
  };

  return (
    <>
      <Head>
        <title>Marketplace · Shopstr</title>
        <meta name="description" content="Browse a circular Bitcoin marketplace. Buy and sell for sats." />
      </Head>

      <TopBar searchHref="/search" cartCount={count} />

      <main className="pb-28 md:pb-12">
        {/* Featured — full-bleed, edge-to-edge, borderless hero carousel */}
        <Carousel auto fullBleed>
          {featured.map((p, i) => (
            <HeroCard key={p.id} product={p} n={i + 1} />
          ))}
        </Carousel>

        <div className="mx-auto max-w-[1240px] px-4">
          {/* Browse categories — directly under featured */}
          <SectionTitle>Browse categories</SectionTitle>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <SolidTile label="Ceramics" href={catHref("Ceramics")} tone="green" sticker="shape-smiley" />
            <SolidTile label="Zines & print" href={catHref("Art & Print")} tone="pink" sticker="shape-sparkle-4pt" />
            <SolidTile label="Photography" href={catHref("Photography")} tone="blue" sticker="shape-sunstar-purple" />
            <SolidTile label="Electronics" href={catHref("Electronics")} tone="orange" sticker="shape-starburst" />
          </div>

          {/* For you — H5 feed with an H4 break card; 2-col on desktop */}
          <SectionTitle seeAllHref="/new">For you</SectionTitle>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {feedA.map((p) => card(p.id))}
            <div className="lg:col-span-2">
              <BreakCard product={breakItem} kicker="Editor's pick" />
            </div>
            {feedB.map((p) => card(p.id))}
          </div>

          {/* Top sellers — pushed below the feed */}
          <SectionTitle note="This week">Top sellers</SectionTitle>
          <Carousel snap={false}>
            {topSellers.map((s, i) => (
              <SellerCard
                key={s.profile.pubkey}
                profile={s.profile}
                avg={s.avg}
                count={s.count}
                tone={(["pink", "blue", "green", "yellow"] as const)[i % 4]}
              />
            ))}
          </Carousel>

          {/* Near you — P1 rail */}
          <SectionTitle note="Berlin · 5km">Near you</SectionTitle>
          <Carousel snap={false}>
            {near.map((p) => (
              <NearCard key={p.id} product={p} />
            ))}
          </Carousel>
        </div>
      </main>

      <BottomNav active="/marketplace" />
    </>
  );
}

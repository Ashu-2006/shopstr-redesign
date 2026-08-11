import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { useCommunity, useCategoryListings, ratingForPubkey } from "@/data/hooks";
import { SectionTitle } from "@/components/ui/Section";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ListCardSkeleton } from "@/components/skeletons";
import { ListCard, BreakCard } from "@/components/cards";
import { Palette, Coffee, Camera, Cube, Sphere, Check, Plus, CaretLeft, type Icon } from "@phosphor-icons/react";

const TONE: Record<string, string> = {
  pink: "bg-pink", yellow: "bg-yellow", green: "bg-green", blue: "bg-blue", purple: "bg-purple",
};

const COMM_ICONS: Record<string, Icon> = { Palette, Coffee, Camera, Cube, Sphere };

export default function CommunityDetail() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const { data: comm, isLoading: commLoading } = useCommunity(slug);
  const { data: listings, isLoading: listingsLoading } = useCategoryListings(comm?.category ?? "");
  const [joined, setJoined] = useState(false);

  // Genuinely missing community: designed not-found, never a blank screen.
  if (router.isReady && slug && !commLoading && !comm) {
    return (
      <>
        <Head><title>Community not found · Shopstr</title></Head>
        <main className="mx-auto max-w-[700px] px-4 py-16">
          <EmptyState
            sticker="shape-daisy-yellow"
            headline="Community not found"
            body="This corner of the market moved or never existed."
            cta={
              <Link href="/communities">
                <Button variant="secondary">All communities</Button>
              </Link>
            }
          />
        </main>
        <BottomNav active="/communities" />
      </>
    );
  }
  // Loading: mirror the header layout (banner well, icon tile, stat tiles).
  if (!comm) {
    return (
      <>
        <Head><title>Community · Shopstr</title></Head>
        <div className="border-b-2 border-ink">
          <Skeleton shape="rect" h={130} w="100%" className="!rounded-none" />
          <div className="mx-auto max-w-[1100px] px-4 pb-3.5">
            <Skeleton shape="rect" w={64} h={64} className="-mt-8 !rounded-[18px] border-2 border-ink" />
            <Skeleton shape="line" w="45%" h="1.4rem" className="mt-3" />
            <Skeleton shape="line" w={220} className="mt-2.5" />
            <div className="mt-3 flex gap-2.5">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex-1 rounded-md border-2 border-ink bg-paper-pure p-2.5">
                  <Skeleton shape="line" w="55%" h="1.05rem" className="mx-auto" />
                  <Skeleton shape="line" w="70%" h="0.56rem" className="mx-auto mt-1.5" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <main className="mx-auto max-w-[1100px] px-4 pb-28 pt-4 md:pb-12" aria-hidden="true">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <ListCardSkeleton key={i} />
            ))}
          </div>
        </main>
        <BottomNav active="/communities" />
      </>
    );
  }
  const CommIcon = COMM_ICONS[comm.emoji];
  const pinned = listings[0];
  const rest = listings.slice(1);

  return (
    <>
      <Head><title>{comm.name} · Shopstr</title></Head>
      <div className="relative border-b-2 border-ink">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} aria-label="Back" className="ds-press grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-paper-pure">
            <CaretLeft size={18} />
          </button>
          <button aria-label="Share" className="ds-press grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-ink text-text-on-dark">↗</button>
        </div>
        <div className="h-[130px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="mx-auto max-w-[1100px] px-4 pb-3.5">
          <div className={`-mt-8 grid h-16 w-16 place-items-center rounded-[18px] border-2 border-ink text-3xl ${TONE[comm.tone]}`}>{CommIcon && <CommIcon size={32} />}</div>
          <h1 className="ds-display mt-2.5 text-2xl">{comm.name}</h1>
          <div className="mt-1.5 font-mono text-[0.66rem] uppercase tracking-[0.06em] text-text-muted">NIP-72 community · curated by @{comm.curator}</div>
          <div className="mt-3 flex gap-2.5">
            {[["Members", comm.members], ["Listings", comm.listings], ["Online", comm.online]].map(([k, v]) => (
              <div key={k} className="flex-1 rounded-md border-2 border-ink bg-paper-pure p-2.5 text-center">
                <div className="font-mono text-[1.05rem] font-bold tabular-nums">{v}</div>
                <div className="font-mono text-[0.56rem] uppercase tracking-[0.06em] text-text-muted">{k}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setJoined((j) => !j)}
            className={`ds-press mt-3 flex w-full items-center justify-center gap-2 rounded-pill border-2 py-3.5 font-bold ${joined ? "border-ink bg-paper-pure text-ink" : "border-purple bg-purple text-on-purple"}`}
          >
            {joined ? <><Check size={18} /> Joined</> : <><Plus size={18} /> Join community</>}
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-[1100px] px-4 pb-28 md:pb-12">
        {pinned && (
          <>
            <SectionTitle note="From moderators">Pinned</SectionTitle>
            <BreakCard product={pinned} kicker="Community pick" />
          </>
        )}
        <SectionTitle note={listings.length > 0 ? `${listings.length} items` : undefined}>
          Latest listings
        </SectionTitle>
        {listingsLoading ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 3 }, (_, i) => (
              <ListCardSkeleton key={i} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            variant="inline"
            headline="Nothing listed yet"
            body="Members' listings in this category will show up here."
          />
        ) : (
          <div className="stagger grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {rest.map((p, i) => (
              <div key={p.id} style={{ animationDelay: `${i * 55}ms` }}>
                <ListCard product={p} rating={ratingForPubkey(p.pubkey)} />
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav active="/communities" />
    </>
  );
}

import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCommunity, useCategoryListings, ratingForPubkey } from "@/data/hooks";
import { SectionTitle } from "@/components/ui/Section";
import { BottomNav } from "@/components/ui/BottomNav";
import { ListCard, BreakCard } from "@/components/cards";

const TONE: Record<string, string> = {
  pink: "bg-pink", yellow: "bg-yellow", green: "bg-green", blue: "bg-blue", purple: "bg-purple",
};

export default function CommunityDetail() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const { data: comm } = useCommunity(slug);
  const { data: listings } = useCategoryListings(comm?.category ?? "");
  const [joined, setJoined] = useState(false);

  if (!comm) return null;
  const list = listings.length >= 2 ? listings : listings.concat([]);
  const pinned = list[0];
  const rest = list.slice(1);

  return (
    <>
      <Head><title>{comm.name} · Shopstr</title></Head>
      <div className="relative border-b-2 border-ink">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} aria-label="Back" className="ds-press grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-paper-pure">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button aria-label="Share" className="ds-press grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-ink text-text-on-dark">↗</button>
        </div>
        <div className="h-[130px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="mx-auto max-w-[1100px] px-4 pb-3.5">
          <div className={`-mt-8 grid h-16 w-16 place-items-center rounded-[18px] border-2 border-ink text-3xl ${TONE[comm.tone]}`}>{comm.emoji}</div>
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
            className={`ds-press mt-3 w-full rounded-pill border-2 py-3.5 font-bold ${joined ? "border-ink bg-paper-pure text-ink" : "border-purple bg-purple text-on-purple"}`}
          >
            {joined ? "✓ Joined" : "+ Join community"}
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
        <SectionTitle note={`${list.length} items`}>Latest listings</SectionTitle>
        <div className="stagger grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {rest.map((p, i) => (
            <div key={p.id} style={{ animationDelay: `${i * 55}ms` }}>
              <ListCard product={p} rating={ratingForPubkey(p.pubkey)} />
            </div>
          ))}
        </div>
      </main>
      <BottomNav active="/communities" />
    </>
  );
}

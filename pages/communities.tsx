import Head from "next/head";
import Link from "next/link";
import {
  useCommunityDigest,
  useSession,
  profileByHandle,
  ME,
} from "@/data/hooks";
import { MOCK_LISTINGS } from "@/data/mock/listings";
import { groupInt } from "@/lib/format";
import { TopBar } from "@/components/ui/TopBar";
import { BottomNav } from "@/components/ui/BottomNav";
import { SectionTitle } from "@/components/ui/Section";
import { Sticker } from "@/components/ui/Sticker";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import {
  Palette, Coffee, Camera, Cube, Sphere, ShieldCheck, MagnifyingGlass,
  ArrowRight, type Icon,
} from "@phosphor-icons/react";

const NOW = 1717372800000;
const TONE: Record<string, string> = {
  pink: "bg-pink", yellow: "bg-yellow", green: "bg-green", blue: "bg-blue", purple: "bg-purple",
};
const COMM_ICONS: Record<string, Icon> = { Palette, Coffee, Camera, Cube, Sphere };

/**
 * /communities is a DIGEST, not a directory. The directory is a once-in-a-
 * lifetime job (find a community to join) and now lives at /communities/discover.
 * This page answers the daily job: what happened in my communities, what am I
 * waiting on, and what needs my moderation.
 */
export default function Communities() {
  const { data: digest, isLoading } = useCommunityDigest();
  const { joinedCommunities } = useSession();

  // Newest approved posts across every joined community.
  const feed = digest
    .flatMap((e) => e.posts.map((p) => ({ post: p, community: e.community })))
    .sort((a, b) => b.post.at - a.post.at)
    .slice(0, 8);

  const myPending = digest.flatMap((e) =>
    e.posts.length >= 0 && e.myPendingCount > 0 ? [e] : []
  );
  const queues = digest.filter((e) => e.queueCount > 0);

  return (
    <>
      <Head><title>Your communities · Shopstr</title></Head>
      <TopBar searchHref="/search" />
      <main className="mx-auto max-w-[1100px] pb-28 pt-2 md:pb-12 lg:grid lg:max-w-[1200px] lg:grid-cols-[1fr_320px] lg:items-start lg:gap-8 lg:px-6">
        <div className="px-4 lg:px-0">
          <div className="pt-4">
            <h1 className="ds-display text-[2.1rem] leading-[0.92] lg:text-[2.6rem]">
              Your peo
              <Sticker name="shape-smiley" className="inline-block h-[0.74em] w-auto align-[-0.08em] spin-slow" />
              le
            </h1>
            <p className="mt-2 max-w-[46ch] text-text-muted">
              Moderated corners of the market. Posts are reviewed before they appear, so the
              signal stays high.
            </p>
          </div>

          {isLoading ? (
            <div className="mt-5 flex flex-col gap-3" aria-hidden="true">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="rounded-xl border-2 border-ink bg-paper-pure p-4">
                  <div className="flex items-center gap-2.5">
                    <Skeleton shape="rect" w={36} h={36} className="!rounded-full" />
                    <Skeleton shape="line" w={120} />
                  </div>
                  <Skeleton shape="line" w="92%" className="mt-3" />
                  <Skeleton shape="line" w="70%" className="mt-2" />
                </div>
              ))}
            </div>
          ) : joinedCommunities.size === 0 ? (
            <div className="mt-5">
              <EmptyState
                sticker="shape-heart-circle"
                headline="You have not joined anywhere yet"
                body="Communities are where you ask before you buy and show what you made. Find one that fits."
                cta={
                  <Link href="/communities/discover">
                    <Button variant="secondary">Find a community</Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <>
              {/* J4: moderation first, because it blocks other people. */}
              {queues.length > 0 && (
                <section className="mt-5">
                  <SectionTitle note="you moderate">Needs your review</SectionTitle>
                  <div className="flex flex-col gap-2.5">
                    {queues.map((e) => {
                      const CIcon = COMM_ICONS[e.community.emoji];
                      return (
                        <Link
                          key={e.community.slug}
                          href={`/communities/${e.community.slug}/queue`}
                          className="ds-press flex items-center gap-3 rounded-xl border-2 border-ink bg-yellow p-3.5"
                        >
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border-2 border-ink bg-paper-pure">
                            {CIcon && <CIcon size={20} />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold leading-tight">{e.community.name}</div>
                            <div className="font-mono text-[0.68rem] tabular-nums">
                              {e.queueCount} post{e.queueCount === 1 ? "" : "s"} awaiting approval
                            </div>
                          </div>
                          <ShieldCheck size={20} weight="bold" className="shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* J3 follow-through: your own requests. */}
              {myPending.length > 0 && (
                <section className="mt-6">
                  <SectionTitle note="only you can see these">Your posts awaiting approval</SectionTitle>
                  <div className="flex flex-col gap-2.5">
                    {myPending.map((e) => (
                      <Link
                        key={e.community.slug}
                        href={`/communities/${e.community.slug}`}
                        className="ds-press flex items-center gap-3 rounded-xl border-2 border-dashed border-text-subtle bg-paper-2 p-3.5"
                      >
                        <Sticker name="badge-new-round" className="h-8 w-8 shrink-0" />
                        <div className="min-w-0 flex-1 text-sm">
                          <b>{e.myPendingCount}</b> waiting in{" "}
                          <b>{e.community.name}</b>
                        </div>
                        <ArrowRight size={16} weight="bold" className="shrink-0" />
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* J1: the reason to return. */}
              <section className="mt-6">
                <SectionTitle note={feed.length > 0 ? "newest first" : undefined}>
                  New in your communities
                </SectionTitle>
                {feed.length === 0 ? (
                  <EmptyState
                    variant="inline"
                    headline="Nothing new yet"
                    body="When members post and a moderator approves it, it shows up here."
                  />
                ) : (
                  <div className="stagger flex flex-col gap-3">
                    {feed.map(({ post, community }, i) => (
                      <div key={post.id} style={{ animationDelay: `${i * 55}ms` }}>
                        <CommunityPostCard
                          post={post}
                          author={profileByHandle(post.authorHandle)}
                          product={MOCK_LISTINGS.find((l) => l.id === post.productId) ?? null}
                          now={NOW}
                          showCommunity
                          communityName={community.name}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* ---- Rail: your memberships + the way into discovery ---- */}
        <aside className="mt-8 px-4 lg:mt-[104px] lg:px-0">
          {digest.length > 0 && (
            <div className="rounded-xl border-2 border-ink bg-paper-pure p-4">
              <h2 className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-text-subtle">
                Joined
              </h2>
              <ul className="mt-2.5 flex flex-col gap-2.5">
                {digest.map((e) => {
                  const CIcon = COMM_ICONS[e.community.emoji];
                  const isMod = e.queueCount > 0 || e.community.curator === ME;
                  return (
                    <li key={e.community.slug}>
                      <Link href={`/communities/${e.community.slug}`} className="flex items-center gap-2.5">
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border-2 border-ink ${TONE[e.community.tone]}`}>
                          {CIcon && <CIcon size={17} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[0.85rem] font-bold leading-tight">
                            {e.community.name}
                          </div>
                          <div className="font-mono text-[0.64rem] tabular-nums text-text-muted">
                            {groupInt(e.community.memberCount)} members
                          </div>
                        </div>
                        {isMod && (
                          <ShieldCheck size={15} weight="bold" className="shrink-0 text-purple" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <Link
            href="/communities/discover"
            className="ds-press mt-4 flex items-center justify-center gap-2 rounded-pill border-2 border-ink bg-paper-pure py-3.5 font-bold"
          >
            <MagnifyingGlass size={17} weight="bold" /> Find more communities
          </Link>
        </aside>
      </main>
      <BottomNav active="/communities" />
    </>
  );
}

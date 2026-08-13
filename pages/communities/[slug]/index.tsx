import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  useCommunity,
  useCommunityPosts,
  usePendingPosts,
  useMyPendingPosts,
  useCategoryListings,
  useSession,
  profileByHandle,
  moderatorsOf,
  useIsModerator,
  nextPostId,
  ME,
} from "@/data/hooks";
import { MOCK_LISTINGS } from "@/data/mock/listings";
import type { PostKind } from "@/data/mock/extras";
import { groupInt } from "@/lib/format";
import { SectionTitle } from "@/components/ui/Section";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import { CommunityComposer } from "@/components/CommunityComposer";
import {
  Palette, Coffee, Camera, Cube, Sphere, Check, Plus, CaretLeft,
  UsersThree, ShieldCheck, type Icon,
} from "@phosphor-icons/react";

const NOW = 1717372800000;

const TONE: Record<string, string> = {
  pink: "bg-pink", yellow: "bg-yellow", green: "bg-green", blue: "bg-blue", purple: "bg-purple",
};
const COMM_ICONS: Record<string, Icon> = { Palette, Coffee, Camera, Cube, Sphere };

export default function CommunityDetail() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const { data: comm, isLoading: commLoading } = useCommunity(slug);
  const { data: posts, isLoading: postsLoading } = useCommunityPosts(slug);
  const { data: pending } = usePendingPosts(slug);
  const myPending = useMyPendingPosts(slug);
  const isModerator = useIsModerator(slug);
  const { joinedCommunities, toggleJoin, submitPost } = useSession();

  // Members' listings: the old "feed" demoted to one clearly labeled module.
  const { data: memberListings } = useCategoryListings(comm?.topics[0] ?? "");

  const joined = joinedCommunities.has(slug);

  const post = (kind: PostKind, text: string) => {
    submitPost({
      // Monotonic id. Deriving it from the text (e.g. its length) collides for
      // two same-length posts, which duplicates React keys and makes the two
      // impossible to moderate independently.
      id: `own_${slug}_${nextPostId()}`,
      communitySlug: slug,
      kind,
      text,
      at: Math.floor(NOW / 1000),
      // Matches the composer's promise: moderators post straight through.
      selfApproved: isModerator,
    });
  };

  if (router.isReady && slug && !commLoading && !comm) {
    return (
      <>
        <Head><title>Community not found · Shopstr</title></Head>
        <main className="mx-auto max-w-[700px] px-4 py-16">
          <EmptyState
            sticker="shape-daisy-yellow"
            headline="Community not found"
            body="This corner of the market moved or never existed."
            cta={<Link href="/communities"><Button variant="secondary">All communities</Button></Link>}
          />
        </main>
        <BottomNav active="/communities" />
      </>
    );
  }

  if (!comm) {
    return (
      <>
        <Head><title>Community · Shopstr</title></Head>
        <div className="border-b-2 border-ink bg-paper-pure">
          <div className="mx-auto max-w-[1100px] px-4 py-4">
            <div className="flex items-center gap-3.5">
              <Skeleton shape="rect" w={56} h={56} className="!rounded-[6px]" />
              <div className="flex-1">
                <Skeleton shape="line" w="45%" h="1.5rem" />
                <Skeleton shape="line" w={190} className="mt-2" />
              </div>
            </div>
          </div>
        </div>
        <main className="mx-auto max-w-[1100px] px-4 pb-28 pt-4 md:pb-12" aria-hidden="true">
          <div className="flex flex-col gap-3">
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
        </main>
        <BottomNav active="/communities" />
      </>
    );
  }

  const CommIcon = COMM_ICONS[comm.emoji];
  const mods = moderatorsOf(comm);
  const postsToday = posts.filter((p) => p.at > Math.floor(NOW / 1000) - 86400).length;

  return (
    <>
      <Head><title>{comm.name} · Shopstr</title></Head>

      {/* ---- Identity bar: compact, factual. No stock banner, no invented stats. ---- */}
      <div className="border-b-2 border-ink bg-paper-pure">
        <div className="mx-auto max-w-[1100px] px-4 py-3.5">
          {/* Identity row. On mobile the actions drop to their own row so the
              display name gets the full measure instead of wrapping to four
              lines against a squeezed flex child. */}
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.push("/communities")}
              aria-label="Back"
              className="ds-press mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper-pure lg:hidden"
            >
              <CaretLeft size={17} weight="bold" />
            </button>
            <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-[6px] border-2 border-ink ${TONE[comm.tone]}`}>
              {CommIcon && <CommIcon size={28} />}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="ds-display text-xl leading-[0.95] sm:text-2xl lg:text-3xl">{comm.name}</h1>
              <div className="mt-1.5 font-mono text-[0.66rem] leading-snug text-text-muted">
                <span className="tabular-nums">{groupInt(comm.memberCount)} members</span>
                {postsToday > 0 && <span className="tabular-nums"> · {postsToday} new today</span>}
                <span className="hidden sm:inline"> · mod @{comm.curator}</span>
              </div>
            </div>
            {/* sm+: actions ride the identity row. */}
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              {isModerator && (
                <Link
                  href={`/communities/${slug}/queue`}
                  className="ds-press inline-flex items-center gap-1.5 rounded-pill border-2 border-ink bg-yellow px-3 py-2 text-xs font-bold"
                >
                  <ShieldCheck size={14} weight="bold" /> Queue
                  {pending.length > 0 && <span className="tabular-nums">({pending.length})</span>}
                </Link>
              )}
              <button
                onClick={() => toggleJoin(slug)}
                aria-pressed={joined}
                className={`ds-press inline-flex items-center gap-1.5 rounded-pill border-2 px-4 py-2 text-sm font-bold ${
                  joined ? "border-ink bg-paper-pure" : "border-purple bg-purple text-on-purple"
                }`}
              >
                {joined ? <><Check size={15} weight="bold" /> Joined</> : <><Plus size={15} weight="bold" /> Join</>}
              </button>
            </div>
          </div>

          {/* Mobile: full-width action row under the identity. */}
          <div className="mt-3 flex gap-2 sm:hidden">
            <button
              onClick={() => toggleJoin(slug)}
              aria-pressed={joined}
              className={`ds-press inline-flex flex-1 items-center justify-center gap-1.5 rounded-pill border-2 py-2.5 text-sm font-bold ${
                joined ? "border-ink bg-paper-pure" : "border-purple bg-purple text-on-purple"
              }`}
            >
              {joined ? <><Check size={15} weight="bold" /> Joined</> : <><Plus size={15} weight="bold" /> Join</>}
            </button>
            {isModerator && (
              <Link
                href={`/communities/${slug}/queue`}
                className="ds-press inline-flex shrink-0 items-center justify-center gap-1.5 rounded-pill border-2 border-ink bg-yellow px-4 py-2.5 text-sm font-bold"
              >
                <ShieldCheck size={15} weight="bold" /> Queue
                {pending.length > 0 && <span className="tabular-nums">({pending.length})</span>}
              </Link>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1100px] px-4 pb-28 pt-4 md:pb-12 lg:grid lg:grid-cols-[1fr_300px] lg:items-start lg:gap-8">
        <div>
          <CommunityComposer
            joined={joined}
            moderators={mods}
            isModerator={isModerator}
            onJoin={() => toggleJoin(slug)}
            onSubmit={post}
          />

          {/* Your own requests waiting on a moderator. The state the old page
              could not express at all. */}
          {myPending.length > 0 && (
            <section className="mt-5">
              <SectionTitle note="only you can see these">Waiting on approval</SectionTitle>
              <div className="flex flex-col gap-3">
                {myPending.map((p) => (
                  <CommunityPostCard
                    key={p.id}
                    post={p}
                    author={profileByHandle(p.authorHandle)}
                    product={MOCK_LISTINGS.find((l) => l.id === p.productId) ?? null}
                    now={NOW}
                  />
                ))}
              </div>
            </section>
          )}

          <SectionTitle note={posts.length > 0 ? `${posts.length} posts` : undefined}>
            The room
          </SectionTitle>
          {postsLoading ? (
            <div className="flex flex-col gap-3" aria-hidden="true">
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
          ) : posts.length === 0 ? (
            <EmptyState
              variant="inline"
              headline="Nothing approved yet"
              body={
                joined
                  ? "Be the first to post. A moderator reviews it, then everyone sees it."
                  : "Join to start the first conversation here."
              }
            />
          ) : (
            <div className="stagger flex flex-col gap-3">
              {posts.map((p, i) => (
                <div key={p.id} style={{ animationDelay: `${i * 55}ms` }}>
                  <CommunityPostCard
                    post={p}
                    author={profileByHandle(p.authorHandle)}
                    product={MOCK_LISTINGS.find((l) => l.id === p.productId) ?? null}
                    now={NOW}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---- Desktop rail: about, moderators, rules, members' listings ---- */}
        <aside className="mt-8 flex flex-col gap-4 lg:mt-0">
          <div className="rounded-xl border-2 border-ink bg-paper-pure p-4">
            <h2 className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-text-subtle">About</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{comm.about}</p>
          </div>

          <div className="rounded-xl border-2 border-ink bg-paper-pure p-4">
            <h2 className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-text-subtle">
              Moderators
            </h2>
            <ul className="mt-2.5 flex flex-col gap-2.5">
              {mods.map((m) => {
                const p = profileByHandle(m);
                return (
                  <li key={m}>
                    <Link href={`/shop/${m}`} className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p?.picture} alt="" className="h-8 w-8 rounded-full border-2 border-ink object-cover" />
                      <span className="text-sm font-bold">@{m}</span>
                      {m === comm.curator && (
                        <span className="rounded-pill bg-paper-2 px-1.5 py-px font-mono text-[0.56rem] uppercase tracking-[0.06em]">
                          owner
                        </span>
                      )}
                      {m === ME && (
                        <span className="rounded-pill bg-yellow px-1.5 py-px font-mono text-[0.56rem] uppercase tracking-[0.06em]">
                          you
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {comm.rules && comm.rules.length > 0 && (
            <div className="rounded-xl border-2 border-ink bg-paper-pure p-4">
              <h2 className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-text-subtle">
                House rules
              </h2>
              <ol className="mt-2 flex flex-col gap-1.5">
                {comm.rules.map((r, i) => (
                  <li key={r} className="flex gap-2 text-sm text-text-muted">
                    <span className="font-mono text-xs font-bold tabular-nums text-purple">{i + 1}</span>
                    {r}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* The category query, honestly labeled: members' listings, one module. */}
          {memberListings.length > 0 && (
            <div className="rounded-xl border-2 border-ink bg-paper-pure p-4">
              <div className="flex items-baseline justify-between">
                <h2 className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-text-subtle">
                  Listings from members
                </h2>
                <Link href={`/c/${comm.topics[0]}`} className="font-mono text-[0.62rem] font-bold text-purple underline">
                  All →
                </Link>
              </div>
              <ul className="mt-2.5 flex flex-col gap-2.5">
                {memberListings.slice(0, 4).map((l) => (
                  <li key={l.id}>
                    <Link href={`/listing/${l.id}`} className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={l.images[0]} alt="" className="h-11 w-11 shrink-0 rounded-md border-2 border-ink object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[0.82rem] font-bold leading-tight">{l.title}</div>
                        <div className="font-mono text-[0.68rem] tabular-nums text-text-muted">
                          {groupInt(l.price)} sats
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link
            href={`/communities/${slug}/members`}
            className="ds-press flex items-center justify-center gap-2 rounded-pill border-2 border-ink bg-paper-pure py-3 text-sm font-bold"
          >
            <UsersThree size={16} weight="bold" /> {groupInt(comm.memberCount)} members
          </Link>
        </aside>
      </main>
      <BottomNav active="/communities" />
    </>
  );
}

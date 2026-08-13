import Head from "next/head";
import Link from "next/link";
import {
  useCommunities,
  useSession,
  profileByHandle,
  moderatorsOf,
} from "@/data/hooks";
import { MOCK_COMMUNITY_POSTS, type Community } from "@/data/mock/extras";
import { groupInt } from "@/lib/format";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Palette, Coffee, Camera, Cube, Sphere, Check, Plus, type Icon } from "@phosphor-icons/react";

const NOW_S = 1717372800;
const TONE: Record<Community["tone"], string> = {
  pink: "bg-pink text-ink",
  yellow: "bg-yellow text-ink",
  green: "bg-green text-ink",
  blue: "bg-blue text-ink",
  purple: "bg-purple text-on-purple",
};
const COMM_ICONS: Record<string, Icon> = { Palette, Coffee, Camera, Cube, Sphere };

/** Approved posts in the last week — the only stat that says "worth joining". */
function weeklyActivity(slug: string): number {
  return MOCK_COMMUNITY_POSTS.filter(
    (p) => p.communitySlug === slug && p.status === "approved" && p.at > NOW_S - 604800
  ).length;
}

/**
 * The directory. Demoted here from /communities because finding a community is
 * a job you do once. Every tile now carries this week's activity and who
 * moderates, which is what actually decides whether to join.
 */
export default function DiscoverCommunities() {
  const { data: comms, isLoading } = useCommunities();
  const { joinedCommunities, toggleJoin } = useSession();

  const featured = comms.find((c) => c.featured);
  const rest = comms.filter((c) => !c.featured);

  return (
    <>
      <Head><title>Discover communities · Shopstr</title></Head>
      <SheetHeader title="Discover" backTo="/communities" contentMax="max-w-[1100px]" />
      <main className="mx-auto max-w-[1100px] px-4 pb-28 pt-3 md:pb-12">
        <p className="max-w-[52ch] text-text-muted">
          Every community is moderated: a member posts, a moderator approves, then it appears.
          That gate is why these rooms are worth reading.
        </p>

        {isLoading ? (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3" aria-hidden="true">
            <div className="col-span-2 min-h-[112px] rounded-lg border-2 border-ink bg-paper-pure p-3.5 md:col-span-3">
              <Skeleton shape="rect" w={34} h={34} />
              <Skeleton shape="line" w="40%" h="1.1rem" className="mt-2.5" />
              <Skeleton shape="line" w="65%" className="mt-2" />
            </div>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="min-h-[150px] rounded-lg border-2 border-ink bg-paper-pure p-3.5">
                <Skeleton shape="rect" w={28} h={28} />
                <Skeleton shape="line" w="75%" h="1rem" className="mt-3" />
                <Skeleton shape="line" w={80} className="mt-2" />
              </div>
            ))}
          </div>
        ) : comms.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              sticker="shape-heart-circle"
              headline="No communities yet"
              body="Curated corners of the market start with one person who cares. That could be you."
              cta={
                <Link href="/communities/new" className="font-bold text-purple underline">
                  Start the first one
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            {featured && (() => {
              const I = COMM_ICONS[featured.emoji];
              const mods = moderatorsOf(featured);
              const activity = weeklyActivity(featured.slug);
              const joined = joinedCommunities.has(featured.slug);
              return (
                <div className={`col-span-2 flex flex-col gap-3 overflow-hidden rounded-lg border-2 border-ink p-4 md:col-span-3 md:flex-row md:items-center ${TONE[featured.tone]}`}>
                  <Link href={`/communities/${featured.slug}`} className="flex flex-1 items-center gap-3.5">
                    {I ? <I size={34} className="shrink-0" /> : null}
                    <div className="min-w-0">
                      <div className="ds-display text-lg leading-none">{featured.name}</div>
                      <div className="mt-1.5 text-[0.82rem] leading-snug opacity-90">{featured.about}</div>
                      <div className="mt-1.5 font-mono text-[0.64rem] tabular-nums opacity-80">
                        {groupInt(featured.memberCount)} members
                        {activity > 0 && ` · ${activity} posts this week`}
                      </div>
                    </div>
                  </Link>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="flex">
                      {mods.map((m) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={m}
                          src={profileByHandle(m)?.picture}
                          alt=""
                          title={`@${m}`}
                          className="-ml-3 h-[34px] w-[34px] rounded-full border-2 border-ink object-cover first:ml-0"
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => toggleJoin(featured.slug)}
                      aria-pressed={joined}
                      className={`ds-press inline-flex items-center gap-1.5 rounded-pill border-2 border-ink px-4 py-2 text-sm font-bold ${
                        joined ? "bg-paper-pure text-ink" : "bg-ink text-text-on-dark"
                      }`}
                    >
                      {joined ? <><Check size={15} weight="bold" /> Joined</> : <><Plus size={15} weight="bold" /> Join</>}
                    </button>
                  </div>
                </div>
              );
            })()}

            {rest.map((c) => {
              const I = COMM_ICONS[c.emoji];
              const activity = weeklyActivity(c.slug);
              const joined = joinedCommunities.has(c.slug);
              return (
                <div key={c.slug} className={`relative flex min-h-[168px] flex-col justify-between overflow-hidden rounded-lg border-2 border-ink p-3.5 ${TONE[c.tone]}`}>
                  <Link href={`/communities/${c.slug}`} className="flex flex-1 flex-col">
                    {I ? <I size={26} /> : null}
                    <div className="mt-auto pt-3">
                      <div className="ds-display text-[1.1rem] leading-[0.95]">{c.name}</div>
                      <div className="mt-1.5 font-mono text-[0.62rem] tabular-nums opacity-80">
                        {groupInt(c.memberCount)} members
                        {activity > 0 && ` · ${activity} this week`}
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => toggleJoin(c.slug)}
                    aria-pressed={joined}
                    className={`ds-press mt-3 inline-flex items-center justify-center gap-1.5 rounded-pill border-2 border-ink py-2 text-xs font-bold ${
                      joined ? "bg-paper-pure text-ink" : "bg-ink text-text-on-dark"
                    }`}
                  >
                    {joined ? <><Check size={13} weight="bold" /> Joined</> : <><Plus size={13} weight="bold" /> Join</>}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <Link
          href="/communities/new"
          className="ds-press mt-4 flex w-full items-center justify-center gap-2 rounded-pill border-2 border-ink bg-paper-pure py-3.5 font-bold"
        >
          <Plus size={18} weight="bold" /> Start a community
        </Link>
      </main>
      <BottomNav active="/communities" />
    </>
  );
}

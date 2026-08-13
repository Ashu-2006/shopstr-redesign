import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  useCommunity,
  useCommunityPosts,
  profileByHandle,
  moderatorsOf,
  ratingForPubkey,
  ME,
} from "@/data/hooks";
import { MOCK_PROFILES } from "@/data/mock/profiles";
import { formatRating, groupInt } from "@/lib/format";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Star, ShieldCheck, SealCheck } from "@phosphor-icons/react";

/**
 * The roster. Moderators first (they hold the approval power, so they are the
 * accountable names), then members who have actually posted, since a name with
 * contributions is more useful than an alphabetical list.
 */
export default function CommunityMembers() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const { data: comm, isLoading } = useCommunity(slug);
  const { data: posts } = useCommunityPosts(slug);

  if (router.isReady && slug && !isLoading && !comm) {
    return (
      <>
        <Head><title>Community not found · Shopstr</title></Head>
        <SheetHeader title="Members" backTo="/communities" />
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

  const mods = comm ? moderatorsOf(comm) : [];
  const postCounts = new Map<string, number>();
  for (const p of posts) {
    postCounts.set(p.authorHandle, (postCounts.get(p.authorHandle) ?? 0) + 1);
  }
  const contributors = [...postCounts.entries()]
    .filter(([h]) => !mods.includes(h))
    .sort((a, b) => b[1] - a[1]);

  const Row = ({ handle, note, isMod }: { handle: string; note?: string; isMod?: boolean }) => {
    const p = profileByHandle(handle);
    const rating = p ? ratingForPubkey(p.pubkey) : null;
    return (
      <li>
        <Link href={`/shop/${handle}`} className="flex items-center gap-3 rounded-xl border-2 border-ink bg-paper-pure p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p?.picture} alt="" className="h-11 w-11 shrink-0 rounded-full border-2 border-ink object-cover" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 font-bold">
              @{handle}
              {p?.nip05 && <SealCheck size={13} weight="fill" className="text-green" />}
              {isMod && <ShieldCheck size={13} weight="bold" className="text-purple" />}
              {handle === ME && (
                <span className="rounded-pill bg-yellow px-1.5 py-px font-mono text-[0.56rem] uppercase tracking-[0.06em]">
                  you
                </span>
              )}
            </div>
            <div className="font-mono text-[0.66rem] text-text-muted">
              {note}
              {rating && rating.count > 0 && (
                <>
                  {note && " · "}
                  <span className="inline-flex items-center gap-0.5 tabular-nums">
                    <Star size={10} weight="fill" /> {formatRating(rating.avg)}
                  </span>
                </>
              )}
            </div>
          </div>
        </Link>
      </li>
    );
  };

  return (
    <>
      <Head><title>{comm ? `${comm.name} members` : "Members"} · Shopstr</title></Head>
      <SheetHeader title="Members" backTo={`/communities/${slug}`} contentMax="max-w-[760px]" />
      <main className="mx-auto max-w-[760px] px-4 pb-28 pt-3 md:pb-12">
        {comm && (
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-text-muted">
            {groupInt(comm.memberCount)} members · {mods.length} moderator{mods.length === 1 ? "" : "s"}
          </p>
        )}

        <h2 className="ds-display mt-4 text-lg">Moderators</h2>
        <ul className="mt-2.5 flex flex-col gap-2.5">
          {mods.map((m) => (
            <Row
              key={m}
              handle={m}
              isMod
              note={m === comm?.curator ? "owner" : "moderator"}
            />
          ))}
        </ul>

        {contributors.length > 0 && (
          <>
            <h2 className="ds-display mt-6 text-lg">Posting here</h2>
            <ul className="mt-2.5 flex flex-col gap-2.5">
              {contributors.map(([h, n]) => (
                <Row key={h} handle={h} note={`${n} post${n === 1 ? "" : "s"}`} />
              ))}
            </ul>
          </>
        )}

        <p className="mt-6 text-center font-mono text-[0.66rem] text-text-subtle">
          The rest of the roster is private. Nostr identities join by following the
          community, not by signing a list.
        </p>
      </main>
      <BottomNav active="/communities" />
    </>
  );
}

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  useCommunity,
  usePendingPosts,
  useIsModerator,
  useSession,
  profileByHandle,
  ratingForPubkey,
} from "@/data/hooks";
import { MOCK_LISTINGS } from "@/data/mock/listings";
import { formatRating } from "@/lib/format";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import { Star, ShieldCheck } from "@phosphor-icons/react";

const NOW = 1717372800000;

/**
 * The moderator queue. This is the role upstream implements (kind 4550
 * approvals) and the old design ignored entirely. Approve publishes the
 * approval; decline drops the request. Both are session-local here.
 *
 * Author trust signals sit next to each post, because that is what a moderator
 * is actually judging: is this person good for the room.
 */
export default function CommunityQueue() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const { data: comm, isLoading: commLoading } = useCommunity(slug);
  const { data: pending, isLoading } = usePendingPosts(slug);
  const isModerator = useIsModerator(slug);
  const { moderatePost } = useSession();

  if (router.isReady && slug && !commLoading && !comm) {
    return (
      <>
        <Head><title>Community not found · Shopstr</title></Head>
        <SheetHeader title="Queue" backTo="/communities" />
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

  // Not a moderator: say so plainly rather than rendering a blank screen.
  if (comm && !isModerator) {
    return (
      <>
        <Head><title>Moderators only · Shopstr</title></Head>
        <SheetHeader title="Queue" backTo={`/communities/${slug}`} />
        <main className="mx-auto max-w-[700px] px-4 py-16">
          <EmptyState
            sticker="shape-hand"
            headline="Moderators only"
            body={`Only @${comm.curator} and the moderators of ${comm.name} can review posts here.`}
            cta={
              <Link href={`/communities/${slug}`}>
                <Button variant="secondary">Back to {comm.name}</Button>
              </Link>
            }
          />
        </main>
        <BottomNav active="/communities" />
      </>
    );
  }

  return (
    <>
      <Head><title>{comm ? `${comm.name} queue` : "Queue"} · Shopstr</title></Head>
      <SheetHeader
        title="Approval queue"
        backTo={`/communities/${slug}`}
        contentMax="max-w-[760px]"
      />
      <main className="mx-auto max-w-[760px] px-4 pb-28 pt-3 md:pb-12">
        <div className="flex items-center gap-2.5 rounded-xl border-2 border-ink bg-yellow p-3.5">
          <ShieldCheck size={22} weight="bold" className="shrink-0" />
          <p className="text-sm leading-snug">
            You moderate <b>{comm?.name}</b>. Approving publishes the post to every member;
            declining drops the request and the author can post again.
          </p>
        </div>

        {isLoading ? (
          <div className="mt-4 flex flex-col gap-3" aria-hidden="true">
            {Array.from({ length: 2 }, (_, i) => (
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
        ) : pending.length === 0 ? (
          <div className="mt-4">
            {/* Empty here is a reward, not a void. */}
            <EmptyState
              sticker="shape-sunstar-yellow"
              headline="Queue clear"
              body="Nothing waiting. Every request in this community has been reviewed."
              cta={
                <Link href={`/communities/${slug}`}>
                  <Button variant="secondary">Back to the room</Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.12em] text-text-subtle">
              {pending.length} awaiting review
            </p>
            {pending.map((p) => {
              const author = profileByHandle(p.authorHandle);
              const rating = author ? ratingForPubkey(author.pubkey) : null;
              return (
                <div key={p.id} className="overflow-hidden rounded-xl border-2 border-ink bg-paper-2">
                  {/* Trust signals for the person, attached to their post: what a
                      moderator is really judging is whether this author is good
                      for the room. */}
                  {rating && rating.count > 0 && (
                    <div className="flex items-center gap-2 px-3.5 py-2 font-mono text-[0.66rem] text-text-muted">
                      <span className="inline-flex items-center gap-1 font-bold tabular-nums">
                        <Star size={11} weight="fill" /> {formatRating(rating.avg)}
                      </span>
                      <span>· {rating.count} reviews as a seller</span>
                    </div>
                  )}
                  <CommunityPostCard
                    post={p}
                    author={author}
                    product={MOCK_LISTINGS.find((l) => l.id === p.productId) ?? null}
                    now={NOW}
                    flush={!!rating && rating.count > 0}
                    onApprove={() => moderatePost(p.id, "approved")}
                    onDecline={() => moderatePost(p.id, "declined")}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav active="/communities" />
    </>
  );
}

import Link from "next/link";
import type { CommunityPost, PostKind } from "@/data/mock/extras";
import type { ProductData, Profile } from "@/data/types";
import { groupInt, timeAgo } from "@/lib/format";
import { Sticker } from "@/components/ui/Sticker";
import {
  Camera,
  Question,
  Tag,
  ChatCircle,
  Check,
  X,
  SealCheck,
  type Icon,
} from "@phosphor-icons/react";

/** Post kind drives the chip, the icon, and nothing else. Colour codes meaning. */
const KIND: Record<PostKind, { label: string; bg: string; icon: Icon }> = {
  show: { label: "Show", bg: "bg-green", icon: Camera },
  ask: { label: "Ask", bg: "bg-blue", icon: Question },
  sale: { label: "For sale", bg: "bg-yellow", icon: Tag },
};

/**
 * One community post. Pure presentation. Renders the author, the kind, the
 * body, an optional quoted listing, and (for moderators) the approve/decline
 * controls that make NIP-72's approval gate real.
 */
export function CommunityPostCard({
  post,
  author,
  product,
  now,
  showCommunity,
  communityName,
  flush,
  onApprove,
  onDecline,
}: {
  post: CommunityPost;
  author?: Profile | null;
  product?: ProductData | null;
  now: number;
  /** In the cross-community digest, say where the post came from. */
  showCommunity?: boolean;
  communityName?: string;
  /** Nested inside an outer frame (the queue): drop our own stroke + radius. */
  flush?: boolean;
  onApprove?: () => void;
  onDecline?: () => void;
}) {
  const k = KIND[post.kind];
  const KIcon = k.icon;
  const pending = post.status === "pending";

  return (
    <article
      className={`bg-paper-pure p-4 ${
        flush
          ? "border-t-2 border-ink"
          : `rounded-xl border-2 ${pending ? "border-dashed border-text-subtle" : "border-ink"}`
      }`}
    >
      <header className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={author?.picture}
          alt=""
          className="h-9 w-9 shrink-0 rounded-full border-2 border-ink object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-sm font-bold">
            @{post.authorHandle}
            {author?.nip05 && <SealCheck size={13} weight="fill" className="text-green" />}
          </div>
          <div className="font-mono text-[0.62rem] text-text-subtle">
            {timeAgo(post.at, now)}
            {showCommunity && communityName && ` · ${communityName}`}
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-pill border-2 border-ink px-2.5 py-1 text-[0.66rem] font-bold ${k.bg}`}
        >
          <KIcon size={12} weight="bold" /> {k.label}
        </span>
      </header>

      <p className="mt-3 text-[0.95rem] leading-snug">{post.text}</p>

      {product && (
        <Link
          href={`/listing/${product.id}`}
          className="ds-press mt-3 flex items-center gap-3 rounded-lg border-2 border-ink bg-paper-2 p-2.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images[0]}
            alt=""
            className="h-12 w-12 shrink-0 rounded-md border-2 border-ink object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{product.title}</div>
            <div className="font-mono text-xs tabular-nums">{groupInt(product.price)} sats</div>
          </div>
          <span className="shrink-0 font-mono text-[0.62rem] font-bold uppercase tracking-[0.08em] text-purple">
            View →
          </span>
        </Link>
      )}

      <footer className="mt-3 flex items-center gap-3">
        {pending ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-[0.66rem] font-bold uppercase tracking-[0.08em] text-text-muted">
            <Sticker name="badge-new-round" className="h-4 w-4" /> Awaiting approval
          </span>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5 font-mono text-[0.7rem] text-text-muted tabular-nums">
              <ChatCircle size={14} /> {post.replyCount}
            </span>
            {post.approvedBy && (
              <span className="font-mono text-[0.62rem] text-text-subtle">
                approved by @{post.approvedBy}
              </span>
            )}
          </>
        )}

        {(onApprove || onDecline) && (
          <span className="ml-auto flex gap-2">
            {onDecline && (
              <button
                onClick={onDecline}
                className="ds-press inline-flex items-center gap-1 rounded-pill border-2 border-ink bg-paper-pure px-3 py-1.5 text-xs font-bold"
              >
                <X size={13} weight="bold" /> Decline
              </button>
            )}
            {onApprove && (
              <button
                onClick={onApprove}
                className="ds-press inline-flex items-center gap-1 rounded-pill border-2 border-ink bg-ink px-3 py-1.5 text-xs font-bold text-text-on-dark"
              >
                <Check size={13} weight="bold" /> Approve
              </button>
            )}
          </span>
        )}
      </footer>
    </article>
  );
}

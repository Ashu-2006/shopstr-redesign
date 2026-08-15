import type { Review, ReviewDimension } from "@/data/types";
import { timeAgo } from "@/lib/format";
import { ThumbsUp, ThumbsDown } from "@phosphor-icons/react";

const LABEL: Record<ReviewDimension, string> = {
  value: "Value",
  quality: "Quality",
  delivery: "Delivery",
  communication: "Comms",
};

/**
 * One review. Pure presentation.
 *
 * A review is a thumb plus named dimensions, never a star count — so the card
 * leads with the thumb and lists only the dimensions the reviewer actually
 * rated. An absent dimension means "not rated", which is why it is omitted
 * rather than shown as a negative.
 */
export function ReviewCard({
  review,
  now,
  authorHandle,
}: {
  review: Review;
  now: number;
  authorHandle?: string;
}) {
  const rated = (Object.entries(review.dimensions) as [ReviewDimension, boolean][]).filter(
    ([, v]) => v !== undefined
  );

  return (
    <li className="rounded-lg border-2 border-ink bg-paper-pure p-3.5">
      <div className="flex items-center justify-between gap-3">
        {/* A verdict, not an alarm. Full-saturation accents on every row made a
            wall of reviews shout; the icon carries the signal and the tint just
            supports it. */}
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
            review.thumb ? "text-text" : "text-red"
          }`}
        >
          <span
            className={`grid h-5 w-5 place-items-center rounded-full ${
              review.thumb ? "bg-green-soft" : "bg-pink-soft"
            }`}
          >
            {review.thumb ? <ThumbsUp size={11} weight="fill" /> : <ThumbsDown size={11} weight="fill" />}
          </span>
          {review.thumb ? "Would deal again" : "Would not"}
        </span>
        <span className="font-mono text-[0.7rem] text-text-subtle">
          {authorHandle ? `@${authorHandle} · ` : ""}
          {timeAgo(review.createdAt, now)}
        </span>
      </div>

      {rated.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {rated.map(([dim, ok]) => (
            <li
              key={dim}
              className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.06em] ${
                ok ? "bg-green-soft text-ink" : "bg-paper-2 text-text-muted line-through"
              }`}
            >
              {LABEL[dim]}
            </li>
          ))}
        </ul>
      )}

      {review.text && <p className="mt-2 text-sm text-text-muted">{review.text}</p>}
    </li>
  );
}

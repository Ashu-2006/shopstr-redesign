import { useState } from "react";
import type { Review } from "@/data/types";
import { ReviewCard } from "@/components/ReviewCard";
import { CaretDown } from "@phosphor-icons/react";

/**
 * Review list with progressive disclosure: the top few reviews up front, the
 * rest behind one "Show more". Social proof works at a glance; forty rows of
 * it just buries whatever section comes next.
 *
 * Local UI state only (same precedent as Carousel/Toast): which rows are
 * revealed is presentation, not data.
 */
export function ReviewList({
  reviews,
  now,
  handleFor,
  initial = 3,
}: {
  reviews: Review[];
  now: number;
  /** Resolves an author pubkey to a display handle. */
  handleFor: (pubkey: string) => string | undefined;
  initial?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? reviews : reviews.slice(0, initial);
  const hidden = reviews.length - visible.length;

  return (
    <>
      <ul className="flex flex-col gap-2.5">
        {visible.map((r) => (
          <ReviewCard key={r.id} review={r} now={now} authorHandle={handleFor(r.authorPubkey)} />
        ))}
      </ul>
      {/* The count is on the button so the reader knows the size of what they
          are opening; the control disappears once everything is shown. */}
      {hidden > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="ds-press mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-pill border-2 border-ink bg-paper-pure px-5 py-2.5 text-sm font-bold"
        >
          Show {hidden} more {hidden === 1 ? "review" : "reviews"}
          <CaretDown size={15} weight="bold" />
        </button>
      )}
    </>
  );
}

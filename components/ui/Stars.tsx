import { Star } from "@phosphor-icons/react";
import { formatRating, groupInt } from "@/lib/format";

/** Inline rating: ★ 4.9 · 81 reviews. Number is mono/tabular (it's a value). */
export function Stars({
  avg,
  count,
  className = "",
}: {
  avg: number;
  count: number;
  className?: string;
}) {
  if (count === 0) {
    return <span className={`text-text-subtle ${className}`}>No reviews yet</span>;
  }
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Star weight="fill" size={16} aria-hidden />

      <span className="font-mono tabular-nums font-bold">{formatRating(avg)}</span>
      <span className="text-text-subtle">· {groupInt(count)} reviews</span>
    </span>
  );
}

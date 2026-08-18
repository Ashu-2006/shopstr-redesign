import Link from "next/link";
import type { ReactNode } from "react";

/** Section heading row: uppercase display title + an optional note or see-all link. */
export function SectionTitle({
  children,
  note,
  seeAllHref,
  className = "",
}: {
  children: ReactNode;
  note?: ReactNode;
  seeAllHref?: string;
  className?: string;
}) {
  return (
    <div className={`mb-4 mt-14 flex items-baseline justify-between first:mt-0 ${className}`}>
      <h2 className="ds-display text-xl">{children}</h2>
      {seeAllHref ? (
        <Link href={seeAllHref} className="inline-flex items-center gap-1 text-sm font-bold text-purple">
          See all →
        </Link>
      ) : note ? (
        <span className="font-mono text-xs text-text-subtle tabular-nums">{note}</span>
      ) : null}
    </div>
  );
}

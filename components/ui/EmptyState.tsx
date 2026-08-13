/* EmptyState primitive — the one designed treatment for empty, no-results,
   and not-found. Replaces the four divergent hand-rolled treatments (cart
   sticker block, dashed feed/search boxes, bare category paragraph).
   Rules, from the loading/empty-states spec:
   - "page": true zero or not-found. Sticker + display headline + body + a CTA
     that actually works. Never zeros, never a blank screen.
   - "inline": zero AFTER a user-applied filter/search. Chrome-preserving
     dashed box with a recovery action ("Clear filters"). Distinct from empty.
   - Copy: headline short + present tense; body explains, then recovers.
   Pure presentation — callers pass CTAs as nodes (e.g. <Link><Button/></Link>). */

import type { ReactNode } from "react";
import { Sticker, type StickerName } from "@/components/ui/Sticker";

export function EmptyState({
  variant = "page",
  sticker,
  headline,
  body,
  cta,
  secondaryCta,
  className = "",
}: {
  variant?: "page" | "inline";
  /** page default: shape-starburst. Pass null to omit on page variant. */
  sticker?: StickerName | null;
  headline: string;
  body?: string;
  cta?: ReactNode;
  secondaryCta?: ReactNode;
  className?: string;
}) {
  const isPage = variant === "page";
  const mark = sticker === null ? null : (sticker ?? (isPage ? "shape-starburst" : null));

  return (
    <div
      role="status"
      className={[
        "text-center",
        isPage
          ? "px-6 pb-10 pt-16"
          : // Inline needs to read as a bounded well. The dashed stroke carries
            // that in the default theme; body.soft-sep zeroes every border, so a
            // paper-2 fill backs it up and the container survives either mode.
            "rounded-xl border-2 border-dashed border-ink/30 bg-paper-2/60 px-6 py-14",
        className,
      ].join(" ")}
    >
      {mark && (
        <Sticker
          name={mark}
          className={`pop-in mx-auto mb-4 ${isPage ? "h-20 w-20" : "h-12 w-12"}`}
        />
      )}
      <p className={`ds-display ${isPage ? "text-2xl" : "text-xl"}`}>{headline}</p>
      {body && <p className="mx-auto mt-2 max-w-[42ch] text-text-muted">{body}</p>}
      {(cta || secondaryCta) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {cta}
          {secondaryCta}
        </div>
      )}
    </div>
  );
}

import type { ReactNode } from "react";

/**
 * The spec-sheet card. Anatomy, top to bottom:
 *
 *   [LABEL TAB]                 <- small tab that sits ABOVE the frame
 *   ┌─────────────────────────┐
 *   │ title      ▏▏▏▏▏▏▏▏▏▏▏ │ <- title, then a ruler/tick strip as the rule
 *   ├─────────────────────────┤
 *   │   solid colour panel    │ <- media: a real UI fragment or a big figure
 *   ├─────────────────────────┤
 *   │ body copy               │ <- plain well
 *   └─────────────────────────┘
 *
 * The tab-above-the-frame and the tick rule are what make it read as a
 * technical spec rather than a marketing tile, which is exactly the register
 * this product wants: it is making factual claims about a protocol.
 */
export function SpecCard({
  label,
  title,
  panelBg = "bg-paper-2",
  panel,
  children,
  className = "",
}: {
  /** The tab above the frame, e.g. "Step 01" or "Pricing". */
  label: string;
  title: string;
  /** Ground for the media panel. One of our accents, or a paper step. */
  panelBg?: string;
  /** The media panel's contents: a real UI fragment, a figure, a sticker. */
  panel: ReactNode;
  /** Body copy under the panel. */
  children: ReactNode;
  className?: string;
}) {
  return (
    // text-ink is explicit: the card is a paper surface, so it must NOT inherit
    // the light text colour of an ink section it happens to sit inside.
    // Without it the tab and title render dark-on-dark.
    <div className={`flex flex-col text-ink ${className}`}>
      {/* Tab: overlaps nothing, sits on its own line, joins the frame below. */}
      <span className="ml-0 inline-flex w-fit border-2 border-b-0 border-ink bg-paper-pure px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em]">
        {label}
      </span>

      <div className="flex flex-1 flex-col border-2 border-ink bg-paper-pure">
        {/* Title row + tick rule. The ticks are decoration only. */}
        <div className="flex items-center gap-3 px-3.5 py-3">
          <h3 className="ds-display shrink-0 text-lg leading-none lg:text-xl">{title}</h3>
          <span aria-hidden className="ls-ticks h-3 min-w-0 flex-1 opacity-25" />
        </div>

        {/* Media panel: full-bleed colour block inside the frame. */}
        <div className={`grid min-h-[150px] place-items-center border-y-2 border-ink p-4 ${panelBg}`}>
          {panel}
        </div>

        <div className="p-3.5 text-[0.92rem] leading-snug text-text-muted">{children}</div>
      </div>
    </div>
  );
}

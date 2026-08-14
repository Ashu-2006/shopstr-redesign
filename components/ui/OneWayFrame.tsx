import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "@phosphor-icons/react";
import { Sticker, type StickerName } from "@/components/ui/Sticker";
import { tEnter, tLayout } from "@/lib/motion";

type Tone = "purple" | "yellow" | "green";

const BG: Record<Tone, string> = {
  purple: "bg-purple text-on-purple",
  yellow: "bg-yellow text-ink",
  green: "bg-green text-ink",
};

/**
 * Full-bleed colored shell for one-way flows (checkout steps, review, sell,
 * payout, withdraw, wallet send/receive). A close control top-left, a step
 * label, optional progress dots, a decorative sticker, and a white content card.
 * Pure-ish: navigation uses the router's back, or an explicit `closeTo`.
 *
 * Two layouts:
 * - Default (no `header`/`footer`): a content card that hugs its content.
 * - Dialog (with `header` and/or `footer`): ONE fixed-height panel whose middle
 *   scrolls, with a sticky context header on top and a docked action footer at
 *   the bottom. Use this for flows where the step content varies in length and
 *   the CTA must never float away from the panel edge.
 */
export function OneWayFrame({
  tone = "purple",
  step,
  current,
  total,
  closeTo,
  sticker = "shape-sparkle-4pt",
  header,
  footer,
  children,
}: {
  tone?: Tone;
  step: string;
  current?: number;
  total?: number;
  closeTo?: string;
  sticker?: StickerName;
  /** Persistent context at the top of the panel (never scrolls away). */
  header?: ReactNode;
  /** Docked action bar at the bottom of the panel (paper fill, top stroke). */
  footer?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const onClose = () => (closeTo ? router.push(closeTo) : router.back());
  const onPurple = tone === "purple";
  const dialog = Boolean(header || footer);

  // Dialog mode pins the shell to exactly the viewport height: the panel's height
  // cap resolves against it, and the panel's inner region is the only thing that
  // scrolls. Card mode keeps min-height so tall content pushes the page scroll
  // instead of clipping.
  return (
    <div className={`relative flex flex-col overflow-hidden ${dialog ? "h-dvh" : "min-h-dvh"} ${BG[tone]}`}>
      <div className="flex items-center gap-3 px-6 py-4">
        <button
          onClick={onClose}
          aria-label="Close"
          className={`ds-press grid h-9 w-9 place-items-center rounded-full border-2 ${
            onPurple ? "border-white/50" : "border-ink"
          }`}
        >
          <X size={15} weight="bold" />
        </button>
        <span className="font-mono text-[0.72rem] uppercase tracking-[0.16em] opacity-90">{step}</span>
        {total ? (
          <span className="ml-auto flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={`h-[5px] w-[22px] rounded-[3px] transition-opacity ${
                  onPurple ? "bg-white" : "bg-ink"
                } ${i < (current ?? 0) ? "opacity-100" : "opacity-30"}`}
              />
            ))}
          </span>
        ) : null}
      </div>

      <Sticker
        name={sticker}
        className={`pointer-events-none absolute right-7 top-[84px] z-0 h-16 w-16 ${dialog ? "hidden lg:block" : ""}`}
      />

      {/* Centering region: the panel sits vertically centered in the space below
          the header, with balanced gutters. It respects the bottom safe-area inset. */}
      <div
        className="flex min-h-0 flex-1 items-center justify-center px-6 pt-2"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)" }}
      >
        {/* The panel PERSISTS across steps. `layout` smart-animates its height as
            the inner content swaps, so steps don't pop in as fresh cards. In
            dialog mode the height is fixed, so only the inner region moves.
            Keeps the `y` shorthand deliberately: `layout` drives this element's
            transform via layout projection, and a hardcoded transform string
            would fight it. A one-off mount is not an under-load hot path. */}
        <motion.div
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ layout: tLayout, ...tEnter }}
          className={
            dialog
              ? "z-10 flex h-[min(640px,100%)] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border-2 border-ink bg-paper-pure text-ink sm:h-[min(720px,100%)] lg:h-[min(760px,calc(100dvh-140px))] lg:max-w-[620px]"
              : "z-10 w-full max-w-[440px] overflow-hidden rounded-2xl border-2 border-ink bg-paper-pure p-6 text-ink"
          }
        >
          {dialog ? (
            <>
              {header && <div className="shrink-0 border-b-2 border-ink">{header}</div>}
              {/* The only scroll region. Fixed panel, moving content. Extra bottom
                  padding so the last line clears the docked footer's edge. */}
              <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-7 pt-5 lg:px-8">{children}</div>
              {footer && <div className="shrink-0 border-t-2 border-ink bg-paper-pure px-6 py-4 lg:px-8">{footer}</div>}
            </>
          ) : (
            children
          )}
        </motion.div>
      </div>
    </div>
  );
}

/** Lead/kicker line inside a one-way card. */
export function FlowLead({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-text-muted">{children}</div>
  );
}

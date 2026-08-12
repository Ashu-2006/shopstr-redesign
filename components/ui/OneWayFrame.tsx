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
 */
export function OneWayFrame({
  tone = "purple",
  step,
  current,
  total,
  closeTo,
  sticker = "shape-sparkle-4pt",
  aside,
  children,
}: {
  tone?: Tone;
  step: string;
  current?: number;
  total?: number;
  closeTo?: string;
  sticker?: StickerName;
  /** Companion card (e.g. an order summary): above the card on mobile, a rail beside it at lg+. */
  aside?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const onClose = () => (closeTo ? router.push(closeTo) : router.back());
  const onPurple = tone === "purple";

  return (
    <div className={`relative flex min-h-screen flex-col overflow-hidden ${BG[tone]}`}>
      <div className="flex items-center gap-3 px-6 py-4">
        <button
          onClick={onClose}
          aria-label="Close"
          className={`ds-press grid h-9 w-9 place-items-center rounded-full border-2 ${
            onPurple ? "border-white/50" : "border-ink"
          }`}
        >
          <X size={15} />
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

      <Sticker name={sticker} className="pointer-events-none absolute right-7 top-[84px] z-0 h-16 w-16" />

      {/* Centering region: the card sits vertically centered in the space below
          the header, with balanced gutters. It grows to fit tall steps (the page
          scrolls rather than clipping) and respects the bottom safe-area inset. */}
      <div
        className={
          aside
            ? "flex flex-1 flex-col items-center justify-center gap-3 px-6 pt-2 lg:flex-row-reverse lg:items-center lg:gap-5"
            : "flex flex-1 items-center justify-center px-6 pt-2"
        }
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)" }}
      >
        {/* aside sits first in the DOM: on mobile it stacks above the card (context
            before form); at lg the row is reversed so it reads as a right rail. */}
        {aside && <div className="z-10 w-full max-w-[440px] lg:w-[340px] lg:max-w-none lg:shrink-0">{aside}</div>}
        {/* The card PERSISTS across steps. `layout` smart-animates its height as the
            inner content swaps, so steps don't pop in as fresh cards. */}
        <motion.div
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ layout: tLayout, ...tEnter }}
          className="z-10 w-full max-w-[440px] overflow-hidden rounded-2xl border-2 border-ink bg-paper-pure p-6 text-ink"
        >
          {children}
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

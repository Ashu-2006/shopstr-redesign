import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Sticker, type StickerName } from "@/components/ui/Sticker";

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
  children,
}: {
  tone?: Tone;
  step: string;
  current?: number;
  total?: number;
  closeTo?: string;
  sticker?: StickerName;
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
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
        <span className="font-mono text-[0.72rem] uppercase tracking-[0.16em] opacity-90">{step}</span>
        {total ? (
          <span className="ml-auto flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={`h-[5px] w-[22px] rounded-[3px] transition-opacity duration-300 ${
                  onPurple ? "bg-white" : "bg-ink"
                } ${i < (current ?? 0) ? "opacity-100" : "opacity-30"}`}
              />
            ))}
          </span>
        ) : null}
      </div>

      <Sticker name={sticker} className="pointer-events-none absolute right-7 top-[84px] z-0 h-16 w-16" />

      {/* The card PERSISTS across steps. `layout` smart-animates its height as the
          inner content swaps, so steps don't pop in as fresh cards. */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ layout: { type: "spring", bounce: 0, duration: 0.45 }, duration: 0.4 }}
        className="z-10 mx-6 my-auto w-full max-w-[440px] self-center overflow-hidden rounded-2xl border-2 border-ink bg-paper-pure p-6 text-ink"
        style={{ marginBottom: "max(env(safe-area-inset-bottom), 1.5rem)" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Lead/kicker line inside a one-way card. */
export function FlowLead({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-text-muted">{children}</div>
  );
}

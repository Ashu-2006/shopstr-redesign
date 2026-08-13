/* BootScreen — the app-boot shell ("sticker vending machine").
   Covers the one moment before ANY data exists, where there is no card
   geometry to shape-match, so a skeleton has nothing to mirror. Stickers
   orbit onto the shelf one at a time; when data lands the whole thing lifts
   away. In-content loading stays skeleton-only (components/skeletons.tsx).

   Pure presentation: the caller owns the boot signal (useAppBoot) and the
   exit; this component only knows how to animate itself.

   Reduced motion: anime.js is JS-driven, so the global CSS duration kill in
   globals.css cannot reach it. We check the media query directly and render a
   static settled frame with no animation at all. */

import { useEffect, useRef } from "react";
import { animate, createTimeline, stagger } from "animejs";
import { stickerSrc, type StickerName } from "@/components/ui/Sticker";

/** Eight stickers on an even orbit. Ordered so adjacent arrivals land on
    opposite sides of the ring rather than walking around it. */
const ORBIT: StickerName[] = [
  "shape-starburst",
  "shape-heart-circle",
  "shape-daisy-yellow",
  "badge-new-round",
  "shape-smiley",
  "badge-love-heart",
  "shape-sunstar-purple",
  "shape-sparkle-4pt",
];

/* Orbit radii. Wide enough to clear the wordmark: the lockup is ~200px across,
   so a tighter ring puts stickers on top of the type. Elliptical (wider than
   tall) because the lockup is wider than tall. */
const RING_X = 210;
const RING_Y = 132;

export function BootScreen({ leaving = false }: { leaving?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const stickers = Array.from(
      root.querySelectorAll<HTMLElement>("[data-fly]")
    );
    const reverters: { revert: () => void }[] = [];

    // The lockup breathes so the screen never feels frozen between arrivals.
    reverters.push(
      animate(root.querySelectorAll("[data-lockup]"), {
        scale: [1, 1.05],
        duration: 1000,
        ease: "inOutQuad",
        loop: true,
        alternate: true,
      })
    );

    // Restock loop: each sticker flies in from off-screen along its own radius,
    // lands with an overshoot, holds, then the shelf clears and refills.
    const tl = createTimeline({ loop: true, loopDelay: 260 });
    stickers.forEach((el, i) => {
      // Interleave the ring positions (0,4,1,5,2,6,3,7) so consecutive arrivals
      // land on opposite sides instead of walking around and clustering.
      const half = stickers.length / 2;
      const slot = (i % 2 === 0 ? i / 2 : half + (i - 1) / 2) % stickers.length;
      const angle = (slot / stickers.length) * Math.PI * 2 - Math.PI / 2;
      tl.add(
        el,
        {
          x: [Math.cos(angle) * 620, Math.cos(angle) * RING_X],
          y: [Math.sin(angle) * 460, Math.sin(angle) * RING_Y],
          rotate: [i % 2 ? -110 : 110, (i % 2 ? 1 : -1) * (8 + i * 3)],
          scale: [0.35, 1],
          opacity: [0, 1],
          duration: 520,
          ease: "outBack",
        },
        i * 170
      );
    });
    tl.add(
      stickers,
      {
        scale: 0,
        opacity: 0,
        duration: 260,
        ease: "inBack",
        delay: stagger(38),
      },
      "+=480"
    );
    reverters.push(tl);

    return () => reverters.forEach((r) => r.revert());
  }, []);

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      aria-label="Loading Shopstr"
      className={[
        "fixed inset-0 z-[100] grid place-items-center bg-paper",
        "transition-[opacity,transform] duration-(--ds-dur-slow) ease-exit",
        leaving ? "pointer-events-none -translate-y-2 opacity-0" : "opacity-100",
      ].join(" ")}
    >
      <div className="relative grid place-items-center text-center">
        {ORBIT.map((name) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={name}
            src={stickerSrc(name)}
            alt=""
            aria-hidden
            data-fly
            /* opacity-0 until the timeline animates it in. Under reduced motion
               the timeline never runs, so they simply stay invisible and the
               lockup alone carries the screen. */
            className="absolute h-12 w-12 opacity-0 md:h-14 md:w-14"
            draggable={false}
          />
        ))}
        <div data-lockup>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={stickerSrc("shape-sparkle-4pt")}
            alt=""
            aria-hidden
            className="mx-auto h-12 w-12 md:h-14 md:w-14"
            draggable={false}
          />
          <div className="ds-display mt-2.5 text-2xl md:text-3xl">Shopstr</div>
          <div className="mt-1.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-text-subtle">
            Stocking the shelves
          </div>
        </div>
      </div>
    </div>
  );
}

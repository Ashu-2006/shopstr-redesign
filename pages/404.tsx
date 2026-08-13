/* 404 — the "receipt print" concept, shipped.
   The page prints a lookup receipt line by line (scramble-resolve per value),
   then the slip tears along a jagged edge and the half carrying the 404 falls
   away under real gravity. The recovery CTAs fade in as it goes: the joke never
   delays the exit.

   Physics, not a tween. The falling half integrates a velocity/angular-velocity
   state per frame (gravity + a small torque from the tear being off-centre),
   so acceleration, rotation, and the landing all fall out of one model instead
   of being keyframed. anime.js drives the ticker via a linear 0..1 animation
   whose onUpdate advances the integrator by real elapsed time.

   Reduced motion: no animation at all. The receipt renders whole and settled,
   values already resolved, CTAs visible. */

import { useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { animate, createTimeline } from "animejs";
import { Button } from "@/components/ui/Button";
import { BottomNav } from "@/components/ui/BottomNav";
import { MagnifyingGlass } from "@phosphor-icons/react";

/* The printed lines. Honest by construction: this is a page lookup that
   returned nothing, which is exactly what happened. No invented statuses. */
const LINES: [string, string][] = [
  ["lookup", "1 path"],
  ["matches", "0 results"],
  ["status", "NOT FOUND"],
];

/* Jagged tear edge, 11 teeth. The kept half gets the zigzag on its bottom
   edge; the falling half gets the exact mirror on its top, so the two halves
   interlock before the tear. */
const TEETH = 11;
const zig = (kept: boolean) => {
  const pts: string[] = [];
  pts.push(kept ? "0% 0%" : "0% 100%");
  for (let i = 0; i <= TEETH; i++) {
    const x = (i / TEETH) * 100;
    const deep = i % 2 === 0;
    const y = deep ? 90 : 100;
    pts.push(`${x}% ${kept ? y : 100 - y}%`);
  }
  pts.push(kept ? "100% 0%" : "100% 100%");
  return `polygon(${pts.join(",")})`;
};

const SCRAMBLE_POOL = "#%*+=<>/";

export default function NotFound() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const q = <T extends HTMLElement>(sel: string) =>
      Array.from(root.querySelectorAll<T>(sel));

    // ---- Reduced motion: settled frame, no animation -----------------------
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      q("[data-reveal]").forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      q<HTMLElement>("[data-value]").forEach((el) => {
        el.textContent = el.dataset.final ?? "";
      });
      return;
    }

    const reverters: { revert: () => void }[] = [];
    const tl = createTimeline();

    // 1. The slip feeds out of the printer.
    tl.add(q("[data-slip]"), {
      y: [30, 0],
      opacity: [0, 1],
      duration: 420,
      ease: "outQuad",
    });

    // 2. Each line prints, its value resolving left-to-right out of noise.
    q("[data-line]").forEach((line, i) => {
      const value = line.querySelector<HTMLElement>("[data-value]")!;
      const final = value.dataset.final ?? "";
      const at = 440 + i * 460;
      tl.add(line, { opacity: [0, 1], duration: 110, ease: "linear" }, at);
      const cursor = { p: 0 };
      tl.add(
        cursor,
        {
          p: [0, 1],
          duration: 420,
          ease: "linear",
          onUpdate: () => {
            const n = Math.floor(cursor.p * final.length);
            let out = final.slice(0, n);
            for (let k = n; k < final.length; k++) {
              out +=
                final[k] === " "
                  ? " "
                  : SCRAMBLE_POOL[
                      Math.floor(Math.random() * SCRAMBLE_POOL.length)
                    ];
            }
            value.textContent = out;
          },
        },
        at
      );
    });

    // 3. The tear: the kept half recoils upward as the paper gives.
    const tearAt = 440 + LINES.length * 460 + 320;
    tl.add(
      q("[data-keep]"),
      { y: [0, -5, 0], rotate: [0, -1.1, 0], duration: 520, ease: "outQuad" },
      tearAt
    );

    // 4. The fall, integrated. Gravity in px/s^2; the torque is small and
    //    constant because the tear releases one side a beat before the other.
    const [fall] = q<HTMLElement>("[data-fall]");
    if (fall) {
      const GRAVITY = 2100;
      const TORQUE = 34; // deg/s^2
      const stageBottom = window.innerHeight + 260; // fall clear of the viewport
      const startTop = fall.getBoundingClientRect().top;
      let y = 0;
      let vy = 120; // the tear itself imparts a small downward shove
      let rot = 0;
      let vr = 16;
      let last = 0;

      const state = { t: 0 };
      tl.add(
        state,
        {
          t: [0, 1],
          duration: 1800,
          ease: "linear",
          onBegin: () => {
            last = 0;
          },
          onUpdate: (self: { currentTime: number }) => {
            // Real elapsed seconds since the previous frame, so the motion is
            // frame-rate independent rather than per-tick.
            const now = self.currentTime;
            const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05);
            last = now;
            vy += GRAVITY * dt;
            vr += TORQUE * dt;
            y += vy * dt;
            rot += vr * dt;
            if (startTop + y > stageBottom) return;
            fall.style.transform = `translateY(${y}px) rotate(${rot}deg)`;
          },
          onComplete: () => {
            fall.style.opacity = "0";
          },
        },
        tearAt + 180
      );
    }

    // 5. Recovery reveals while the paper is still in the air.
    tl.add(
      q("[data-reveal]"),
      {
        y: [14, 0],
        opacity: [0, 1],
        duration: 380,
        ease: "outQuad",
        delay: 90,
      },
      tearAt + 340
    );

    reverters.push(tl);
    return () => reverters.forEach((r) => r.revert());
  }, []);

  return (
    <>
      <Head>
        <title>Page not found · Shopstr</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main
        ref={ref}
        className="mx-auto grid min-h-[100svh] max-w-[560px] place-items-center overflow-hidden px-4 pb-28 pt-10 md:pb-16"
      >
        <div className="w-full">
          <div
            data-slip
            className="mx-auto w-[300px] opacity-0 motion-reduce:opacity-100 sm:w-[330px]"
          >
            {/* Kept half: the header + printed lines. */}
            <div
              data-keep
              className="rounded-t-lg border-2 border-b-0 border-ink bg-paper-pure px-5 pb-6 pt-4"
              style={{ clipPath: zig(true) }}
            >
              <div className="flex items-baseline justify-between border-b-2 border-dashed border-ink/25 pb-2.5">
                <span className="ds-display text-base">Shopstr</span>
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-text-subtle">
                  page lookup
                </span>
              </div>
              <div className="mt-3.5 flex flex-col gap-2.5">
                {LINES.map(([label, value]) => (
                  <div
                    key={label}
                    data-line
                    className="flex items-baseline justify-between font-mono text-[0.74rem] opacity-0 motion-reduce:opacity-100"
                  >
                    <span className="uppercase tracking-[0.08em] text-text-muted">
                      {label}
                    </span>
                    <span
                      data-value
                      data-final={value}
                      className="font-bold tabular-nums"
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Falling half: the 404 stub. aria-hidden, since the headline
                below carries the message for assistive tech. */}
            <div
              data-fall
              aria-hidden
              className="-mt-0.5 border-2 border-t-0 border-ink bg-paper-pure px-5 pb-5 pt-5 text-center"
              style={{ clipPath: zig(false), willChange: "transform" }}
            >
              <span className="ds-display text-3xl">404</span>
              <div className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-text-muted">
                no such page
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <h1
              data-reveal
              className="ds-display text-3xl opacity-0 motion-reduce:opacity-100 md:text-4xl"
            >
              This page isn&apos;t here
            </h1>
            <p
              data-reveal
              className="mx-auto mt-2.5 max-w-[38ch] text-text-muted opacity-0 motion-reduce:opacity-100"
            >
              The link may be stale, or the listing sold and came down. The
              market is still open.
            </p>
            <div
              data-reveal
              className="mt-6 flex flex-wrap items-center justify-center gap-3 opacity-0 motion-reduce:opacity-100"
            >
              <Link href="/marketplace">
                <Button variant="secondary">Back to the market</Button>
              </Link>
              <Link href="/search">
                <Button variant="ghost">
                  <span className="inline-flex items-center gap-2">
                    <MagnifyingGlass size={18} /> Search instead
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <BottomNav active="/marketplace" />
    </>
  );
}

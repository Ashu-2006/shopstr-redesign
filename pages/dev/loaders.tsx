import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { animate, createTimeline, stagger } from "animejs";
import { Button } from "@/components/ui/Button";
import { stickerSrc, type StickerName } from "@/components/ui/Sticker";
import { ArrowCounterClockwise } from "@phosphor-icons/react";

/* Dev-only playground: 3 full-page loader concepts (boot shell + 404 form),
   animated with anime.js v4. Not linked from the app. Route: /dev/loaders
   Concepts, from the ideation round:
   2. Sticker vending machine (boot) / sticker spill (404)
   3. Brutalist block shuffle (boot) / block gap (404)
   5. Receipt print (boot) / receipt tear (404)
   Reduced motion: animations are skipped and each stage shows its settled
   final frame instead (anime.js is JS-driven, so the CSS kill can't catch it). */

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** In reduced-motion mode reveal everything marked data-rm-show and keep
    flying decor (data-rm-hide) hidden; returns true when reduced. */
function applyReducedFallback(root: HTMLElement): boolean {
  if (!reducedMotion()) return false;
  root.querySelectorAll<HTMLElement>("[data-rm-show]").forEach((el) => {
    el.style.opacity = "1";
    el.style.transform = "none";
  });
  return true;
}

const els = (root: HTMLElement, sel: string) =>
  Array.from(root.querySelectorAll<HTMLElement>(sel));

type Reverter = { revert: () => void };

/* ================================================================ STAGE ==== */

function Stage({
  title,
  note,
  onReplay,
  children,
  tall = false,
}: {
  title: string;
  note: string;
  onReplay: () => void;
  children: React.ReactNode;
  tall?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="ds-display text-base">{title}</h3>
        <button
          onClick={onReplay}
          className="ds-press inline-flex items-center gap-1.5 rounded-pill border-2 border-ink bg-paper-pure px-3 py-1 font-mono text-[0.66rem] font-bold"
        >
          <ArrowCounterClockwise size={12} /> Replay
        </button>
      </div>
      <div
        className={`relative overflow-hidden rounded-xl border-2 border-ink bg-paper-pure ${
          tall ? "h-[480px]" : "h-[420px]"
        }`}
      >
        {children}
      </div>
      <p className="mt-2 font-mono text-[0.66rem] text-text-subtle">{note}</p>
    </div>
  );
}

/* ============================================== 2 · STICKER VENDING (boot) == */

const VEND_STICKERS: StickerName[] = [
  "shape-starburst",
  "shape-smiley",
  "shape-daisy-yellow",
  "badge-love-heart",
  "shape-heart-circle",
  "shape-sparkle-4pt",
  "shape-sunstar-purple",
  "badge-new-round",
];

function VendingBoot() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current!;
    if (applyReducedFallback(root)) return;
    const anims: Reverter[] = [];

    anims.push(
      animate(els(root, "[data-logo]"), {
        scale: [1, 1.07],
        duration: 900,
        ease: "inOutQuad",
        loop: true,
        alternate: true,
      })
    );

    const tl = createTimeline({ loop: true, loopDelay: 350 });
    const stickers = els(root, "[data-fly]");
    stickers.forEach((el, i) => {
      const angle = (i / stickers.length) * Math.PI * 2 - Math.PI / 2;
      const landX = Math.cos(angle) * 128;
      const landY = Math.sin(angle) * 96;
      tl.add(
        el,
        {
          x: [Math.cos(angle) * 560, landX],
          y: [Math.sin(angle) * 420, landY],
          rotate: [i % 2 ? -100 : 100, (i % 2 ? 1 : -1) * (8 + i * 4)],
          scale: [0.4, 1],
          opacity: [0, 1],
          duration: 520,
          ease: "outBack",
        },
        i * 185
      );
    });
    tl.add(
      stickers,
      {
        scale: 0,
        opacity: 0,
        duration: 280,
        ease: "inBack",
        delay: stagger(40),
      },
      "+=550"
    );
    anims.push(tl);
    return () => anims.forEach((a) => a.revert());
  }, []);

  return (
    <div ref={ref} className="grid h-full place-items-center">
      <div className="relative grid place-items-center text-center">
        {VEND_STICKERS.map((name) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={name}
            src={stickerSrc(name)}
            alt=""
            aria-hidden
            data-fly
            data-rm-hide
            className="absolute h-12 w-12"
            style={{ opacity: 0 }}
            draggable={false}
          />
        ))}
        <div data-logo data-rm-show>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={stickerSrc("shape-sparkle-4pt")} alt="" aria-hidden className="mx-auto h-12 w-12" draggable={false} />
          <div className="ds-display mt-2 text-2xl">Shopstr</div>
          <div className="mt-1 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-text-subtle">
            Stocking the shelves
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================ 2 · STICKER SPILL (404) == */

const SPILL_STICKERS: StickerName[] = [
  ...VEND_STICKERS,
  "shape-hand",
  "shape-rainbow-arc",
  "shape-shooting-star",
  "badge-bff-star",
];

function SpillNotFound() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current!;
    if (applyReducedFallback(root)) return;
    const anims: Reverter[] = [];
    const stageH = root.clientHeight;

    els(root, "[data-drop]").forEach((el, i) => {
      anims.push(
        animate(el, {
          y: [-380, stageH - 96 - ((i * 37) % 74)],
          rotate: [0, ((i * 97) % 64) - 32],
          opacity: [1, 1],
          duration: 850,
          delay: i * 80,
          ease: "outBounce",
        })
      );
    });
    const tl = createTimeline();
    tl.add(
      els(root, "[data-headline]"),
      { scale: [1.6, 1], opacity: [0, 1], duration: 420, ease: "outExpo" },
      SPILL_STICKERS.length * 80 + 450
    ).add(
      els(root, "[data-cta]"),
      { y: [14, 0], opacity: [0, 1], duration: 320, ease: "outQuad" },
      "-=120"
    );
    anims.push(tl);
    return () => anims.forEach((a) => a.revert());
  }, []);

  return (
    <div ref={ref} className="relative h-full">
      {SPILL_STICKERS.map((name, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={name}
          src={stickerSrc(name)}
          alt=""
          aria-hidden
          data-drop
          data-rm-hide
          className="absolute top-0 h-14 w-14"
          style={{ left: `${6 + ((i * 53) % 84)}%`, transform: "translateY(-380px)" }}
          draggable={false}
        />
      ))}
      <div className="relative z-10 grid h-full place-items-center">
        <div className="text-center">
          <p data-headline data-rm-show className="ds-display text-4xl" style={{ opacity: 0 }}>
            Nothing here
          </p>
          <p data-headline data-rm-show className="mt-2 font-mono text-xs text-text-muted" style={{ opacity: 0 }}>
            404 · this page was never stocked.
          </p>
          <div data-cta data-rm-show className="mt-5" style={{ opacity: 0 }}>
            <Link href="/marketplace">
              <Button variant="secondary">Back to the market</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================= 3 · BLOCK SHUFFLE (boot) = */

const BLOCK_TONES = [
  "bg-orange", "bg-purple", "bg-yellow", "bg-ink", "bg-green",
  "bg-pink", "bg-blue", "bg-red", "bg-purple", "bg-yellow",
  "bg-green", "bg-ink", "bg-pink", "bg-orange", "bg-blue",
];
const COLS = 5;
const CELL = 64; // 56px block + 8px gap

function BlocksBoot() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current!;
    if (applyReducedFallback(root)) return;
    const blocks = els(root, "[data-block]");
    const tl = createTimeline({ loop: true, loopDelay: 300 });

    tl.add(blocks, {
      scale: [0, 1],
      duration: 420,
      ease: "outBack",
      delay: stagger(55, { grid: [COLS, 3], from: "center" }),
    });
    // Two waves of NEIGHBOR pair swaps (one cell of travel, no block swapped
    // twice): reads as a sliding puzzle, not a scatter.
    const swaps: [number, number][][] = [
      [[1, 6], [8, 13]],
      [[2, 3], [10, 11]],
    ];
    swaps.forEach((wave, w) => {
      wave.forEach(([a, b]) => {
        const dx = ((b % COLS) - (a % COLS)) * CELL;
        const dy = (Math.floor(b / COLS) - Math.floor(a / COLS)) * CELL;
        const pos = w === 0 ? "+=120" : "<<";
        tl.add(blocks[a], { x: [0, dx], y: [0, dy], duration: 480, ease: "inOutQuad" }, w === 0 && a === wave[0][0] ? "+=140" : "<<")
          .add(blocks[b], { x: [0, -dx], y: [0, -dy], duration: 480, ease: "inOutQuad" }, "<<");
        void pos;
      });
    });
    tl.add(
      blocks,
      {
        scale: [1, 0],
        duration: 300,
        ease: "inBack",
        delay: stagger(38, { grid: [COLS, 3], from: "last" }),
      },
      "+=520"
    );
    return () => { tl.revert(); };
  }, []);

  return (
    <div ref={ref} className="grid h-full place-items-center">
      <div className="text-center">
        <div
          className="grid justify-center gap-2"
          style={{ gridTemplateColumns: `repeat(${COLS}, 56px)` }}
        >
          {BLOCK_TONES.map((tone, i) => (
            <div
              key={i}
              data-block
              data-rm-show
              className={`h-14 w-14 rounded-md ${tone}`}
              style={{ opacity: 1, transform: "scale(0)" }}
            />
          ))}
        </div>
        <div className="ds-display mt-5 text-xl" data-rm-show>
          Shopstr
        </div>
        <div className="mt-1 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-text-subtle">
          Loading the market
        </div>
      </div>
    </div>
  );
}

/* =================================================== 3 · BLOCK GAP (404) === */

const GAP_INDEX = 7; // middle cell of the 5x3 grid

function BlocksNotFound() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current!;
    if (applyReducedFallback(root)) return;
    const anims: Reverter[] = [];
    const blocks = els(root, "[data-block]");

    const tl = createTimeline();
    tl.add(blocks, {
      scale: [0, 1],
      duration: 420,
      ease: "outBack",
      delay: stagger(50, { grid: [COLS, 3], from: "first" }),
    });
    // The neighbors lean toward the gap and give up.
    const nudges: Record<number, [number, number]> = {
      2: [0, 6], 6: [6, 0], 8: [-6, 0], 12: [0, -6],
    };
    Object.entries(nudges).forEach(([idx, [nx, ny]], i) => {
      tl.add(
        blocks[Number(idx) > GAP_INDEX ? Number(idx) - 1 : Number(idx)],
        { x: [0, nx, 0], y: [0, ny, 0], duration: 700, ease: "inOutQuad" },
        i === 0 ? "+=180" : "<<"
      );
    });
    tl.add(
      els(root, "[data-text]"),
      { y: [12, 0], opacity: [0, 1], duration: 380, ease: "outQuad", delay: stagger(90) },
      "-=200"
    );
    anims.push(tl);
    anims.push(
      animate(els(root, "[data-gap]"), {
        scale: [1, 1.06],
        duration: 800,
        ease: "inOutQuad",
        loop: true,
        alternate: true,
      })
    );
    return () => anims.forEach((a) => a.revert());
  }, []);

  return (
    <div ref={ref} className="grid h-full place-items-center">
      <div className="text-center">
        <div
          className="grid justify-center gap-2"
          style={{ gridTemplateColumns: `repeat(${COLS}, 56px)` }}
        >
          {BLOCK_TONES.map((tone, i) =>
            i === GAP_INDEX ? (
              <div
                key={i}
                data-gap
                className="grid h-14 w-14 place-items-center rounded-md border-2 border-dashed border-ink/40 bg-paper-2"
              >
                <span className="font-mono text-[0.72rem] font-bold text-text-muted">404</span>
              </div>
            ) : (
              <div
                key={i}
                data-block
                data-rm-show
                className={`h-14 w-14 rounded-md ${tone}`}
                style={{ transform: "scale(0)" }}
              />
            )
          )}
        </div>
        <p data-text data-rm-show className="ds-display mt-6 text-3xl" style={{ opacity: 0 }}>
          This page isn&apos;t here
        </p>
        <p data-text data-rm-show className="mt-1.5 font-mono text-xs text-text-muted" style={{ opacity: 0 }}>
          The shelf came up one block short.
        </p>
        <div data-text data-rm-show className="mt-5" style={{ opacity: 0 }}>
          <Link href="/marketplace">
            <Button variant="secondary">Back to the market</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ================================================= 5 · RECEIPT PRINT (boot) = */

const SCRAMBLE_POOL = "#%*+=<>/";

/** Timeline-friendly scramble: an object animation whose onUpdate resolves
    `final` left to right, filling the tail with pool characters. Honest lines
    only: each maps to a real data family the app actually loads. */
function addScramble(
  tl: ReturnType<typeof createTimeline>,
  el: HTMLElement,
  final: string,
  position: string | number
) {
  const obj = { p: 0 };
  tl.add(
    obj,
    {
      p: [0, 1],
      duration: 460,
      ease: "linear",
      onUpdate: () => {
        const n = Math.floor(obj.p * final.length);
        let out = final.slice(0, n);
        for (let i = n; i < final.length; i++) {
          out +=
            final[i] === " "
              ? " "
              : SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)];
        }
        el.textContent = out;
      },
    },
    position
  );
}

const BOOT_LINES: [string, string][] = [
  ["relays", "4 connected"],
  ["listings", "18 items"],
  ["profiles", "6 sellers"],
  ["wallet", "NIP-60 ready"],
  ["inbox", "2 unread"],
];

function ReceiptBoot() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current!;
    if (applyReducedFallback(root)) return;
    const slip = els(root, "[data-slip]");
    const tl = createTimeline({ loop: true, loopDelay: 600 });

    tl.add(slip, { y: [26, 0], opacity: [0, 1], duration: 380, ease: "outQuad" });
    els(root, "[data-line]").forEach((line, i) => {
      const value = line.querySelector<HTMLElement>("[data-value]")!;
      const final = value.dataset.final ?? "";
      tl.add(line, { opacity: [0, 1], duration: 120, ease: "linear" }, 400 + i * 480);
      addScramble(tl, value, final, "<<");
    });
    tl.add(
      els(root, "[data-ready]"),
      { scale: [0, 1], opacity: [0, 1], duration: 340, ease: "outBack" },
      "+=180"
    );
    tl.add(slip, { y: [0, -34], opacity: [1, 0], duration: 420, ease: "inQuad" }, "+=700");
    return () => { tl.revert(); };
  }, []);

  return (
    <div ref={ref} className="grid h-full place-items-center">
      <div
        data-slip
        data-rm-show
        className="w-[300px] rounded-md border-2 border-ink bg-paper px-5 py-4"
        style={{ opacity: 0 }}
      >
        <div className="flex items-center justify-between border-b-2 border-dashed border-ink/30 pb-2.5">
          <span className="ds-display text-sm">Shopstr</span>
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-text-subtle">
            boot receipt
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {BOOT_LINES.map(([label, value]) => (
            <div key={label} data-line data-rm-show className="flex items-baseline justify-between font-mono text-[0.72rem]" style={{ opacity: 0 }}>
              <span className="uppercase tracking-[0.08em] text-text-muted">{label}</span>
              <span data-value data-final={value} className="font-bold tabular-nums">
                {value}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t-2 border-dashed border-ink/30 pt-3 text-center">
          <span
            data-ready
            data-rm-show
            className="inline-block rounded-pill bg-ink px-4 py-1 font-mono text-[0.66rem] font-bold uppercase tracking-[0.12em] text-text-on-dark"
            style={{ opacity: 0 }}
          >
            Ready
          </span>
        </div>
      </div>
    </div>
  );
}

/* =================================================== 5 · RECEIPT TEAR (404) = */

const TEAR_LINES: [string, string][] = [
  ["searching", "0 results"],
  ["order", "#404"],
  ["status", "NOT FOUND"],
];

/** Jagged tear edges, 10 teeth. Top half keeps a zigzag bottom, the falling
    half gets the mirrored zigzag top. */
const TEETH = 10;
const zig = (down: boolean) => {
  const pts: string[] = [down ? "0% 0%" : "0% 100%"];
  for (let i = 0; i <= TEETH; i++) {
    const x = (i / TEETH) * 100;
    const y = i % 2 === 0 ? 92 : 100;
    pts.push(`${x}% ${down ? y : 100 - y}%`);
  }
  pts.push(down ? "100% 0%" : "100% 100%");
  return `polygon(${pts.join(",")})`;
};

function ReceiptNotFound() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current!;
    if (applyReducedFallback(root)) return;
    const tl = createTimeline();

    tl.add(els(root, "[data-slip]"), { y: [26, 0], opacity: [0, 1], duration: 380, ease: "outQuad" });
    els(root, "[data-line]").forEach((line, i) => {
      const value = line.querySelector<HTMLElement>("[data-value]")!;
      tl.add(line, { opacity: [0, 1], duration: 120, ease: "linear" }, 420 + i * 500);
      addScramble(tl, value, value.dataset.final ?? "", "<<");
    });
    // The tear: recoil on the kept half, the 404 half falls away.
    tl.add(els(root, "[data-keep]"), { rotate: [0, -2.5, 0], duration: 420, ease: "inOutQuad" }, "+=350")
      .add(
        els(root, "[data-fall]"),
        { y: [0, 210], rotate: [0, 14], opacity: [1, 0], duration: 780, ease: "in(1.6)" },
        "<<+=60"
      )
      .add(
        els(root, "[data-cta]"),
        { y: [14, 0], opacity: [0, 1], duration: 320, ease: "outQuad" },
        "-=300"
      );
    return () => { tl.revert(); };
  }, []);

  return (
    <div ref={ref} className="grid h-full place-items-center">
      <div data-slip data-rm-show className="w-[300px]" style={{ opacity: 0 }}>
        <div
          data-keep
          className="rounded-t-md border-2 border-b-0 border-ink bg-paper px-5 pb-5 pt-4"
          style={{ clipPath: zig(true) }}
        >
          <div className="flex items-center justify-between border-b-2 border-dashed border-ink/30 pb-2.5">
            <span className="ds-display text-sm">Shopstr</span>
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-text-subtle">
              page lookup
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {TEAR_LINES.map(([label, value]) => (
              <div key={label} data-line data-rm-show className="flex items-baseline justify-between font-mono text-[0.72rem]" style={{ opacity: 0 }}>
                <span className="uppercase tracking-[0.08em] text-text-muted">{label}</span>
                <span data-value data-final={value} className="font-bold tabular-nums">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div
          data-fall
          data-rm-hide
          className="-mt-1 border-2 border-t-0 border-ink bg-paper px-5 pb-4 pt-4 text-center"
          style={{ clipPath: zig(false) }}
        >
          <span className="ds-display text-2xl">404</span>
          <div className="mt-0.5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-text-muted">
            page not found
          </div>
        </div>
        <div data-cta data-rm-show className="mt-6 text-center" style={{ opacity: 0 }}>
          <Link href="/marketplace">
            <Button variant="secondary">Back to the market</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ==================================================================== PAGE = */

const CONCEPTS = [
  {
    id: "stickers",
    title: "2 · Sticker vending machine",
    blurb:
      "The marketplace physically shuffling goods: stickers fly onto the shelf one by one, then restock. The 404 is a spill: everything drops, and the headline stamps over the pile.",
    Boot: VendingBoot,
    NotFound: SpillNotFound,
    bootNote: "boot shell · stickers orbit in with outBack, restock loop",
    nfNote: "404 · outBounce drop, staggered 80ms, headline stamps at 1.6x -> 1",
  },
  {
    id: "blocks",
    title: "3 · Brutalist block shuffle",
    blurb:
      "Pure geometry, zero assets: accent blocks pop in on a grid stagger and swap places like a sliding puzzle. The 404 grid assembles with one cell missing; the neighbors lean toward the gap and give up.",
    Boot: BlocksBoot,
    NotFound: BlocksNotFound,
    bootNote: "boot shell · grid stagger from center, pair swaps, inBack exit",
    nfNote: "404 · the gap cell pulses; blocks nudge toward it and settle",
  },
  {
    id: "receipt",
    title: "5 · Receipt print",
    blurb:
      "A boot receipt prints line by line with a scramble resolve. Every line maps to a real data family (relays, listings, profiles, wallet, inbox), so the wait is explained honestly. The 404 prints the lookup, then tears: the half with the 404 falls away.",
    Boot: ReceiptBoot,
    NotFound: ReceiptNotFound,
    bootNote: "boot shell · scramble resolve per line, READY chip, tear-off loop",
    nfNote: "404 · zigzag clip-path tear, bottom half falls with in(1.6)",
  },
];

export default function LoadersPlayground() {
  const [keys, setKeys] = useState<Record<string, number>>({});
  const replay = (id: string) =>
    setKeys((k) => ({ ...k, [id]: (k[id] ?? 0) + 1 }));

  return (
    <>
      <Head><title>Loader concepts · Shopstr dev</title></Head>
      <main className="mx-auto max-w-[1100px] px-4 py-8 pb-24">
        <h1 className="ds-display text-3xl">Full-page loader concepts</h1>
        <p className="mt-2 max-w-[62ch] text-text-muted">
          Three concepts for the app boot shell and the 404, animated with anime.js v4.
          These are for the moments BEFORE any card geometry exists; in-content loading
          stays skeleton-only (see{" "}
          <Link href="/dev/states" className="font-bold text-purple underline">
            /dev/states
          </Link>
          ).
        </p>

        {CONCEPTS.map(({ id, title, blurb, Boot, NotFound, bootNote, nfNote }) => (
          <section key={id} className="mt-10">
            <h2 className="ds-display text-xl">{title}</h2>
            <p className="mt-1.5 max-w-[68ch] text-sm text-text-muted">{blurb}</p>
            <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Stage title="Boot" note={bootNote} onReplay={() => replay(`${id}-b`)}>
                <Boot key={keys[`${id}-b`] ?? 0} />
              </Stage>
              <Stage title="404" note={nfNote} onReplay={() => replay(`${id}-n`)}>
                <NotFound key={keys[`${id}-n`] ?? 0} />
              </Stage>
            </div>
          </section>
        ))}
      </main>
    </>
  );
}

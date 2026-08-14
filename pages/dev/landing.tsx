import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { SplitText } from "gsap/dist/SplitText";
import { Draggable } from "gsap/dist/Draggable";
import { useListings, useTopSellers, useCommunities } from "@/data/hooks";
import { groupInt } from "@/lib/format";
import { ListingCard } from "@/components/ListingCard";
import { Sticker } from "@/components/ui/Sticker";
import {
  Lightning, ArrowRight, ShieldCheck, Storefront, Wallet, ChatCircle,
  Package, ArrowsClockwise, SealCheck,
} from "@phosphor-icons/react";

/* =============================================================================
   /dev/landing — the marketing surface, playground build.

   Sticker Brutalism at full volume: ink strokes, accent full-bleeds, Archivo
   Black shouting in uppercase, stickers used as decoration AND as controls.
   Motion is GSAP + ScrollTrigger, and every effect is inside one
   gsap.context() scoped to the page root so it reverts cleanly on unmount
   (no @gsap/react in this repo, so this is the sanctioned pattern).

   Reduced motion is honoured by gsap.matchMedia: the reduced branch sets the
   end state and registers nothing.
   ========================================================================== */

const STEPS = [
  {
    n: "01",
    title: "Find it",
    body: "Browse a market priced in sats. No card, no bank, no account until you pay.",
    icon: Storefront,
    bg: "bg-yellow",
  },
  {
    n: "02",
    title: "Ask first",
    body: "Message the seller with the listing attached. Moderated communities vouch for the good ones.",
    icon: ChatCircle,
    bg: "bg-blue",
  },
  {
    n: "03",
    title: "Pay in sats",
    body: "Lightning or Cashu, peer to peer. Your key is the account. Shopstr holds nothing.",
    icon: Lightning,
    bg: "bg-green",
  },
];

/* Tailwind v4 extracts classes statically, so tone classes must be literal
   strings here — `bg-${tone}` would never be generated. */
const TONE_BG: Record<string, string> = {
  purple: "bg-purple text-on-purple",
  pink: "bg-pink",
  yellow: "bg-yellow",
  green: "bg-green",
  blue: "bg-blue",
};

const TRUST = [
  { icon: ShieldCheck, label: "Moderated communities", sub: "Posts reviewed before they appear" },
  { icon: SealCheck, label: "Verified identities", sub: "nip05, not an email address" },
  { icon: Package, label: "Real goods", sub: "Ceramics, film cameras, zines, coffee" },
  { icon: Wallet, label: "Your sats, your keys", sub: "Cashu wallet built in" },
];

export default function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const { data: listings } = useListings();
  const { data: sellers } = useTopSellers(4);
  const { data: communities } = useCommunities();
  const [satsMoved, setSatsMoved] = useState(0);

  const featured = listings.slice(0, 4);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, SplitText, Draggable);

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // ---- Reduced motion: paint the end state, animate nothing. ----
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".ls-reveal, .ls-step, .ls-card, .ls-trust, .ls-comm", {
          opacity: 1,
          y: 0,
          clearProps: "transform",
        });
        setSatsMoved(41_200_000);
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        /* ---- 1. Hero: split the headline, rise the words in ---- */
        const split = new SplitText(".ls-hero-title", { type: "words,chars" });
        gsap.from(split.chars, {
          yPercent: 120,
          opacity: 0,
          duration: 0.5,
          ease: "power3.out",
          stagger: 0.012,
        });
        gsap.from(".ls-hero-sub, .ls-hero-cta, .ls-hero-ticker", {
          y: 18,
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.08,
          delay: 0.35,
        });

        // Hero stickers drift in, then become draggable toys.
        gsap.from(".ls-toy", {
          scale: 0,
          rotate: -60,
          opacity: 0,
          duration: 0.6,
          ease: "back.out(1.6)",
          stagger: 0.07,
          delay: 0.5,
        });
        Draggable.create(".ls-toy", { bounds: ".ls-hero", inertia: false });

        /* ---- 2. Marquee bands: seamless, opposing directions ---- */
        gsap.to(".ls-marquee-track", {
          xPercent: -50,
          ease: "none",
          duration: 18,
          repeat: -1,
        });
        gsap.to(".ls-marquee-track-rev", {
          xPercent: 50,
          ease: "none",
          duration: 22,
          repeat: -1,
        });

        /* ---- 3. Steps: pin the section, scrub the cards across ---- */
        const stepTrack = document.querySelector<HTMLElement>(".ls-step-track");
        if (stepTrack) {
          gsap.to(stepTrack, {
            // Scroll exactly the overflow width, no further.
            x: () => -(stepTrack.scrollWidth - window.innerWidth + 64),
            ease: "none", // required for 1:1 scroll mapping
            scrollTrigger: {
              trigger: ".ls-steps",
              start: "top top",
              end: () => `+=${stepTrack.scrollWidth}`,
              pin: true,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });
        }

        /* ---- 4. Listing cards: batched stagger as they enter ----
           These sit BELOW the pinned steps section, whose pin spacer adds
           ~3000px of scroll height after these triggers are created. Their
           start positions are therefore stale until the ScrollTrigger.refresh()
           at the end of this block; without it the cards never fire and the
           whole section stays blank. (batch() rejects refreshPriority.) */
        gsap.set(".ls-card", { opacity: 0, y: 28 });
        ScrollTrigger.batch(".ls-card", {
          start: "top 88%",
          onEnter: (batch) =>
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: "power2.out",
              stagger: 0.09,
              overwrite: true,
            }),
        });

        /* ---- 5. The loop: draw the circular-economy path ---- */
        const path = document.querySelector<SVGPathElement>(".ls-loop-path");
        if (path) {
          const len = path.getTotalLength();
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
          gsap.to(path, {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
              trigger: ".ls-loop",
              start: "top 70%",
              end: "bottom 65%",
              scrub: 1,
            },
          });
        }
        gsap.from(".ls-loop-node", {
          scale: 0,
          opacity: 0,
          duration: 0.45,
          ease: "back.out(2)",
          stagger: 0.18,
          scrollTrigger: { trigger: ".ls-loop", start: "top 60%" },
        });

        /* ---- 6. Sats counter: count up once, on entry ---- */
        const counter = { v: 0 };
        gsap.to(counter, {
          v: 41_200_000,
          duration: 2,
          ease: "power2.out",
          onUpdate: () => setSatsMoved(Math.round(counter.v)),
          scrollTrigger: { trigger: ".ls-counter", start: "top 75%", once: true },
        });

        /* ---- 7. Generic rise-ins for the remaining blocks ---- */
        gsap.utils.toArray<HTMLElement>(".ls-reveal").forEach((el) => {
          gsap.from(el, {
            y: 28,
            opacity: 0,
            duration: 0.55,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        });
        gsap.from(".ls-trust", {
          y: 22,
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.08,
          scrollTrigger: { trigger: ".ls-trust-grid", start: "top 85%" },
        });
        gsap.from(".ls-comm", {
          scale: 0.94,
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.1,
          scrollTrigger: { trigger: ".ls-comm-grid", start: "top 85%" },
        });

        // The pin above changes total page height, so every trigger below it
        // needs its start/end recomputed against the final layout. Images and
        // fonts land late too, hence the second pass.
        ScrollTrigger.refresh();
        const onLoad = () => ScrollTrigger.refresh();
        window.addEventListener("load", onLoad);
        return () => window.removeEventListener("load", onLoad);
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <Head>
        <title>Shopstr · Buy and sell for sats</title>
        <meta
          name="description"
          content="A marketplace for real goods priced in sats. Nostr identity, Lightning and Cashu payments, moderated communities."
        />
      </Head>

      <div ref={root} className="overflow-x-clip bg-paper">
        {/* ================= 1. HERO ================= */}
        <section className="ls-hero relative overflow-hidden border-b-2 border-ink bg-purple px-5 pb-16 pt-6 text-on-purple md:px-8 lg:pb-24 lg:pt-8">
          <nav className="mx-auto flex max-w-[1240px] items-center justify-between">
            <span className="ds-display inline-flex items-center text-xl text-on-purple">
              SH
              <Sticker name="shape-sparkle-4pt" className="mx-0.5 inline-block h-[0.8em] w-auto" />
              PSTR
            </span>
            <Link
              href="/marketplace"
              className="ds-press inline-flex items-center gap-1.5 rounded-pill border-2 border-ink bg-paper-pure px-4 py-2 text-sm font-bold text-ink"
            >
              Open the market <ArrowRight size={15} weight="bold" />
            </Link>
          </nav>

          {/* Draggable sticker toys, desktop only so they never fight a thumb. */}
          {/* Kept in the right-hand gutter beside the headline's short lines, so
              a drifting sticker never lands on the type. */}
          <Sticker name="shape-starburst" className="ls-toy pointer-events-auto absolute right-[7%] top-[16%] hidden h-24 w-24 cursor-grab active:cursor-grabbing lg:block" />
          <Sticker name="shape-daisy-yellow" className="ls-toy pointer-events-auto absolute right-[22%] top-[38%] hidden h-20 w-20 cursor-grab active:cursor-grabbing xl:block" />
          <Sticker name="shape-heart-circle" className="ls-toy pointer-events-auto absolute bottom-[26%] right-[11%] hidden h-16 w-16 cursor-grab active:cursor-grabbing lg:block" />

          <div className="mx-auto mt-12 max-w-[1240px] lg:mt-20">
            <h1 className="ls-hero-title ds-display max-w-[12ch] text-[3rem] leading-[0.86] text-on-purple sm:text-[4.5rem] lg:text-[6rem]">
              Spend your bitcoin on something real.
            </h1>
            <p className="ls-hero-sub mt-6 max-w-[46ch] text-lg leading-snug text-on-purple-muted lg:text-xl">
              A marketplace priced in sats, run on Nostr. Mugs, film cameras, riso zines,
              coffee. Bought from people, not platforms.
            </p>

            <div className="ls-hero-cta mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/marketplace"
                className="ds-press inline-flex items-center gap-2 rounded-pill border-2 border-ink bg-yellow px-7 py-4 text-lg font-bold text-ink"
              >
                <Lightning size={20} weight="fill" /> Start browsing
              </Link>
              <Link
                href="/sell/mine"
                className="ds-press inline-flex items-center gap-2 rounded-pill border-2 border-ink bg-paper-pure px-7 py-4 text-lg font-bold text-ink"
              >
                Sell something
              </Link>
            </div>

            {/* Live-ish ticker: real listings, real prices. */}
            <div className="ls-hero-ticker mt-12 overflow-hidden rounded-xl border-2 border-ink bg-ink/25">
              <div className="ls-marquee-track flex w-max gap-8 py-3">
                {[...featured, ...featured, ...featured, ...featured].map((p, i) => (
                  <span key={`${p.id}-${i}`} className="flex shrink-0 items-center gap-2.5 font-mono text-sm text-on-purple">
                    <span className="h-1.5 w-1.5 rounded-full bg-green" />
                    {p.title}
                    <b className="tabular-nums">{groupInt(p.price)}</b>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= 2. MARQUEE BAND ================= */}
        <section className="overflow-hidden border-b-2 border-ink bg-ink py-3.5">
          <div className="ls-marquee-track-rev flex w-max gap-6">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className="ds-display flex shrink-0 items-center gap-6 text-2xl text-text-on-dark lg:text-3xl">
                BUY WITH SATS
                <Sticker name="shape-sunstar-yellow" className="h-7 w-7" />
                SELL FOR SATS
                <Sticker name="shape-smiley" className="h-7 w-7" />
                KEEP THE LOOP
                <Sticker name="shape-sparkle-4pt" className="h-7 w-7" />
              </span>
            ))}
          </div>
        </section>

        {/* ================= 3. HOW IT WORKS (pinned, horizontal) ================= */}
        <section className="ls-steps relative flex h-screen flex-col justify-center overflow-hidden border-b-2 border-ink bg-paper-2">
          <div className="mx-auto w-full max-w-[1240px] px-5 md:px-8">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-text-muted">
              How it works
            </p>
            <h2 className="ds-display mt-2 max-w-[22ch] text-[2.2rem] leading-[0.9] lg:text-[3.4rem]">
              Three steps, no bank in sight.
            </h2>
          </div>

          <div className="ls-step-track mt-10 flex w-max gap-6 px-5 md:px-8">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <article
                  key={s.n}
                  className={`ls-step flex w-[78vw] max-w-[420px] shrink-0 flex-col rounded-2xl border-2 border-ink p-7 ${s.bg}`}
                  style={{ minHeight: 300 }}
                >
                  <div className="flex items-start justify-between">
                    <span className="ds-display text-[3.5rem] leading-none">{s.n}</span>
                    <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-ink bg-paper-pure">
                      <Icon size={26} weight="bold" />
                    </span>
                  </div>
                  <h3 className="ds-display mt-6 text-3xl">{s.title}</h3>
                  <p className="mt-2.5 max-w-[34ch] leading-snug">{s.body}</p>
                </article>
              );
            })}
            {/* Tail card: the payoff of the three steps. */}
            <article className="ls-step flex w-[78vw] max-w-[420px] shrink-0 flex-col justify-center gap-4 rounded-2xl border-2 border-ink bg-ink p-7 text-text-on-dark" style={{ minHeight: 300 }}>
              <Sticker name="shape-sun-rays" className="h-16 w-16" />
              <h3 className="ds-display text-3xl">That&apos;s the whole flow.</h3>
              <Link
                href="/marketplace"
                className="ds-press inline-flex w-fit items-center gap-2 rounded-pill border-2 border-ink bg-yellow px-6 py-3 font-bold text-ink"
              >
                Try it <ArrowRight size={16} weight="bold" />
              </Link>
            </article>
          </div>
        </section>

        {/* ================= 4. LIVE MARKETPLACE ================= */}
        <section className="border-b-2 border-ink bg-paper px-5 py-16 md:px-8 lg:py-24">
          <div className="mx-auto max-w-[1240px]">
            <div className="ls-reveal flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-text-muted">
                  On the shelves now
                </p>
                <h2 className="ds-display mt-2 max-w-[20ch] text-[2.2rem] leading-[0.9] lg:text-[3.4rem]">
                  Real things, real sats.
                </h2>
              </div>
              <Link href="/marketplace" className="font-bold text-purple underline">
                See everything →
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {featured.map((p) => (
                <div key={p.id} className="ls-card">
                  <ListingCard product={p} density="tile" />
                </div>
              ))}
            </div>

            {/* Trust row: why buying from a stranger for sats is safe. */}
            <div className="ls-trust-grid mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {TRUST.map((t) => {
                const Icon = t.icon;
                return (
                  <div key={t.label} className="ls-trust rounded-xl border-2 border-ink bg-paper-pure p-4">
                    <Icon size={24} weight="bold" />
                    <p className="mt-3 font-bold leading-tight">{t.label}</p>
                    <p className="mt-1 font-mono text-[0.68rem] leading-snug text-text-muted">{t.sub}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= 5. THE CIRCULAR ECONOMY LOOP ================= */}
        <section className="ls-loop overflow-hidden border-b-2 border-ink bg-orange px-5 py-16 md:px-8 lg:py-24">
          <div className="mx-auto max-w-[1240px]">
            <p className="ls-reveal font-mono text-[0.72rem] uppercase tracking-[0.18em]">
              The circular economy
            </p>
            <h2 className="ls-reveal ds-display mt-2 max-w-[24ch] text-[2.2rem] leading-[0.9] lg:text-[3.4rem]">
              Sats that come in should go back out.
            </h2>
            <p className="ls-reveal mt-4 max-w-[52ch] text-lg leading-snug">
              Sell a thing, get paid in sats, spend them on the next thing. The loop only
              works if earning and spending live in the same place.
            </p>

            <div className="relative mt-12">
              {/* The loop drawn as one stroked path; nodes pop in along it. */}
              <svg viewBox="0 0 900 260" className="w-full" aria-hidden>
                <path
                  className="ls-loop-path"
                  d="M120 190 C 120 60, 330 60, 450 130 C 570 200, 780 200, 780 70"
                  fill="none"
                  stroke="var(--ds-ink)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-between">
                {[
                  { icon: Storefront, label: "Sell" },
                  { icon: Wallet, label: "Get sats" },
                  { icon: ArrowsClockwise, label: "Spend" },
                ].map((n) => {
                  const Icon = n.icon;
                  return (
                    <div key={n.label} className="ls-loop-node flex flex-col items-center gap-2">
                      <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-ink bg-paper-pure lg:h-20 lg:w-20">
                        <Icon size={28} weight="bold" />
                      </span>
                      <span className="ds-display text-lg">{n.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ================= 6. SATS MOVED COUNTER ================= */}
        <section className="ls-counter border-b-2 border-ink bg-ink px-5 py-16 text-text-on-dark md:px-8 lg:py-20">
          <div className="mx-auto flex max-w-[1240px] flex-col items-center gap-3 text-center">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-text-on-dark-muted">
              Sats moved through Shopstr
            </p>
            <p className="ds-value text-[3rem] font-bold leading-none tabular-nums lg:text-[6rem]">
              {groupInt(satsMoved)}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-sm text-text-on-dark-muted">
              <span className="tabular-nums">{groupInt(sellers.length * 37 + 128)} sellers</span>
              <span className="tabular-nums">{groupInt(listings.length)} live listings</span>
              <span className="tabular-nums">{groupInt(communities.length)} communities</span>
            </div>
          </div>
        </section>

        {/* ================= 7. COMMUNITIES + FINAL CTA ================= */}
        <section className="border-b-2 border-ink bg-paper px-5 py-16 md:px-8 lg:py-24">
          <div className="mx-auto max-w-[1240px]">
            <div className="ls-reveal">
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-text-muted">
                Moderated communities
              </p>
              <h2 className="ds-display mt-2 max-w-[24ch] text-[2.2rem] leading-[0.9] lg:text-[3.4rem]">
                Find the people who care about the craft.
              </h2>
            </div>

            <div className="ls-comm-grid mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
              {communities.slice(0, 3).map((c) => (
                <Link
                  key={c.slug}
                  href={`/communities/${c.slug}`}
                  className={`ls-comm ds-press flex min-h-[170px] flex-col justify-between rounded-2xl border-2 border-ink p-5 ${TONE_BG[c.tone]}`}
                >
                  <ShieldCheck size={24} weight="bold" />
                  <div>
                    <p className="ds-display text-xl leading-[0.95]">{c.name}</p>
                    <p className="mt-1.5 font-mono text-[0.68rem] tabular-nums opacity-80">
                      {groupInt(c.memberCount)} members · every post reviewed
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Final CTA */}
            <div className="ls-reveal relative mt-14 overflow-hidden rounded-2xl border-2 border-ink bg-pink p-8 text-center lg:p-14">
              {/* Fully inside the card: a sticker clipped by the frame reads as
                  a rendering bug, not a deliberate overlap. */}
              <Sticker name="shape-sunstar-purple" className="pointer-events-none absolute left-4 top-4 h-20 w-20 rotate-12" />
              <Sticker name="shape-daisy-pair" className="pointer-events-none absolute bottom-4 right-4 h-20 w-20" />
              <h2 className="ds-display relative mx-auto max-w-[20ch] text-[2.2rem] leading-[0.9] lg:text-[3.6rem]">
                Your sats are worth more spent.
              </h2>
              <p className="relative mx-auto mt-4 max-w-[44ch] text-lg leading-snug">
                No signup wall. Browse first, make a key when you pay.
              </p>
              <Link
                href="/marketplace"
                className="ds-press relative mt-7 inline-flex items-center gap-2 rounded-pill border-2 border-ink bg-ink px-8 py-4 text-lg font-bold text-text-on-dark"
              >
                <Lightning size={20} weight="fill" /> Open the market
              </Link>
            </div>
          </div>
        </section>

        <footer className="bg-paper px-5 py-10 md:px-8">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 font-mono text-[0.7rem] text-text-muted">
            <span className="ds-display inline-flex items-center text-base text-ink">
              SH
              <Sticker name="shape-sparkle-4pt" className="mx-0.5 inline-block h-[0.8em] w-auto" />
              PSTR
            </span>
            <span>Bitcoin-only. Nostr-native. Nothing held in custody.</span>
          </div>
        </footer>
      </div>
    </>
  );
}

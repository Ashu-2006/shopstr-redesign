import Link from "next/link";
import type { ProductData } from "@/data/types";
import { primaryCategory, priceLabel, toneBg, type Tone } from "@/lib/catalog";
import { Sticker } from "@/components/ui/Sticker";

/* The editorial slot. One job: carry an argument, break the browse rhythm.
   Two formats, both rare by design (a break card in every viewport stops
   breaking anything):
   - "hero":  overlay-bottom + numeral, for the featured carousel (H1).
   - "break": full-bleed accent with an inset framed photo, one per feed (H4).
   Replaces HeroCard and BreakCard; CategoryFeature and FeaturedTile are
   retired (dead code, same job). */

export function FeatureCard({
  product,
  format,
  n = 1,
  kicker = "Featured",
  tone = "green",
}: {
  product: ProductData;
  format: "hero" | "break";
  /** hero only: carousel position, rendered as the big numeral. */
  n?: number;
  /** break only: the editorial claim ("Editor's pick", "Trending in zines"). */
  kicker?: string;
  /** break only: accent background. Text stays ink on every accent. */
  tone?: Tone;
}) {
  return format === "hero" ? (
    <HeroFormat product={product} n={n} />
  ) : (
    <BreakFormat product={product} kicker={kicker} tone={tone} />
  );
}

/* ---- format="hero" --------------------------------------------------------- */
function HeroFormat({ product, n }: { product: ProductData; n: number }) {
  return (
    <Link
      href={`/listing/${product.id}`}
      className="group relative block h-[360px] w-full shrink-0 basis-full snap-center overflow-hidden text-white md:h-[440px]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.images[0]}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-(--ds-dur-slow) ease-smooth motion-safe:group-hover:scale-[1.05]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(transparent_38%,rgba(0,0,0,0.85))]" />
      <span className="ds-display absolute left-5 top-4 z-10 text-5xl mix-blend-difference lg:left-8 lg:text-6xl">
        {String(n).padStart(2, "0")}
      </span>
      <span className="absolute right-5 top-5 z-10 inline-flex rounded-pill border-2 border-ink bg-ink px-2.5 py-1 text-xs font-semibold text-white">
        {primaryCategory(product)}
      </span>
      <Sticker name="badge-bff-star" className="absolute right-5 top-[60px] z-10 h-12 w-12" />
      <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-[1240px] p-5 md:p-8">
        <h3 className="ds-display text-[1.9rem] leading-[0.92] md:text-4xl lg:text-5xl">{product.title}</h3>
        <div className="mt-2.5 flex items-baseline justify-between">
          <span className="font-mono text-xl font-bold tabular-nums lg:text-2xl">{priceLabel(product)}</span>
          <span className="font-mono text-[0.78rem] opacity-85">{product.location}</span>
        </div>
      </div>
    </Link>
  );
}

/* ---- format="break" --------------------------------------------------------
   Mobile: stacked (kicker / photo / title / price). At lg it spans two feed
   columns, so it becomes a split composition: text left, taller photo right. */
function BreakFormat({
  product,
  kicker,
  tone,
}: {
  product: ProductData;
  kicker: string;
  tone: Tone;
}) {
  return (
    <Link
      href={`/listing/${product.id}`}
      className={`group lift flex flex-col rounded-xl border-2 border-ink p-4 lg:grid lg:grid-cols-2 lg:gap-x-7 lg:p-6 ${toneBg(tone)}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[0.64rem] uppercase tracking-[0.1em]">{kicker}</span>
        <span className="inline-flex rounded-pill border-2 border-ink bg-ink px-2.5 py-1 text-xs font-semibold text-white lg:hidden">
          {primaryCategory(product)}
        </span>
      </div>
      <div className="my-3.5 h-[190px] overflow-hidden rounded-lg border-2 border-ink lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:my-0 lg:h-[240px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0]}
          alt=""
          className="h-full w-full object-cover transition-transform duration-(--ds-dur-slow) ease-smooth motion-safe:group-hover:scale-[1.06]"
        />
      </div>
      <h3 className="ds-display text-[1.4rem] leading-[0.92] lg:row-start-2 lg:self-center lg:text-3xl">
        {product.title}
      </h3>
      <div className="mt-1.5 flex items-baseline justify-between lg:row-start-3 lg:mt-0 lg:self-end">
        <span className="font-mono text-[1.1rem] font-bold tabular-nums lg:text-[1.3rem]">{priceLabel(product)}</span>
        <span className="font-mono text-[0.74rem]">{product.location}</span>
      </div>
    </Link>
  );
}

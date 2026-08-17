import Link from "next/link";
import type { ProductData } from "@/data/types";
import { primaryCategory, priceLabel, toneBg, type Tone } from "@/lib/catalog";
import { Sticker } from "@/components/ui/Sticker";

/* The editorial slot. One job: carry an argument, break the browse rhythm.
   Three formats, all rare by design (a break card in every viewport stops
   breaking anything):
   - "hero":      overlay-bottom + numeral, for the featured carousel (H1).
   - "break":     full-bleed accent with an inset framed photo, one per feed (H4).
   - "spotlight": split on purple with a CTA, the category feature (H2).
   Replaces HeroCard, BreakCard and CategoryFeature; FeaturedTile is retired
   (dead code, same job). */

export function FeatureCard({
  product,
  format,
  n = 1,
  kicker = "Featured",
  tone = "green",
  title,
  href,
  cta = "View item",
}: {
  product: ProductData;
  format: "hero" | "break" | "spotlight";
  /** hero only: carousel position, rendered as the big numeral. */
  n?: number;
  /** break/spotlight: the editorial claim ("Editor's pick", "Spotlight · Ceramics"). */
  kicker?: string;
  /** break only: accent background. Text stays ink on every accent. */
  tone?: Tone;
  /** spotlight only: headline override (defaults to the product title). */
  title?: string;
  /** spotlight only: destination override (defaults to the listing). */
  href?: string;
  /** spotlight only: CTA label on the white pill. */
  cta?: string;
}) {
  if (format === "hero") return <HeroFormat product={product} n={n} />;
  if (format === "spotlight")
    return <SpotlightFormat product={product} kicker={kicker} title={title} href={href} cta={cta} />;
  return <BreakFormat product={product} kicker={kicker} tone={tone} />;
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
      <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-(--ds-measure) p-5 md:p-8">
        <h3 className="ds-display text-[1.9rem] leading-[0.92] md:text-4xl lg:text-5xl">{product.title}</h3>
        <div className="mt-2.5 flex items-baseline justify-between">
          <span className="font-mono text-xl font-bold tabular-nums lg:text-2xl">{priceLabel(product)}</span>
          <span className="font-mono text-[0.78rem] opacity-85">{product.location}</span>
        </div>
      </div>
    </Link>
  );
}

/* ---- format="spotlight" -----------------------------------------------------
   Split composition, text on purple (the one accent that takes white text),
   white pill CTA. The category spotlight slot. */
function SpotlightFormat({
  product,
  kicker,
  title,
  href,
  cta,
}: {
  product: ProductData;
  kicker: string;
  title?: string;
  href?: string;
  cta: string;
}) {
  return (
    <Link
      href={href ?? `/listing/${product.id}`}
      // The image takes the extra width as the viewport grows; the copy pane is
      // capped. A 50/50 split left a huge empty purple field on wide screens.
      className="group lift grid h-[220px] grid-cols-[1fr_minmax(0,340px)] overflow-hidden rounded-xl border-2 border-ink bg-purple text-on-purple lg:h-[260px] lg:grid-cols-[1fr_minmax(0,420px)]"
    >
      <div className="h-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0]}
          alt=""
          className="h-full w-full object-cover transition-transform duration-(--ds-dur-slow) ease-smooth motion-safe:group-hover:scale-[1.06]"
        />
      </div>
      <div className="flex flex-col justify-between p-[18px]">
        <span className="font-mono text-[0.64rem] uppercase tracking-[0.1em] text-on-purple-muted">{kicker}</span>
        <h3 className="ds-display mt-auto text-2xl leading-[0.92]">{title ?? product.title}</h3>
        <span className="mt-2 font-mono text-[1.05rem] font-bold tabular-nums">from {priceLabel(product)}</span>
        <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-pill bg-white px-4 py-2 text-sm font-bold text-purple">
          {cta} →
        </span>
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
      {/* gap-x-3 + wrap: at half width (the 2-up picks band) the column can be
          exactly as wide as its content, which collapses justify-between to
          zero and welds the price to the location. The floor gap keeps them
          apart; wrapping drops the location below on the narrowest cards. */}
      <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 lg:row-start-3 lg:mt-0 lg:self-end">
        <span className="font-mono text-[1.1rem] font-bold tabular-nums lg:text-[1.3rem]">{priceLabel(product)}</span>
        <span className="font-mono text-[0.74rem]">{product.location}</span>
      </div>
    </Link>
  );
}

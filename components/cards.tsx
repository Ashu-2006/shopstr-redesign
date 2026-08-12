import Link from "next/link";
import type { ProductData, Profile } from "@/data/types";
import { compactSats } from "@/lib/format";
import {
  catMeta,
  toneBg,
  primaryType,
  primaryCategory,
  tintFor,
  priceLabel,
  type Tone,
} from "@/lib/catalog";
import { Sticker, type StickerName } from "@/components/ui/Sticker";
import { Star, SealCheck, ArrowUpRight } from "@phosphor-icons/react";

/* The chosen card system, ported from the prototype. All pure presentation:
   props in, JSX out. Each links into the app via next/link. */

/* ---- H1: featured carousel item (overlay-bottom + numeral) ---------------- */
export function HeroCard({ product, n }: { product: ProductData; n: number }) {
  return (
    <Link
      href={`/listing/${product.id}`}
      className="group relative block h-[360px] w-full shrink-0 basis-full snap-center overflow-hidden text-white md:h-[440px]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.images[0]} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-(--ds-dur-slow) ease-smooth motion-safe:group-hover:scale-[1.05]" />
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

/* ---- H2: split, text on purple (category / listing spotlight) ------------- */
export function CategoryFeature({
  product,
  title,
  kicker,
  href,
  cta,
}: {
  product: ProductData;
  title: string;
  kicker: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group lift grid h-[220px] grid-cols-[1fr_1.05fr] overflow-hidden rounded-xl border-2 border-ink bg-purple text-on-purple"
    >
      <div className="h-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.images[0]} alt="" className="h-full w-full object-cover transition-transform duration-(--ds-dur-slow) ease-smooth motion-safe:group-hover:scale-[1.06]" />
      </div>
      <div className="flex flex-col justify-between p-[18px]">
        <span className="font-mono text-[0.64rem] uppercase tracking-[0.1em] text-on-purple-muted">{kicker}</span>
        <h3 className="ds-display mt-auto text-2xl leading-[0.92]">{title}</h3>
        <span className="mt-2 font-mono text-[1.05rem] font-bold tabular-nums">from {priceLabel(product)}</span>
        <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-pill bg-white px-4 py-2 text-sm font-bold text-purple">
          {cta} →
        </span>
      </div>
    </Link>
  );
}

/* ---- H4: full-bleed accent, inset photo (mid-feed break card) -------------
   Mobile: stacked (kicker / photo / title / price). Desktop spans two feed
   columns, so the photo letterboxes badly if it stays full-width; at lg the
   card becomes a split composition: text left, taller inset photo right. */
export function BreakCard({ product, kicker }: { product: ProductData; kicker: string }) {
  return (
    <Link
      href={`/listing/${product.id}`}
      className="group lift flex flex-col rounded-xl border-2 border-ink bg-green p-4 text-ink lg:grid lg:grid-cols-2 lg:gap-x-7 lg:p-6"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[0.64rem] uppercase tracking-[0.1em]">{kicker}</span>
        <span className="inline-flex rounded-pill border-2 border-ink bg-ink px-2.5 py-1 text-xs font-semibold text-white lg:hidden">
          {primaryCategory(product)}
        </span>
      </div>
      <div className="my-3.5 h-[190px] overflow-hidden rounded-lg border-2 border-ink lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:my-0 lg:h-[240px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.images[0]} alt="" className="h-full w-full object-cover transition-transform duration-(--ds-dur-slow) ease-smooth motion-safe:group-hover:scale-[1.06]" />
      </div>
      <h3 className="ds-display text-[1.4rem] leading-[0.92] lg:row-start-2 lg:self-center lg:text-3xl">{product.title}</h3>
      <div className="mt-1.5 flex items-baseline justify-between lg:row-start-3 lg:mt-0 lg:self-end">
        <span className="font-mono text-[1.1rem] font-bold tabular-nums lg:text-[1.3rem]">{priceLabel(product)}</span>
        <span className="font-mono text-[0.74rem]">{product.location}</span>
      </div>
    </Link>
  );
}

/* ---- H5: wide editorial w/ description (DEFAULT list card) ----------------- */
export function ListCard({
  product,
  rating,
}: {
  product: ProductData;
  rating?: { avg: number; count: number };
}) {
  const type = primaryType(product);
  return (
    <Link
      href={`/listing/${product.id}`}
      className="group lift grid min-h-[158px] grid-cols-[42%_1fr] overflow-hidden rounded-lg border-2 border-ink bg-paper-pure"
    >
      <div className={`overflow-hidden border-r-2 border-ink ${tintFor(product)}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.images[0]} alt={product.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-(--ds-dur-slow) ease-smooth motion-safe:group-hover:scale-[1.06]" style={{ outline: "1px solid rgba(0,0,0,0.06)", outlineOffset: "-1px" }} />
      </div>
      <div className="flex flex-col p-3.5">
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          <span
            className={`inline-flex rounded-pill border-2 border-ink px-2.5 py-0.5 text-xs font-semibold ${
              type ? "bg-ink text-white" : "bg-green text-ink"
            }`}
          >
            {type ?? product.condition ?? "New"}
          </span>
          <span className="inline-flex rounded-pill border-2 border-ink bg-paper-pure px-2.5 py-0.5 text-xs font-semibold">
            {primaryCategory(product)}
          </span>
        </div>
        <h3 className="ds-display line-clamp-2 text-[1.12rem] leading-[0.95]">{product.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-[0.8rem] leading-snug text-text-muted">{product.summary}</p>
        <div className="mt-auto flex items-center justify-between pt-2.5">
          <span className="font-mono text-[1.15rem] font-bold tabular-nums">{priceLabel(product)}</span>
          <span className="inline-flex items-center gap-1 font-mono text-[0.66rem] text-text-subtle">
            {rating && rating.count > 0 && (
              <>
                <Star weight="fill" size={12} aria-hidden />
                {`${rating.avg.toFixed(1)} · `}
              </>
            )}
            {product.location}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ---- P1: roomy, price chip (near-you horizontal scroll) ------------------- */
export function NearCard({ product }: { product: ProductData }) {
  return (
    <Link
      href={`/listing/${product.id}`}
      className="group lift block w-[200px] shrink-0 snap-start overflow-hidden rounded-lg border-2 border-ink bg-paper-pure"
    >
      <div className={`h-[150px] overflow-hidden ${tintFor(product)}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.images[0]} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-(--ds-dur-slow) ease-smooth motion-safe:group-hover:scale-[1.06]" />
      </div>
      <div className="p-3.5">
        <div className="line-clamp-2 text-[0.92rem] font-bold leading-tight">{product.title}</div>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="rounded-pill border-2 border-ink bg-yellow px-2.5 py-1 font-mono text-[0.82rem] font-bold tabular-nums">
            {priceLabel(product)}
          </span>
          <span className="font-mono text-[0.64rem] text-text-subtle">{product.location}</span>
        </div>
      </div>
    </Link>
  );
}

/* ---- Solid compact: category tile ---------------------------------------- */
export function SolidTile({
  label,
  href,
  tone,
  sticker,
}: {
  label: string;
  href: string;
  tone: Tone;
  sticker?: StickerName;
}) {
  return (
    <Link
      href={href}
      className={`lift relative flex min-h-[120px] flex-col justify-between overflow-hidden rounded-lg border-2 border-ink p-4 ${toneBg(tone)}`}
    >
      <span className="font-mono text-[0.62rem] uppercase tracking-[0.1em] opacity-75">Shop</span>
      <span className="ds-display text-xl leading-[0.95]">{label}</span>
      {sticker && <Sticker name={sticker} className="pointer-events-none absolute -bottom-2 -right-2 h-[58px] w-[58px]" />}
    </Link>
  );
}

/* ---- Seller card: top-seller home rail ------------------------------------ */
export function SellerCard({
  profile,
  avg,
  count,
  tone,
}: {
  profile: Profile;
  avg: number;
  count: number;
  tone: Tone;
}) {
  const onDark = tone === "purple";
  return (
    <Link
      href={`/shop/${profile.handle}`}
      className={`lift flex w-[212px] shrink-0 snap-start flex-col gap-3.5 rounded-xl border-2 border-ink p-4 ${toneBg(tone)}`}
    >
      <div className="flex items-start justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={profile.picture} alt="" className="h-14 w-14 rounded-[15px] border-2 border-ink object-cover" />
        <span className="inline-flex items-center gap-1 rounded-pill bg-ink px-2.5 py-1.5 font-mono text-[0.74rem] font-bold text-white tabular-nums">
          <Star weight="fill" size={13} aria-hidden />
          {avg.toFixed(1)}
        </span>
      </div>
      <div className="min-w-0">
        <div className="ds-display flex items-center gap-1 truncate text-lg leading-none">
          @{profile.handle}
          {profile.nip05 && (
            <SealCheck size={13} className="shrink-0" aria-label="verified" />
          )}
        </div>
        <div className="mt-1.5 truncate font-mono text-[0.66rem] opacity-70">
          {count} review{count === 1 ? "" : "s"}
        </div>
      </div>
      <div className={`mt-auto flex items-center justify-between border-t-2 pt-3 font-mono text-[0.72rem] font-bold ${onDark ? "border-white/25" : "border-ink/20"}`}>
        <span className="tabular-nums">{compactSats(profile.totalSales ?? 0)} sold</span>
        <span className="inline-flex items-center gap-1">Visit
          <ArrowUpRight size={13} />
        </span>
      </div>
    </Link>
  );
}

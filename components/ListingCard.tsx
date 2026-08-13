import Link from "next/link";
import type { ProductData } from "@/data/types";
import {
  primaryType,
  primaryCategory,
  tintFor,
  priceLabel,
} from "@/lib/catalog";
import { Star, Heart } from "@phosphor-icons/react";

/* THE browse card. One component, one job: "is this worth opening?"
   Two densities, chosen by the space, never by the page:
   - "row"  (default): image-left editorial row. Every vertical feed.
   - "tile": square image, open body. Horizontal rails + dense grids.
   Replaces ListCard, ProductCard, ResultCard and NearCard. Pure presentation:
   fav state comes in as props, the page owns it. */

export type ListingRating = { avg: number; count: number };

export function ListingCard({
  product,
  density = "row",
  rating,
  fav = false,
  onToggleFav,
  className = "",
}: {
  product: ProductData;
  density?: "row" | "tile";
  rating?: ListingRating;
  fav?: boolean;
  /** When provided, the save heart renders on the image. */
  onToggleFav?: (id: string) => void;
  className?: string;
}) {
  return density === "row" ? (
    <RowCard product={product} rating={rating} fav={fav} onToggleFav={onToggleFav} className={className} />
  ) : (
    <TileCard product={product} rating={rating} fav={fav} onToggleFav={onToggleFav} className={className} />
  );
}

/* Save heart: identical affordance on both densities. 36px hit target,
   pink fill when saved. */
function FavButton({
  id,
  fav,
  onToggleFav,
}: {
  id: string;
  fav: boolean;
  onToggleFav: (id: string) => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleFav(id);
      }}
      aria-label={fav ? "Remove from saved" : "Save"}
      aria-pressed={fav}
      className={`ds-press absolute right-2.5 top-2.5 z-10 grid h-9 w-9 place-items-center rounded-full border-2 border-ink ${
        fav ? "bg-pink" : "bg-paper-pure"
      }`}
    >
      <Heart size={16} weight={fav ? "fill" : "duotone"} className="text-ink" />
    </button>
  );
}

/* Shared price + trust line: price is a value (mono, tabular), rating and
   location only render when they exist. Copy never lies. */
function MetaLine({
  product,
  rating,
  priceClass,
}: {
  product: ProductData;
  rating?: ListingRating;
  priceClass: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className={`whitespace-nowrap font-mono font-bold tabular-nums ${priceClass}`}>{priceLabel(product)}</span>
      <span className="inline-flex min-w-0 items-center gap-1 truncate font-mono text-[0.66rem] text-text-subtle">
        {rating && rating.count > 0 && (
          <>
            <Star weight="fill" size={12} aria-hidden />
            {`${rating.avg.toFixed(1)} · `}
          </>
        )}
        {product.location}
      </span>
    </div>
  );
}

/* ---- density="row": the H5 editorial row (locked default) ----------------- */
function RowCard({
  product,
  rating,
  fav,
  onToggleFav,
  className,
}: {
  product: ProductData;
  rating?: ListingRating;
  fav: boolean;
  onToggleFav?: (id: string) => void;
  className: string;
}) {
  const type = primaryType(product);
  /* Fixed height + self-start: the row is a bounded object. Left to itself as a
     grid child it stretches to the tallest cell in its track, and its height
     otherwise floats with each photo's aspect ratio, so a feed of rows never
     lines up. One height, every row, every surface. */
  return (
    <Link
      href={`/listing/${product.id}`}
      className={`group lift grid h-[176px] grid-cols-[42%_1fr] self-start overflow-hidden rounded-lg border-2 border-ink bg-paper-pure ${className}`}
    >
      <div className={`relative overflow-hidden border-r-2 border-ink ${tintFor(product)}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0]}
          alt={product.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-(--ds-dur-slow) ease-smooth motion-safe:group-hover:scale-[1.06]"
          style={{ outline: "1px solid rgba(0,0,0,0.06)", outlineOffset: "-1px" }}
        />
        {onToggleFav && <FavButton id={product.id} fav={fav} onToggleFav={onToggleFav} />}
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
        <div className="mt-auto pt-2.5">
          <MetaLine product={product} rating={rating} priceClass="text-[1.15rem]" />
        </div>
      </div>
    </Link>
  );
}

/* ---- density="tile": framed image, open body ------------------------------
   The image gets the stroke (images always carry a frame in this system);
   the text hangs below unboxed, so dense grids and rails stay light instead
   of double-bordered and cramped. */
function TileCard({
  product,
  rating,
  fav,
  onToggleFav,
  className,
}: {
  product: ProductData;
  rating?: ListingRating;
  fav: boolean;
  onToggleFav?: (id: string) => void;
  className: string;
}) {
  const type = primaryType(product);
  return (
    <div className={`group flex flex-col ${className}`}>
      <div className={`relative aspect-square overflow-hidden rounded-lg border-2 border-ink ${tintFor(product)}`}>
        <Link href={`/listing/${product.id}`} className="absolute inset-0 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images[0]}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-(--ds-dur-slow) ease-smooth motion-safe:group-hover:scale-[1.06]"
          />
        </Link>
        {type && (
          <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-pill border-2 border-ink bg-ink px-2.5 py-1 text-xs font-semibold text-white">
            {type}
          </span>
        )}
        {onToggleFav && <FavButton id={product.id} fav={fav} onToggleFav={onToggleFav} />}
      </div>
      {/* No "Just in" kicker: condition describes wear, not recency, and 79% of
          the catalog is "New", so the badge fired on 4 of every 5 cards and
          carried no information. Recency needs a real timestamp. */}
      <Link href={`/listing/${product.id}`} className="mt-2 block">
        <h3 className="line-clamp-2 text-[0.92rem] font-bold leading-tight">{product.title}</h3>
        <div className="mt-1.5">
          <MetaLine product={product} rating={rating} priceClass="text-[0.95rem]" />
        </div>
      </Link>
    </div>
  );
}

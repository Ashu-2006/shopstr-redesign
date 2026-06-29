import Link from "next/link";
import type { ProductData } from "@/data/types";
import { formatSats } from "@/lib/format";
import { Pill } from "@/components/ui/Pill";

/** Soft tint per primary category, so the grid reads colorful but controlled. */
const TINT: Record<string, string> = {
  Ceramics: "bg-yellow-soft",
  Apparel: "bg-pink-soft",
  Electronics: "bg-blue-soft",
  Keyboards: "bg-blue-soft",
  Coffee: "bg-yellow-soft",
  Photography: "bg-green-soft",
  Home: "bg-green-soft",
  Kitchen: "bg-yellow-soft",
  "Art & Print": "bg-pink-soft",
  Music: "bg-blue-soft",
  Service: "bg-green-soft",
};

function tintFor(categories: string[]): string {
  for (const c of categories) if (TINT[c]) return TINT[c];
  return "bg-paper-2";
}

/**
 * Marketplace grid card. Pure presentation: props in, JSX out. Links to the
 * listing detail. Price is mono/tabular (it's a value).
 */
export function ProductCard({ product }: { product: ProductData }) {
  const type = product.categories.find((c) =>
    ["Digital", "Service", "Resale", "Exchange", "Swap"].includes(c)
  );
  return (
    <Link
      href={`/listing/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border-2 border-ink bg-paper-pure ds-press"
    >
      <div className={`relative aspect-square overflow-hidden ${tintFor(product.categories)}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0]}
          alt={product.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
          style={{ outline: "1px solid rgba(0,0,0,0.08)", outlineOffset: "-1px" }}
        />
        {type && (
          <span className="absolute left-2.5 top-2.5">
            <Pill tone="ink" className="!px-2.5 !py-1 !text-xs">
              {type}
            </Pill>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <h3 className="line-clamp-2 text-[0.95rem] font-bold leading-tight">
          {product.title}
        </h3>
        <div className="mt-auto flex items-baseline justify-between pt-2">
          <span className="font-mono text-[0.95rem] font-bold tabular-nums">
            {formatSats(product.price)}
          </span>
          <span className="font-mono text-[0.68rem] text-text-subtle">
            {product.location}
          </span>
        </div>
      </div>
    </Link>
  );
}

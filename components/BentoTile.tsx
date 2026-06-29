import Link from "next/link";
import type { ProductData } from "@/data/types";
import { formatSats } from "@/lib/format";
import { Sticker, type StickerName } from "@/components/ui/Sticker";

type Tone = "purple" | "green" | "yellow" | "pink" | "blue" | "orange" | "paper";

const TONE: Record<Tone, string> = {
  purple: "bg-purple text-on-purple",
  green: "bg-green text-ink",
  yellow: "bg-yellow text-ink",
  pink: "bg-pink text-ink",
  blue: "bg-blue text-ink",
  orange: "bg-orange text-ink",
  paper: "bg-paper-pure text-ink",
};

/** Large featured tile (spans 2 rows). Links to a listing. Has a sticker accent. */
export function FeaturedTile({
  product,
  tone = "purple",
  sticker = "shape-sunstar-yellow",
}: {
  product: ProductData;
  tone?: Tone;
  sticker?: StickerName;
}) {
  return (
    <Link
      href={`/listing/${product.id}`}
      className={`relative row-span-2 flex flex-col justify-end overflow-hidden rounded-xl border-2 border-ink p-4 ds-press ${TONE[tone]}`}
    >
      <Sticker
        name={sticker}
        className="pointer-events-none absolute right-3 top-3 h-16 w-16"
      />
      <span className="font-mono text-[0.62rem] uppercase tracking-[0.1em] opacity-80">
        Featured
      </span>
      <h3 className="ds-display mt-1.5 text-2xl leading-[0.95]">{product.title}</h3>
      <span className="mt-2 font-mono text-sm font-bold tabular-nums">
        {formatSats(product.price)}
      </span>
    </Link>
  );
}

/** Category tile — solid accent, big uppercase label. Links to category feed. */
export function CategoryTile({
  label,
  href,
  tone = "green",
  sticker,
}: {
  label: string;
  href: string;
  tone?: Tone;
  sticker?: StickerName;
}) {
  return (
    <Link
      href={href}
      className={`relative flex min-h-[96px] flex-col justify-between overflow-hidden rounded-xl border-2 border-ink p-4 ds-press ${TONE[tone]}`}
    >
      {sticker && (
        <Sticker
          name={sticker}
          className="pointer-events-none absolute -bottom-2 -right-2 h-14 w-14"
        />
      )}
      <span className="font-mono text-[0.62rem] uppercase tracking-[0.1em] opacity-80">
        Category
      </span>
      <span className="ds-display text-lg leading-[0.95]">{label}</span>
    </Link>
  );
}

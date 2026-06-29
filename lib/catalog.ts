/* Catalog display helpers — pure, no data access. Map categories to the
   playful accent system and derive type/category/price labels consistently. */

import type { ProductData } from "@/data/types";
import { groupInt } from "@/lib/format";
import type { StickerName } from "@/components/ui/Sticker";

/** The six marketplace "type" tags (distinct from real categories). */
export const TYPES = ["Physical", "Digital", "Service", "Resale", "Exchange", "Swap"];

export type Tone = "purple" | "green" | "yellow" | "pink" | "blue" | "orange";

/** Per-category accent: full-bleed tone, soft tint class, decorative sticker. */
interface CatMeta {
  tone: Tone;
  /** Tailwind soft-tint background class for image wells. */
  soft: string;
  sticker: StickerName;
  /** true when the tone needs white text (purple only). */
  onDark: boolean;
}

const CAT: Record<string, CatMeta> = {
  Ceramics: { tone: "green", soft: "bg-green-soft", sticker: "shape-smiley", onDark: false },
  Apparel: { tone: "pink", soft: "bg-pink-soft", sticker: "shape-heart-circle", onDark: false },
  Photography: { tone: "blue", soft: "bg-green-soft", sticker: "shape-sunstar-purple", onDark: false },
  Electronics: { tone: "orange", soft: "bg-blue-soft", sticker: "shape-starburst", onDark: false },
  Keyboards: { tone: "blue", soft: "bg-blue-soft", sticker: "shape-starburst", onDark: false },
  "Art & Print": { tone: "pink", soft: "bg-pink-soft", sticker: "shape-sparkle-4pt", onDark: false },
  Coffee: { tone: "yellow", soft: "bg-yellow-soft", sticker: "shape-daisy-yellow", onDark: false },
  Kitchen: { tone: "yellow", soft: "bg-yellow-soft", sticker: "shape-sun-rays", onDark: false },
  Home: { tone: "blue", soft: "bg-green-soft", sticker: "shape-hand", onDark: false },
  Music: { tone: "blue", soft: "bg-blue-soft", sticker: "shape-shooting-star", onDark: false },
  Service: { tone: "purple", soft: "bg-paper-2", sticker: "shape-sparkle-4pt", onDark: true },
};

const FALLBACK: CatMeta = {
  tone: "purple",
  soft: "bg-paper-2",
  sticker: "shape-sparkle-4pt",
  onDark: true,
};

export function catMeta(category: string): CatMeta {
  return CAT[category] ?? FALLBACK;
}

/** Solid-tone background class for full-bleed category surfaces. */
const TONE_BG: Record<Tone, string> = {
  purple: "bg-purple text-on-purple",
  green: "bg-green text-ink",
  yellow: "bg-yellow text-ink",
  pink: "bg-pink text-ink",
  blue: "bg-blue text-ink",
  orange: "bg-orange text-ink",
};
export function toneBg(tone: Tone): string {
  return TONE_BG[tone];
}

/** The marketplace "type" tag for a listing, if any (Digital/Service/Resale…). */
export function primaryType(p: ProductData): string | undefined {
  return p.categories.find((c) => TYPES.includes(c));
}

/** The first real (non-type) category — the listing's primary category. */
export function primaryCategory(p: ProductData): string {
  return p.categories.find((c) => !TYPES.includes(c)) ?? p.categories[0] ?? "";
}

/** Soft tint class for a listing's image well, by its primary category. */
export function tintFor(p: ProductData): string {
  for (const c of p.categories) if (CAT[c]) return CAT[c].soft;
  return "bg-paper-2";
}

/** PDF Issue 3: one price style. "Free" for zero, never "0 sats". */
export function priceLabel(p: ProductData): string {
  return p.price > 0 ? `${groupInt(p.price)} sats` : "Free";
}

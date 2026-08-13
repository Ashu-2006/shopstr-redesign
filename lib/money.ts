import type { ProductData } from "@/data/types";
import { ratePerUnit } from "@/data/mock/rates";
import { groupInt } from "@/lib/format";

/* =============================================================================
   Money display. Sats are what settle; a listing may QUOTE another currency.
   Anywhere a price is shown, go through here so a fiat-quoted listing never
   renders a bare sats number as if the seller had set it.
   ========================================================================== */

export interface QuotedPrice {
  /** True when the seller quoted something other than sats. */
  converted: boolean;
  /** The seller's own number, formatted (e.g. "$40"). */
  quoted: string;
  /** Integer sats the buyer actually pays, or null if the rate is unavailable. */
  sats: number | null;
}

const SYMBOL: Record<string, string> = { USD: "$", EUR: "€" };

function formatQuoted(amount: number, currency: string): string {
  const sym = SYMBOL[currency];
  if (sym) return `${sym}${groupInt(amount)}`;
  if (currency === "sats") return `${groupInt(amount)} sats`;
  return `${groupInt(amount)} ${currency}`;
}

/**
 * What to show for a listing's price.
 * For a sats listing this is just the sats. For a fiat listing the seller's
 * number leads and the sats equivalent follows, because the fiat figure is the
 * one the seller committed to.
 */
export function quotedPrice(product: ProductData): QuotedPrice {
  const currency = product.currency || "sats";
  if (currency === "sats") {
    return { converted: false, quoted: formatQuoted(product.price, "sats"), sats: product.price };
  }
  const rate = ratePerUnit(currency);
  return {
    converted: true,
    quoted: formatQuoted(product.price, currency),
    sats: rate === null ? null : Math.round(product.price * rate),
  };
}

/** One-line price for cards: "$40 · ≈38,000 sats" or "18,000 sats". */
export function priceLine(product: ProductData): string {
  const q = quotedPrice(product);
  if (!q.converted) return q.quoted;
  return q.sats === null ? `${q.quoted} · rate unavailable` : `${q.quoted} · ≈${groupInt(q.sats)} sats`;
}

/** The sats a listing costs, for cart math. Null when the rate is unavailable. */
export function satsFor(product: ProductData): number | null {
  return quotedPrice(product).sats;
}

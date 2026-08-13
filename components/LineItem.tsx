import Link from "next/link";
import type { ReactNode } from "react";
import type { ProductData } from "@/data/types";
import { priceLabel } from "@/lib/catalog";

/* The confirmation row. One job: "is this the thing I already chose?"
   Identity + price only, no discovery affordances. The trailing slot is the
   only variation: Buy in recommendations, quantity stepper in cart, status
   pill in orders, nothing in a chat quote.
   Replaces RecRow, the cart line, the orders line and QuotedCard. Pure:
   actions come in through `trailing`, the page owns the behavior. */

export function LineItem({
  product,
  href,
  size = "md",
  frame = "card",
  onDark = false,
  meta,
  trailing,
}: {
  product: ProductData;
  /** Defaults to the listing detail. */
  href?: string;
  /** md: 56px thumb (standalone rows). sm: 40px (embedded, e.g. chat quote). */
  size?: "md" | "sm";
  /** card: stroked surface. quiet: tinted fill, for embedding inside bubbles
      and wells where a second stroke would double up. */
  frame?: "card" | "quiet";
  /** quiet only: set when embedded on an ink or purple surface. */
  onDark?: boolean;
  /** One short qualifier after the price ("Qty 2", "Size M"). */
  meta?: string;
  trailing?: ReactNode;
}) {
  const sm = size === "sm";
  const frameCls =
    frame === "card"
      ? "rounded-lg border-2 border-ink bg-paper-pure p-3"
      : `rounded-[10px] p-2 ${onDark ? "bg-black/15 text-text-on-dark" : "bg-paper-2"}`;
  return (
    <Link
      href={href ?? `/listing/${product.id}`}
      className={`ds-press flex items-center ${sm ? "gap-2.5" : "gap-3"} ${frameCls}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.images[0]}
        alt=""
        className={`shrink-0 border-2 border-ink object-cover ${
          sm ? "h-10 w-10 rounded-[7px]" : "h-14 w-14 rounded-md"
        }`}
      />
      <div className="min-w-0 flex-1">
        <div className={`truncate font-bold leading-tight ${sm ? "text-[0.8rem]" : ""}`}>{product.title}</div>
        <div className={`mt-0.5 font-mono tabular-nums ${sm ? "text-[0.72rem]" : "text-[0.82rem] font-bold"}`}>
          {priceLabel(product)}
          {meta && (
            <span className={`font-normal ${onDark ? "text-text-on-dark-muted" : "text-text-subtle"}`}> · {meta}</span>
          )}
        </div>
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </Link>
  );
}

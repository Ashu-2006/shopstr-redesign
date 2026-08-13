import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import type { CartItem } from "@/data/types";
import { groupInt } from "@/lib/format";
import { satsFor } from "@/lib/money";

/**
 * Order context for the checkout panel: what you're buying, who from, what it
 * costs. Pure presentation. Renders as the panel's sticky top section, so the
 * product is visible at every step without scrolling.
 *
 * Collapsed by default (thumbs + count + total, one tap to expand) so the step
 * content owns the panel; expanding reveals line items and the money breakdown.
 */
export function CheckoutSummary({
  items,
  shipping,
  fulfilment,
}: {
  items: CartItem[];
  shipping: number;
  fulfilment: "ship" | "pickup";
}) {
  const [open, setOpen] = useState(false);
  const subtotal = items.reduce((s, i) => s + (satsFor(i.product) ?? 0) * i.quantity, 0);
  const total = subtotal + shipping;
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const sellers = [...new Set(items.map((i) => i.product.pubkey.replace("pk_", "")))];

  const rows: [string, string][] = [
    ["Subtotal", `${groupInt(subtotal)} sats`],
    [
      fulfilment === "pickup" ? "Local pickup" : "Shipping",
      fulfilment === "pickup" || shipping === 0 ? "free" : `${groupInt(shipping)} sats`,
    ],
  ];

  return (
    <div className="bg-paper-2">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left lg:gap-4 lg:px-8 lg:py-4"
      >
        <span className="flex shrink-0">
          {items.slice(0, 3).map((i, n) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i.product.id + (i.size ?? "")}
              src={i.product.images[0]}
              alt=""
              className={`h-10 w-10 rounded-lg border-2 border-ink object-cover lg:h-14 lg:w-14 ${n > 0 ? "-ml-3 lg:-ml-4" : ""}`}
            />
          ))}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-bold lg:text-[1.02rem]">
            {count === 1 ? items[0].product.title : `${count} items`}
            <span className="hidden lg:inline"> in this order</span>
          </span>
          <span className="block truncate font-mono text-[0.64rem] text-text-subtle lg:text-[0.7rem]">
            {sellers.length === 1 ? `@${sellers[0]}` : `${sellers.length} sellers`}
            {" · "}
            {open ? "hide" : "breakdown"}
          </span>
        </span>
        <span className="shrink-0 text-right leading-tight">
          <span className="block font-mono text-sm font-bold tabular-nums lg:text-xl">{groupInt(total)}</span>
          <span className="block font-mono text-[0.6rem] text-text-subtle">sats</span>
        </span>
        <CaretDown
          size={16}
          weight="bold"
          className={`shrink-0 transition-transform duration-(--ds-dur-fast) ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t-2 border-paper-pure px-5 pb-4 lg:px-8">
          <ul className="flex flex-col gap-2.5 pt-3">
            {items.map((i) => (
              <li key={i.product.id + (i.size ?? "")} className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.product.images[0]} alt="" className="h-9 w-9 shrink-0 rounded-md border-2 border-ink object-cover" />
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-[0.82rem] font-bold">{i.product.title}</div>
                  <div className="font-mono text-[0.64rem] text-text-subtle">
                    ×{i.quantity}
                    {i.size ? ` · ${i.size}` : ""}
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[0.78rem] tabular-nums">{groupInt((satsFor(i.product) ?? 0) * i.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 border-t-2 border-paper-pure pt-2">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between py-0.5 text-[0.82rem]">
                <span className="text-text-muted">{k}</span>
                <span className="font-mono tabular-nums">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

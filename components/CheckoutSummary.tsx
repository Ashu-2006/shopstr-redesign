import { useState } from "react";
import { CaretDown, Lock } from "@phosphor-icons/react";
import type { CartItem } from "@/data/types";
import { groupInt } from "@/lib/format";

/**
 * Persistent order context for the checkout flow. Pure presentation.
 * lg+: an always-open summary card (the rail next to the step card).
 * Below lg: a collapsed strip (thumbs + count + total) that discloses the
 * full breakdown on tap, so the step card keeps the focus.
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
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const total = subtotal + shipping;
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const sellers = [...new Set(items.map((i) => i.product.pubkey.replace("pk_", "")))];

  const rows: [string, string][] = [
    ["Subtotal", `${groupInt(subtotal)} sats`],
    [
      fulfilment === "pickup" ? "Local pickup" : "Shipping",
      fulfilment === "pickup" ? "free" : shipping === 0 ? "free" : `${groupInt(shipping)} sats`,
    ],
  ];

  return (
    <div className="rounded-2xl border-2 border-ink bg-paper-pure text-ink">
      {/* Mobile: collapsed strip. */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 lg:hidden"
      >
        <span className="flex shrink-0">
          {items.slice(0, 3).map((i, n) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i.product.id + (i.size ?? "")}
              src={i.product.images[0]}
              alt=""
              className={`h-9 w-9 rounded-lg border-2 border-ink object-cover ${n > 0 ? "-ml-2.5" : ""}`}
            />
          ))}
        </span>
        <span className="text-sm font-bold">
          {count} item{count === 1 ? "" : "s"}
        </span>
        <span className="ml-auto font-mono text-sm font-bold tabular-nums">{groupInt(total)} sats</span>
        <CaretDown
          size={16}
          weight="bold"
          className={`shrink-0 transition-transform duration-(--ds-dur-fast) ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Desktop: title header. */}
      <div className="hidden px-5 pt-5 lg:block">
        <h3 className="ds-display text-lg">Order summary</h3>
        <p className="mt-0.5 font-mono text-[0.66rem] text-text-subtle">
          {sellers.length === 1 ? `Sold by @${sellers[0]}` : `${sellers.length} sellers`}
        </p>
      </div>

      {/* Breakdown: disclosed on mobile, always open at lg. */}
      <div className={`${open ? "block" : "hidden"} border-t-2 border-paper-2 px-4 pb-4 pt-3 lg:block lg:border-t-0 lg:px-5 lg:pb-5`}>
        <ul className="flex flex-col gap-2.5">
          {items.map((i) => (
            <li key={i.product.id + (i.size ?? "")} className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.product.images[0]} alt="" className="h-10 w-10 shrink-0 rounded-lg border-2 border-ink object-cover" />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[0.84rem] font-bold">{i.product.title}</div>
                <div className="font-mono text-[0.66rem] text-text-subtle">
                  ×{i.quantity}
                  {i.size ? ` · ${i.size}` : ""}
                </div>
              </div>
              <span className="shrink-0 font-mono text-[0.8rem] tabular-nums">{groupInt(i.product.price * i.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 border-t-2 border-paper-2 pt-2.5">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between py-1 text-[0.84rem]">
              <span className="text-text-muted">{k}</span>
              <span className="font-mono tabular-nums">{v}</span>
            </div>
          ))}
          <div className="mt-1 flex items-baseline justify-between border-t-2 border-ink pt-2">
            <span className="font-bold">Total</span>
            <span className="font-mono text-lg font-bold tabular-nums">
              {groupInt(total)} <span className="text-xs font-normal text-text-muted">sats</span>
            </span>
          </div>
        </div>

        <p className="mt-3 hidden items-start gap-1.5 font-mono text-[0.62rem] leading-relaxed text-text-subtle lg:flex">
          <Lock size={12} className="mt-px shrink-0" />
          Paid peer-to-peer in sats. Your details go to the seller as an encrypted DM.
        </p>
      </div>
    </div>
  );
}

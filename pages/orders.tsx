import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useOrders } from "@/data/hooks";
import { MOCK_LISTINGS } from "@/data/mock/listings";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { RowSkeleton } from "@/components/skeletons";
import type { OrderStatus } from "@/data/mock/extras";

/** Chip per status. "pending" is the one that needs attention, so it is yellow. */
const CHIP: Record<OrderStatus, { label: string; tone: "green" | "blue" | "ink" | "yellow" | "red" }> = {
  pending: { label: "Pending", tone: "yellow" },
  confirmed: { label: "Confirmed", tone: "green" },
  shipped: { label: "Shipped", tone: "blue" },
  delivered: { label: "Delivered", tone: "ink" },
  cancelled: { label: "Cancelled", tone: "red" },
};
const byId = (id: string) => MOCK_LISTINGS.find((l) => l.id === id);

export default function Orders() {
  const { data: orders, isLoading } = useOrders();
  // Buying vs selling is a different job, not a status: keep it a separate lens.
  const [side, setSide] = useState<"buying" | "selling">("buying");
  const [filter, setFilter] = useState<string>("All");
  const FILTERS = ["All", "Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

  const sideOrders = orders.filter((o) => (side === "selling" ? o.isSale : !o.isSale));
  const shown =
    filter === "All" ? sideOrders : sideOrders.filter((o) => CHIP[o.status].label === filter);
  const sales = orders.filter((o) => o.isSale);
  const needsAction = sales.filter((o) => o.status === "pending").length;

  return (
    <>
      <Head><title>Orders · Shopstr</title></Head>
      <SheetHeader title="Your orders" backTo="/marketplace" contentMax="max-w-[760px]" />
      <main className="mx-auto max-w-[760px] px-4 pb-28 pt-4 md:pb-12">
        {/* Side first (am I buying or selling), then status within that side. */}
        {sales.length > 0 && (
          <div className="mb-3 flex gap-2">
            {(["buying", "selling"] as const).map((sv) => (
              <button
                key={sv}
                onClick={() => { setSide(sv); setFilter("All"); }}
                aria-pressed={side === sv}
                className={`ds-press inline-flex items-center gap-1.5 rounded-pill border-2 border-ink px-4 py-2 text-sm font-bold capitalize transition-colors duration-(--ds-dur-instant) ${
                  side === sv ? "bg-ink text-text-on-dark" : "bg-paper-pure"
                }`}
              >
                {sv}
                {sv === "selling" && needsAction > 0 && (
                  <span className="rounded-pill bg-yellow px-1.5 py-px font-mono text-[0.6rem] font-bold text-ink tabular-nums">
                    {needsAction}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
        <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <Pill key={f} interactive active={filter === f} onClick={() => setFilter(f)}>{f}</Pill>
          ))}
        </div>
        {isLoading ? (
          <div className="flex flex-col gap-2.5" aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : sideOrders.length === 0 && filter === "All" ? (
          // True zero: nothing bought yet.
          <EmptyState
            sticker="shape-sparkle-4pt"
            headline="Nothing on the way"
            body="Buy something and track it here, from paid to delivered."
            cta={
              <Link href="/marketplace">
                <Button variant="secondary">Browse the market</Button>
              </Link>
            }
          />
        ) : shown.length === 0 ? (
          // Filter zero: chrome stays, recovery is one tap.
          <EmptyState
            variant="inline"
            headline={`No ${filter.toLowerCase()} orders`}
            body="Everything you've bought sits in another lane."
            cta={
              <Button variant="secondary" onClick={() => setFilter("All")}>
                Show all orders
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {shown.map((o) => {
              const p = byId(o.productId);
              if (!p) return null;
              const chip = CHIP[o.status];
              return (
                <Link key={o.id} href={`/orders/${o.id}`} className="ds-press flex items-center gap-3 rounded-lg border-2 border-ink bg-paper-pure p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.images[0]} alt="" className="h-14 w-14 shrink-0 rounded-md border-2 border-ink object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{p.title}</div>
                    <div className="font-mono text-[0.66rem] text-text-subtle">
                      Order #{o.id} · {o.isSale ? `to @${o.buyerHandle}` : `@${o.sellerHandle}`} · {o.placed}
                    </div>
                    {o.shipment?.tracking && (
                      <div className="font-mono text-[0.64rem] text-text-muted">
                        {o.shipment.carrier} {o.shipment.tracking}
                      </div>
                    )}
                  </div>
                  <Pill tone={chip.tone} className="!px-2.5 !py-1 !text-xs">{chip.label}</Pill>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav active="/orders" />
    </>
  );
}

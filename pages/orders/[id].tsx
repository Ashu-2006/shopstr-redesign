import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { dur, ease, tEnter } from "@/lib/motion";
import { useOrder, useSession, nextAction, productById } from "@/data/hooks";
import type { OrderStatus } from "@/data/mock/extras";
import { groupInt } from "@/lib/format";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { RowSkeleton } from "@/components/skeletons";
import { ChatCircle, X } from "@phosphor-icons/react";

const byId = productById;

const STATUS_TONE: Record<OrderStatus, "green" | "blue" | "ink" | "yellow" | "red"> = {
  pending: "yellow",
  confirmed: "green",
  shipped: "blue",
  delivered: "ink",
  cancelled: "red",
};

export default function OrderDetail() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const { data: order, isLoading } = useOrder(id);
  const { setOrderStatus, setShipment } = useSession();

  /* Marking shipped is the one transition that carries DATA (carrier +
     tracking), so it opens a capture sheet instead of flipping the status
     blind. Everything the buyer sees downstream depends on this being real. */
  const [shipSheet, setShipSheet] = useState(false);
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [shipTouched, setShipTouched] = useState(false);

  const notFound = router.isReady && id && !isLoading && !order;
  const p = order ? byId(order.productId) : undefined;
  if (notFound || (order && !p)) {
    return (
      <>
        <Head><title>Order not found · Shopstr</title></Head>
        <SheetHeader title="Order" backTo="/orders" contentMax="max-w-[760px]" />
        <main className="mx-auto max-w-[760px] px-4 py-12">
          <EmptyState
            sticker="shape-daisy-yellow"
            headline="Order not found"
            body="It may belong to another key, or the link is stale."
            cta={
              <Link href="/orders">
                <Button variant="secondary">Back to orders</Button>
              </Link>
            }
          />
        </main>
        <BottomNav active="/orders" />
      </>
    );
  }
  if (!order || !p) {
    // Loading: mirror the populated layout (order card + timeline + actions).
    return (
      <>
        <Head><title>Order · Shopstr</title></Head>
        <SheetHeader title="Order" backTo="/orders" contentMax="max-w-[760px]" />
        <main className="mx-auto max-w-[760px] px-4 pb-28 pt-4 md:pb-12" aria-hidden="true">
          <RowSkeleton />
          <h2 className="ds-display mb-3 mt-6 text-xl">Timeline</h2>
          <ol className="relative ml-3 border-l-2 border-ink pl-7">
            {Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="relative mb-5">
                <span className="absolute -left-[37px] top-0.5 h-4 w-4 rounded-full border-2 border-ink bg-paper-pure" />
                <Skeleton shape="line" w="35%" h="0.95rem" />
                <Skeleton shape="line" w="55%" className="mt-1.5" h="0.66rem" />
              </li>
            ))}
          </ol>
        </main>
        <BottomNav active="/orders" />
      </>
    );
  }
  // Cancelled is an off-ramp, not a stage: it never advances the timeline.
  const cancelled = order.status === "cancelled";
  const STAGES: { status: OrderStatus; t: string; d: string }[] = [
    { status: "pending", t: "Order placed", d: `Paid ${groupInt(p.price)} sats · ${order.network} · ${order.placed}` },
    { status: "confirmed", t: "Seller confirmed", d: `@${order.sellerHandle} accepted the order` },
    {
      status: "shipped",
      t: "Shipped",
      d: order.shipment?.tracking
        ? `${order.shipment.carrier ?? "Carrier"} · ${order.shipment.tracking}`
        : "Tracking will appear here",
    },
    { status: "delivered", t: "Delivered", d: order.status === "delivered" ? "Confirmed received" : "Estimated soon" },
  ];
  // How far the order has actually progressed.
  const doneCount = cancelled ? 1 : STAGES.findIndex((x) => x.status === order.status) + 1;
  const action = nextAction(order);
  // Who the OTHER party is. On a sale that's the buyer, not me.
  const counterparty = order.isSale ? order.buyerHandle ?? "buyer" : order.sellerHandle;
  // You review the person you bought from; a seller does not review their own sale.
  const canReview = !order.isSale && order.status === "delivered";

  return (
    <>
      <Head><title>Order #{order.id} · Shopstr</title></Head>
      <SheetHeader title={`Order #${order.id}`} backTo="/orders" contentMax="max-w-[760px]" />
      <main className="mx-auto max-w-[760px] px-4 pb-28 pt-4 md:pb-12">
        <div className="flex items-center gap-3 rounded-lg border-2 border-ink bg-paper-pure p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.images[0]} alt="" className="h-14 w-14 shrink-0 rounded-md border-2 border-ink object-cover" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold">{p.title}</div>
            <div className="font-mono text-[0.66rem] text-text-subtle tabular-nums">
              {groupInt(p.price)} sats · {order.isSale ? `to @${counterparty}` : `@${counterparty}`}
            </div>
          </div>
          <Pill tone={STATUS_TONE[order.status]} className="!px-2.5 !py-1 !text-xs">
            {order.status[0].toUpperCase() + order.status.slice(1)}
          </Pill>
        </div>

        {/* The one action this role may take, if any. Upstream enforces that a
            seller owns confirmed/shipped/delivered and a buyer only cancels, so
            the UI never offers a transition the role cannot perform. */}
        {action && (
          <button
            onClick={() =>
              action.status === "shipped"
                ? setShipSheet(true)
                : setOrderStatus(order.id, action.status)
            }
            className={`ds-press mt-3 w-full rounded-pill border-2 py-3.5 font-bold ${
              action.tone === "red"
                ? "border-red bg-paper-pure text-red"
                : "border-ink bg-ink text-text-on-dark"
            }`}
          >
            {action.label}
          </button>
        )}
        {order.isSale && order.status === "pending" && (
          <p className="mt-2 text-center font-mono text-[0.66rem] text-text-muted">
            @{order.buyerHandle} has paid. Confirm so they know you have it.
          </p>
        )}
        {!order.isSale && order.status === "shipped" && (
          <p className="mt-2 text-center font-mono text-[0.66rem] text-text-muted">
            On its way, so it can no longer be cancelled.
          </p>
        )}

        {cancelled && (
          <div className="mt-3 rounded-lg border-2 border-red bg-pink-soft p-3.5 text-sm">
            <b>This order was cancelled.</b> Any sats paid are refunded to your wallet.
          </div>
        )}

        {/* Shipment facts, once they exist. */}
        {order.shipment && (order.status === "shipped" || order.status === "delivered") && (
          <dl className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-lg border-2 border-ink bg-ink text-sm">
            {[
              ["Carrier", order.shipment.carrier ?? "-"],
              ["Tracking", order.shipment.tracking ?? "-"],
              ["ETA", order.shipment.eta ?? "-"],
            ].map(([k, v]) => (
              <div key={k} className="bg-paper-pure p-3">
                <dt className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">{k}</dt>
                <dd className="mt-0.5 truncate font-mono text-[0.78rem] font-bold">{v}</dd>
              </div>
            ))}
          </dl>
        )}

        <h2 className="ds-display mb-3 mt-6 text-xl">Timeline</h2>
        <ol className="relative ml-3 border-l-2 border-ink pl-7">
          {STAGES.map((n, i) => {
            const on = i < doneCount;
            return (
              <li key={n.t} className="relative mb-5">
                <span className={`absolute -left-[37px] top-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-ink ${on ? "bg-green" : "bg-paper-pure"}`} />
                <div className="font-bold">{n.t}</div>
                <div className="font-mono text-[0.66rem] text-text-subtle">{n.d}</div>
              </li>
            );
          })}
        </ol>

        <Link href={`/messages/${counterparty}`} className="ds-press mt-1 flex w-full items-center justify-center gap-2 rounded-pill border-2 border-ink bg-paper-pure py-3.5 font-bold">
          <ChatCircle size={18} /> Message @{counterparty}
        </Link>
        {/* Reviewing is only offered once there is something to review, and
            never to the seller of the order. */}
        {canReview && (
          <Link href={`/review/${order.productId}`} className="ds-press mt-2.5 flex w-full items-center justify-center rounded-pill border-2 border-purple bg-purple py-3.5 font-bold text-on-purple">
            Leave a review
          </Link>
        )}
      </main>

      {/* ---- Mark shipped: the capture sheet. Same anatomy as the search
           filter sheet (scrim + bottom sheet, swing in, exit down). ---- */}
      <AnimatePresence>
        {shipSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShipSheet(false)}
              className="fixed inset-0 z-40 bg-ink/50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%", transition: { duration: dur.moderate, ease: ease.exit } }}
              transition={tEnter}
              role="dialog"
              aria-label="Mark as shipped"
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[560px] rounded-t-2xl border-2 border-ink bg-paper"
            >
              <div className="flex items-center justify-between border-b-2 border-ink px-5 py-4">
                <h2 className="ds-display text-2xl">Mark shipped</h2>
                <button
                  onClick={() => setShipSheet(false)}
                  aria-label="Close"
                  className="ds-press grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-paper-pure"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="px-5 py-5">
                <p className="text-sm text-text-muted">
                  @{counterparty} gets the tracking the moment you confirm, so they
                  stop wondering and you stop getting asked.
                </p>
                <label className="mt-4 block">
                  <span className="mb-1.5 block font-mono text-[0.66rem] uppercase tracking-[0.1em] text-text-muted">Carrier</span>
                  <input
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="PostNL, DHL, UPS…"
                    className="w-full rounded-md border-2 border-ink bg-paper-pure px-3.5 py-3 outline-none focus:border-purple"
                  />
                </label>
                <label className="mt-3 block">
                  <span className="mb-1.5 block font-mono text-[0.66rem] uppercase tracking-[0.1em] text-text-muted">Tracking number</span>
                  <input
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder="NL8472913746"
                    className="w-full rounded-md border-2 border-ink bg-paper-pure px-3.5 py-3 font-mono outline-none focus:border-purple"
                  />
                </label>
                {shipTouched && (!carrier.trim() || !tracking.trim()) && (
                  <p className="mt-2 text-sm font-bold text-red">
                    Both fields, or the buyer has nothing to follow.
                  </p>
                )}
                <div
                  className="mt-5 pb-2"
                  style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
                >
                  <Button
                    variant="primary"
                    full
                    onClick={() => {
                      setShipTouched(true);
                      if (!carrier.trim() || !tracking.trim()) return;
                      setShipment(order.id, { carrier: carrier.trim(), tracking: tracking.trim() });
                      setOrderStatus(order.id, "shipped");
                      setShipSheet(false);
                    }}
                  >
                    Confirm shipped
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav active="/orders" />
    </>
  );
}

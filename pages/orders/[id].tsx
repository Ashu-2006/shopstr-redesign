import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useOrder } from "@/data/hooks";
import { MOCK_LISTINGS } from "@/data/mock/listings";
import { groupInt } from "@/lib/format";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Pill } from "@/components/ui/Pill";

const byId = (id: string) => MOCK_LISTINGS.find((l) => l.id === id)!;

export default function OrderDetail() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const { data: order } = useOrder(id);
  if (!order) return null;

  const p = byId(order.productId);
  const stages = ["paid", "shipped", "delivered"];
  const reached = stages.indexOf(order.status);
  const nodes = [
    { t: "Order placed", d: `Paid ${groupInt(p.price)} sats · ${order.network} · ${order.placed}` },
    { t: "Seller confirmed", d: `@${order.sellerHandle} accepted` },
    { t: "Shipped", d: "Tracking added" },
    { t: "Delivered", d: order.status === "delivered" ? "Confirmed received" : "Estimated soon" },
  ];
  // map: placed→0&1 done, shipped→through 2, delivered→all
  const doneCount = order.status === "paid" ? 2 : order.status === "shipped" ? 3 : 4;

  return (
    <>
      <Head><title>Order #{order.id} · Shopstr</title></Head>
      <SheetHeader title={`Order #${order.id}`} backTo="/orders" />
      <main className="mx-auto max-w-[760px] px-4 pb-28 pt-4 md:pb-12">
        <div className="flex items-center gap-3 rounded-lg border-2 border-ink bg-paper-pure p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.images[0]} alt="" className="h-14 w-14 shrink-0 rounded-md border-2 border-ink object-cover" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold">{p.title}</div>
            <div className="font-mono text-[0.66rem] text-text-subtle tabular-nums">{groupInt(p.price)} sats · @{order.sellerHandle}</div>
          </div>
          <Pill tone={order.status === "delivered" ? "ink" : order.status === "shipped" ? "blue" : "green"} className="!px-2.5 !py-1 !text-xs">
            {order.status[0].toUpperCase() + order.status.slice(1)}
          </Pill>
        </div>

        <h2 className="ds-display mb-3 mt-6 text-xl">Timeline</h2>
        <ol className="relative ml-3 border-l-2 border-ink pl-7">
          {nodes.map((n, i) => {
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

        <Link href={`/messages/${order.sellerHandle}`} className="ds-press mt-1 flex w-full items-center justify-center rounded-pill border-2 border-ink bg-paper-pure py-3.5 font-bold">
          ✦ Message @{order.sellerHandle}
        </Link>
        <Link href={`/review/${order.productId}`} className="ds-press mt-2.5 flex w-full items-center justify-center rounded-pill border-2 border-purple bg-purple py-3.5 font-bold text-on-purple">
          Leave a review
        </Link>
      </main>
      <BottomNav active="/orders" />
    </>
  );
}

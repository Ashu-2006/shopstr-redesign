import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Lightning, Key, Star } from "@phosphor-icons/react";
import { useCartStore, useCheckout } from "@/data/hooks";
import { groupInt } from "@/lib/format";
import { Sticker } from "@/components/ui/Sticker";

const SHIPPING = 4000;

export default function Paid() {
  const cart = useCartStore();
  const { reset } = useCheckout();

  // Snapshot the order before clearing the cart.
  const [snapshot] = useState(() => ({
    total: cart.subtotal + SHIPPING,
    count: cart.count,
    seller: cart.items[0]?.product.pubkey.replace("pk_", "") ?? "ekko",
    firstId: cart.items[0]?.product.id ?? "lst_007",
  }));

  useEffect(() => {
    cart.clear();
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Head><title>Order placed · Shopstr</title></Head>
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 overflow-hidden bg-green px-6 py-10 text-center text-ink">
        {/* Reward stickers pop in staggered 60ms apart; simultaneous entry reads
            as a glitch. */}
        <Sticker name="shape-sparkle-4pt" className="pop-in absolute left-8 top-[14%] h-14 w-14" />
        <Sticker name="shape-daisy-yellow" className="pop-in absolute right-8 top-[22%] h-14 w-14 [animation-delay:60ms]" />

        <div className="z-10 grid h-[118px] w-[118px] place-items-center rounded-full bg-ink">
          <svg width="54" height="54" viewBox="0 0 24 24" fill="none" className="check-draw">
            <path d="M5 13l4 4L19 7" stroke="#25c26e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 className="ds-display z-10 text-4xl leading-[0.95]">Paid in<br /><span className="inline-flex items-center gap-2">full <Lightning size={32} /></span></h2>
        {/* The amount lands after the check has drawn. */}
        <div className="pop-in z-10 rounded-pill border-2 border-ink bg-paper-pure px-[18px] py-2.5 font-mono font-bold tabular-nums [animation-delay:300ms]">
          − {groupInt(snapshot.total)} sats
        </div>

        <div className="z-10 flex w-full max-w-[420px] flex-col gap-2.5 rounded-lg border-2 border-ink bg-paper-pure p-4 font-mono text-[0.82rem]">
          <div className="flex justify-between"><span className="text-text-muted">To</span><span>@{snapshot.seller}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Items</span><span>{snapshot.count}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Network</span><span>Lightning</span></div>
          <div className="mt-1 flex items-center justify-between border-t-2 border-paper-2 pt-2.5">
            <span className="inline-flex items-center gap-1.5 text-text-muted"><Key size={16} /> Your key</span>
            <Link href="/settings" className="font-bold text-purple underline">Back it up</Link>
          </div>
        </div>

        <p className="z-10 max-w-[420px] font-mono text-[0.72rem] text-[#0b3d22]">
          This same key is how @{snapshot.seller} reaches you about the order. Save it before you close.
        </p>

        <div className="z-10 flex w-full max-w-[420px] flex-col gap-2.5">
          <Link href={`/review/${snapshot.firstId}`} className="ds-press inline-flex w-full items-center justify-center gap-2 rounded-pill border-2 border-ink bg-ink py-3.5 font-bold text-text-on-dark">
            <Star weight="fill" size={18} /> Leave a review
          </Link>
          <div className="flex gap-2.5">
            <Link href="/marketplace" className="ds-press inline-flex flex-1 items-center justify-center rounded-pill border-2 border-ink bg-paper-pure py-3.5 font-bold">Keep browsing</Link>
            <Link href="/orders" className="ds-press inline-flex flex-1 items-center justify-center rounded-pill border-2 border-ink bg-paper-pure py-3.5 font-bold">View order</Link>
          </div>
        </div>
      </div>
    </>
  );
}

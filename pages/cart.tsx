import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { tEnter, tExit } from "@/lib/motion";
import { Lightning } from "@phosphor-icons/react";
import { useCartStore } from "@/data/hooks";
import { groupInt } from "@/lib/format";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { Sticker } from "@/components/ui/Sticker";

const SHIPPING = 4000;

export default function Cart() {
  const router = useRouter();
  const { items, subtotal, inc, dec } = useCartStore();

  return (
    <>
      <Head><title>Cart · Shopstr</title></Head>
      <SheetHeader title="Your cart" backTo="/marketplace" />

      <main className="mx-auto max-w-[760px] px-4 pb-28 pt-4 md:pb-12">
        {items.length === 0 ? (
          <div className="px-6 pt-16 text-center">
            <Sticker name="shape-starburst" className="mx-auto mb-4 h-20 w-20" />
            <p className="ds-display text-2xl">Cart&apos;s empty</p>
            <p className="mt-2 text-text-muted">Go find something worth keeping.</p>
            <Link href="/marketplace" className="mt-5 inline-block">
              <Button variant="secondary">Browse the market</Button>
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-2.5">
              <AnimatePresence initial={false}>
              {items.map((c) => (
                <motion.li
                  key={c.product.id + (c.size ?? "")}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16, transition: tExit }}
                  transition={tEnter}
                  className="flex items-center gap-3 rounded-lg border-2 border-ink bg-paper-pure p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.product.images[0]} alt="" className="h-14 w-14 shrink-0 rounded-md border-2 border-ink object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{c.product.title}</div>
                    <div className="font-mono text-sm text-text-muted tabular-nums">
                      {groupInt(c.product.price)} sats{c.size ? ` · ${c.size}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => dec(c.product.id)} aria-label="Decrease" className="ds-press grid h-8 w-8 place-items-center rounded-[9px] border-2 border-ink bg-paper-pure text-lg font-bold leading-none">−</button>
                    <span className="min-w-5 text-center font-mono font-bold tabular-nums">{c.quantity}</span>
                    <button onClick={() => inc(c.product.id)} aria-label="Increase" className="ds-press grid h-8 w-8 place-items-center rounded-[9px] border-2 border-ink bg-paper-pure text-lg font-bold leading-none">+</button>
                  </div>
                </motion.li>
              ))}
              </AnimatePresence>
            </ul>

            <div className="mt-4 rounded-lg border-2 border-purple bg-purple p-4 text-on-purple">
              <div className="mb-2 flex items-baseline justify-between font-mono text-sm">
                <span>Subtotal</span>
                <span className="tabular-nums">{groupInt(subtotal)} sats</span>
              </div>
              <div className="mb-2 flex items-baseline justify-between font-mono text-sm">
                <span>Shipping</span>
                <span className="tabular-nums">{groupInt(SHIPPING)} sats</span>
              </div>
              <div className="mb-3.5 flex items-baseline justify-between font-mono text-base font-bold">
                <span>Total</span>
                <span className="text-2xl tabular-nums">{groupInt(subtotal + SHIPPING)} sats</span>
              </div>
              <Button variant="accent" full onClick={() => router.push("/checkout")}>
                <span className="inline-flex items-center justify-center gap-2"><Lightning size={18} /> Checkout · pay with sats</span>
              </Button>
            </div>
          </>
        )}
      </main>

      <BottomNav active="/cart" />
    </>
  );
}

import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { tEnter, tExit } from "@/lib/motion";
import { Toast } from "@/components/ui/Toast";
import { Lightning } from "@phosphor-icons/react";
import { useCartStore } from "@/data/hooks";
import { groupInt } from "@/lib/format";
import { priceLine } from "@/lib/money";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LineItem } from "@/components/LineItem";

const SHIPPING = 4000;

export default function Cart() {
  const router = useRouter();
  const { items, subtotal, inc, dec } = useCartStore();

  // Removal notice. dec() drops the line at zero; the toast confirms it.
  const [toast, setToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );
  const decWithNotice = (id: string, quantity: number) => {
    dec(id);
    if (quantity === 1) {
      setToast(true);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(false), 2400);
    }
  };

  return (
    <>
      <Head><title>Cart · Shopstr</title></Head>
      <SheetHeader title="Your cart" backTo="/marketplace" contentMax="max-w-[760px] lg:max-w-[1100px]" />

      {/* Desktop: line items left, sticky order summary right. */}
      <main
        className={`mx-auto max-w-[760px] px-4 pb-28 pt-4 md:pb-12 ${
          items.length > 0 ? "lg:grid lg:max-w-[1100px] lg:grid-cols-[1fr_400px] lg:items-start lg:gap-8" : ""
        }`}
      >
        {items.length === 0 ? (
          <EmptyState
            headline="Cart's empty"
            body="Go find something worth keeping."
            cta={
              <Link href="/marketplace">
                <Button variant="secondary">Browse the market</Button>
              </Link>
            }
          />
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
                >
                  <LineItem
                    product={c.product}
                    sub={
                      <div className="font-mono text-sm text-text-muted tabular-nums">
                        {priceLine(c.product)}{c.size ? ` · ${c.size}` : ""}
                      </div>
                    }
                    trailing={
                      <div className="flex items-center gap-2">
                        <button onClick={() => decWithNotice(c.product.id, c.quantity)} aria-label="Decrease" className="ds-press grid h-8 w-8 place-items-center rounded-[6px] border-2 border-ink bg-paper-pure text-lg font-bold leading-none">−</button>
                        <span className="min-w-5 text-center font-mono font-bold tabular-nums">{c.quantity}</span>
                        <button onClick={() => inc(c.product.id)} aria-label="Increase" className="ds-press grid h-8 w-8 place-items-center rounded-[6px] border-2 border-ink bg-paper-pure text-lg font-bold leading-none">+</button>
                      </div>
                    }
                  />
                </motion.li>
              ))}
              </AnimatePresence>
            </ul>

            <div className="mt-4 rounded-lg border-2 border-purple bg-purple p-4 text-on-purple lg:sticky lg:top-24 lg:mt-0">
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

      <AnimatePresence>{toast && <Toast>Removed from cart</Toast>}</AnimatePresence>

      <BottomNav active="/cart" />
    </>
  );
}

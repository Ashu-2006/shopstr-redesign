import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { CaretLeft } from "@phosphor-icons/react";

/**
 * Sticky sheet header: back arrow + uppercase title + optional right slot.
 * Used by inbox, orders, wallet, settings, cart, thread. Back uses the router
 * unless an explicit `backTo` is given.
 */
export function SheetHeader({
  title,
  backTo,
  right,
}: {
  title: string;
  backTo?: string;
  right?: ReactNode;
}) {
  const router = useRouter();
  const onBack = () => (backTo ? router.push(backTo) : router.back());
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b-2 border-ink bg-paper px-4 py-3.5">
      <button
        onClick={onBack}
        aria-label="Back"
        className="ds-press grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-paper-pure"
      >
        <CaretLeft size={18} />
      </button>
      <h1 className="ds-display text-lg">{title}</h1>
      <div className="ml-auto flex items-center gap-2">{right}</div>
    </header>
  );
}

import Link from "next/link";
import { useRouter } from "next/router";
import type { ProductData } from "@/data/types";
import { useCartStore } from "@/data/hooks";
import { priceLabel } from "@/lib/catalog";

/** A recommended-listing row with a one-tap Buy (claim / withdraw retention). */
export function RecRow({ product }: { product: ProductData }) {
  const router = useRouter();
  const cart = useCartStore();
  const buy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cart.add(product.id, 1);
    router.push("/checkout");
  };
  return (
    <Link href={`/listing/${product.id}`} className="ds-press flex items-center gap-3 rounded-lg border-2 border-ink bg-paper-pure p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.images[0]} alt="" className="h-[50px] w-[50px] shrink-0 rounded-md border-2 border-ink object-cover" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold leading-tight">{product.title}</div>
        <div className="mt-0.5 font-mono text-[0.82rem] font-bold tabular-nums">{priceLabel(product)}</div>
      </div>
      <button onClick={buy} className="shrink-0 rounded-pill bg-ink px-3.5 py-2 text-[0.78rem] font-bold text-text-on-dark">Buy</button>
    </Link>
  );
}

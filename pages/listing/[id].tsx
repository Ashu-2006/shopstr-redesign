import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  useListing,
  useListings,
  useProfile,
  useReviews,
  useCartStore,
  useSession,
  averageRating,
} from "@/data/hooks";
import { formatSats, groupInt, timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Stars } from "@/components/ui/Stars";
import { Sticker } from "@/components/ui/Sticker";
import { SellerStrip } from "@/components/SellerStrip";
import { ProductCard } from "@/components/ProductCard";
import { TopBar } from "@/components/ui/TopBar";
import { BottomNav } from "@/components/ui/BottomNav";

export default function ListingDetail() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";

  const { data: product, isLoading } = useListing(id);
  const { data: seller } = useProfile(product?.pubkey ?? "");
  const { data: reviews } = useReviews(product?.pubkey ?? "");
  const { data: allListings } = useListings();
  const cart = useCartStore();
  const { favs, toggleFav, walletBalance } = useSession();

  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState<string | null>(null);

  if (!isLoading && !product) {
    return (
      <>
        <TopBar cartCount={cart.count} />
        <main className="mx-auto max-w-[700px] px-4 py-24 text-center">
          <p className="ds-display text-3xl">Listing not found</p>
          <Link href="/marketplace" className="mt-4 inline-block font-bold text-purple underline">
            Back to marketplace
          </Link>
        </main>
        <BottomNav active="/marketplace" />
      </>
    );
  }
  if (!product) return null;

  const avg = averageRating(reviews.scores);
  const type = product.categories.find((c) =>
    ["Digital", "Service", "Resale", "Exchange", "Swap"].includes(c)
  );
  const others = allListings.filter((l) => l.pubkey === product.pubkey && l.id !== product.id).slice(0, 4);
  const shippingLine =
    product.shippingCost === 0
      ? `${product.shippingType ?? "Shipping"} · free`
      : `${product.shippingType ?? "Shipping"} · ${formatSats(product.shippingCost ?? 0)}`;
  const isFav = favs.has(product.id);
  const walletCovers = product.price <= walletBalance;

  const buyNow = () => {
    cart.add(product.id, 1, size ?? undefined);
    router.push("/checkout");
  };
  const addToCart = () => cart.add(product.id, 1, size ?? undefined);

  return (
    <>
      <Head>
        <title>{product.title} · Shopstr</title>
        <meta name="description" content={product.summary} />
      </Head>

      <TopBar searchHref="/search" cartCount={cart.count} />

      <main className="mx-auto max-w-[1100px] px-4 pb-44 pt-4 md:grid md:grid-cols-2 md:gap-10 md:pb-12">
        {/* ---- Gallery ---- */}
        <div className="md:sticky md:top-24 md:self-start">
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="ds-press inline-flex items-center gap-1.5 rounded-pill border-2 border-ink bg-paper-pure px-4 py-2 text-sm font-bold"
            >
              ← Back
            </button>
            <button
              onClick={() => toggleFav(product.id)}
              aria-pressed={isFav}
              aria-label="Save"
              className={`ds-press grid h-10 w-10 place-items-center rounded-full border-2 border-ink ${
                isFav ? "bg-pink" : "bg-paper-pure"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? "#121212" : "none"}>
                <path d="M12 21s-7-4.6-9.5-9C1 9 2.5 5 6 5c2 0 3.2 1.3 4 2.5C10.8 6.3 12 5 14 5c3.5 0 5 4 3.5 7-2.5 4.4-9.5 9-9.5 9z" stroke="#121212" strokeWidth="2" />
              </svg>
            </button>
          </div>

          <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-paper-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.images[activeImg]} alt={product.title} className="aspect-square w-full object-cover" />
            {type && (
              <span className="absolute left-3 top-3">
                <Pill tone="ink">{type}</Pill>
              </span>
            )}
            <Sticker name="badge-bff-star" className="pointer-events-none absolute right-3 top-3 h-14 w-14" />
          </div>

          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2.5">
              {product.images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActiveImg(i)}
                  aria-label={`Image ${i + 1}`}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 ds-press ${i === activeImg ? "border-purple" : "border-ink"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---- Info ---- */}
        <div className="mt-5 flex flex-col gap-5 md:mt-0">
          <div>
            <h1 className="ds-display text-3xl leading-[0.95] md:text-4xl">{product.title}</h1>
            <div className="mt-3 flex items-end gap-3">
              <span className="font-mono text-4xl font-bold leading-none tabular-nums">{groupInt(product.price)}</span>
              <span className="pb-1 font-mono text-sm text-text-muted">sats</span>
            </div>
            <p className="mt-1.5 font-mono text-xs text-text-subtle">{formatSats(product.totalCost)} total with shipping</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {product.condition && <Pill tone="green">{product.condition}</Pill>}
            <Pill>{product.location}</Pill>
            {product.quantity != null && product.quantity <= 5 && <Pill tone="red">Only {product.quantity} left</Pill>}
          </div>

          <p className="text-[0.98rem] leading-relaxed text-text-muted">{product.summary}</p>

          {product.sizes && product.sizes.length > 0 && (
            <div>
              <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-text-muted">Size</h2>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <Pill key={s} interactive active={size === s} onClick={() => setSize(size === s ? null : s)}>
                    {s}
                  </Pill>
                ))}
              </div>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border-2 border-ink bg-ink text-sm">
            {[
              ["Shipping", shippingLine],
              ["Ships from", product.location],
              ["Category", product.categories.filter((c) => !["Digital", "Service", "Resale", "Exchange", "Swap", "Physical"].includes(c)).join(", ") || "—"],
              ["Quantity", product.quantity != null ? `${groupInt(product.quantity)} available` : "—"],
            ].map(([k, v]) => (
              <div key={k} className="bg-paper-pure p-3">
                <dt className="font-mono text-[0.66rem] uppercase tracking-[0.1em] text-text-subtle">{k}</dt>
                <dd className="mt-0.5 font-medium">{v}</dd>
              </div>
            ))}
          </dl>

          {seller && <SellerStrip profile={seller} avg={avg} count={reviews.scores.length} />}

          {reviews.comments && reviews.comments.length > 0 && (
            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="ds-display text-xl">Reviews</h2>
                <Stars avg={avg} count={reviews.scores.length} className="text-sm" />
              </div>
              <ul className="flex flex-col gap-2.5">
                {reviews.comments.map((c) => (
                  <li key={c.id} className="rounded-lg border-2 border-ink bg-paper-pure p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold tabular-nums">★ {c.score.toFixed(1)}</span>
                      <span className="font-mono text-[0.7rem] text-text-subtle">{timeAgo(c.createdAt, 1717372800000)}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-text-muted">{c.text}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {others.length > 0 && (
            <section>
              <h2 className="ds-display mb-3 text-xl">More from @{seller?.handle}</h2>
              <div className="grid grid-cols-2 gap-3">
                {others.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ---- Sticky buy control row ---- */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 md:pb-6">
        <div className="mx-auto max-w-[1100px]">
          {walletCovers && (
            <div className="mb-2 flex items-center justify-center gap-1.5 rounded-pill border-2 border-purple bg-purple-soft px-3.5 py-2 font-mono text-[0.72rem] font-bold text-purple-press">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="2" />
                <path d="M16 12h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Pay from your Shopstr wallet · {formatSats(walletBalance)} available
            </div>
          )}
          <div className="flex items-center gap-2.5 rounded-2xl border-2 border-ink bg-ink p-3">
            <div className="hidden flex-col pl-2 pr-3 text-text-on-dark sm:flex">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-[#bdbcb4]">
                {walletCovers ? "From wallet" : "Price"}
              </span>
              <span className="font-mono text-lg font-bold leading-none tabular-nums">{groupInt(product.price)}</span>
            </div>
            <Button variant="secondary" full className="flex-1" onClick={buyNow}>
              {walletCovers ? "Buy with sats" : "Buy now"}
            </Button>
            <button onClick={addToCart} aria-label="Add to cart" className="ds-press grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-yellow">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M5 7h14l-1.4 11H6.4L5 7z" stroke="#121212" strokeWidth="2" strokeLinejoin="round" />
                <path d="M8.5 7a3.5 3.5 0 017 0" stroke="#121212" strokeWidth="2" />
              </svg>
            </button>
            <Link
              href={`/messages/${seller?.handle ?? ""}?pid=${product.id}&from=listing`}
              aria-label="Message seller"
              className="ds-press grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-green"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 5h16v11H9l-4 3V5z" stroke="#121212" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

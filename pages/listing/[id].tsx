import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { dur, ease, tExit } from "@/lib/motion";
import {
  useListing,
  useListings,
  useProfile,
  useReviews,
  useCartStore,
  useSession,
  useCommunitiesForListing,
  profileByPubkey,
  averageRating,
} from "@/data/hooks";
import { Heart, Lightning, ShoppingBag, ChatCircle, Star, UsersThree, MapPin } from "@phosphor-icons/react";
import { formatSats, groupInt, timeAgo } from "@/lib/format";
import { shippingLabel, fulfilmentOptions } from "@/lib/fulfilment";
import { quotedPrice, satsFor } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Stars } from "@/components/ui/Stars";
import { Sticker } from "@/components/ui/Sticker";
import { SellerStrip } from "@/components/SellerStrip";
import { ReviewCard } from "@/components/ReviewCard";
import { ListingCard } from "@/components/ListingCard";
import { TopBar } from "@/components/ui/TopBar";
import { BottomNav } from "@/components/ui/BottomNav";
import { Toast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListingDetailSkeleton } from "@/components/skeletons";

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

  // Add-to-cart reward: a sparkle pops off the bag button (keyed so rapid taps
  // replay) and a toast confirms. Pages own the timers; Toast stays pure.
  const [addedPop, setAddedPop] = useState(0);
  const [toast, setToast] = useState(false);
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (popTimer.current) clearTimeout(popTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  // Communities where members discussed this exact listing. Read before the
  // early returns below: hooks must run in the same order on every render.
  const discussedIn = useCommunitiesForListing(product?.id ?? "");

  // Only declare a listing genuinely missing once the router is ready with a
  // real id. During a route change the id momentarily empties; showing
  // "not found" then (or flashing it before hydration) is wrong.
  if (router.isReady && id && !isLoading && !product) {
    return (
      <>
        <TopBar cartCount={cart.count} />
        <main className="mx-auto max-w-[700px] px-4 py-16">
          <EmptyState
            sticker="shape-daisy-yellow"
            headline="Listing not found"
            body="It may have sold or been taken down."
            cta={
              <Link href="/marketplace">
                <Button variant="secondary">Back to the market</Button>
              </Link>
            }
          />
        </main>
        <BottomNav active="/marketplace" />
      </>
    );
  }
  // Loading (or a route transition with an empty id): skeleton-first, never a
  // blank screen. Mirrors the populated two-column layout so nothing reflows.
  if (!product) {
    return (
      <>
        <TopBar searchHref="/search" cartCount={cart.count} />
        <ListingDetailSkeleton />
        <BottomNav active="/marketplace" />
      </>
    );
  }

  const avg = averageRating(reviews.reviews);
  const type = product.categories.find((c) =>
    ["Digital", "Service", "Resale", "Exchange", "Swap"].includes(c)
  );
  const others = allListings.filter((l) => l.pubkey === product.pubkey && l.id !== product.id).slice(0, 4);
  // The shipping TYPE is a protocol enum ("Added Cost"), never user-facing copy.
  // shippingLabel turns it into the truth for this listing, and the fulfilment
  // options decide whether pickup/shipping may even be offered.
  const shippingLine = shippingLabel(product, formatSats);
  const { canShip, canPickup } = fulfilmentOptions(product.shippingType);
  const quoted = quotedPrice(product);
  const isFav = favs.has(product.id);
  const walletCovers = (satsFor(product) ?? Infinity) <= walletBalance;

  const buyNow = () => {
    cart.add(product.id, 1, size ?? undefined);
    router.push("/checkout");
  };
  const addToCart = () => {
    cart.add(product.id, 1, size ?? undefined);
    setAddedPop((k) => k + 1);
    setToast(true);
    if (popTimer.current) clearTimeout(popTimer.current);
    popTimer.current = setTimeout(() => setAddedPop(0), 900);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(false), 2400);
  };

  // One source of truth for the purchase controls. Mobile/tablet renders it in
  // the fixed bottom bar; lg+ renders it inline in the info column (buy box).
  const buyControls = (
    <>
      {walletCovers && (
        <div className="mb-2 flex items-center justify-center gap-1.5 rounded-pill border-2 border-purple bg-purple-soft px-3.5 py-2 font-mono text-[0.72rem] font-bold text-purple-press">
          <Lightning size={14} />
          Pay from your Shopstr wallet · {formatSats(walletBalance)} available
        </div>
      )}
      <div className="flex items-center gap-2.5 rounded-2xl border-2 border-ink bg-ink p-3">
        <div className="hidden flex-col pl-2 pr-3 text-text-on-dark sm:flex">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-text-on-dark-muted">
            {walletCovers ? "From wallet" : "Price"}
          </span>
          <span className="font-mono text-lg font-bold leading-none tabular-nums">{groupInt(satsFor(product) ?? 0)}</span>
        </div>
        <Button variant="secondary" full className="flex-1" onClick={buyNow}>
          {walletCovers ? "Buy with sats" : "Buy now"}
        </Button>
        <span className="relative">
          <button onClick={addToCart} aria-label="Add to cart" className="ds-press grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-yellow text-ink">
            <ShoppingBag size={22} />
          </button>
          {/* On-action reveal: the sparkle pops off the bag. The one sanctioned
              jumpy moment on this screen; opacity resolves fast+smooth while the
              transform overshoots. */}
          <AnimatePresence>
            {addedPop > 0 && (
              <motion.span
                key={addedPop}
                aria-hidden
                initial={{ opacity: 0, scale: 0.4, rotate: -20, y: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: 8,
                  y: -34,
                  transition: {
                    duration: dur.moderate,
                    ease: ease.jumpy,
                    opacity: { duration: dur.fast, ease: ease.smooth },
                  },
                }}
                exit={{ opacity: 0, transition: tExit }}
                className="pointer-events-none absolute -top-9 left-1/2 -ml-6 h-12 w-12"
              >
                <Sticker name="shape-sparkle-4pt" className="h-full w-full" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <Link
          href={`/messages/${seller?.handle ?? ""}?pid=${product.id}&from=listing`}
          aria-label="Message seller"
          className="ds-press grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-green text-ink"
        >
          <ChatCircle size={22} />
        </Link>
      </div>
    </>
  );

  return (
    <>
      <Head>
        <title>{product.title} · Shopstr</title>
        <meta name="description" content={product.summary} />
      </Head>

      <TopBar searchHref="/search" cartCount={cart.count} />

      <main className="mx-auto max-w-[1100px] px-4 pb-44 pt-4 md:grid md:grid-cols-2 md:gap-10 lg:pb-16">
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
              <Heart size={18} weight={isFav ? "fill" : "bold"} />
            </button>
          </div>

          <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-paper-3">
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
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 ds-press lg:h-20 lg:w-20 ${i === activeImg ? "border-purple" : "border-ink"}`}
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
            {/* A fiat-quoted listing leads with the seller's number, because that
                is what they committed to; sats follow as the settlement amount. */}
            <div className="mt-3 flex items-end gap-3">
              <span className="font-mono text-4xl font-bold leading-none tabular-nums">
                {quoted.quoted}
              </span>
              {!quoted.converted && <span className="pb-1 font-mono text-sm text-text-muted">sats</span>}
            </div>
            {quoted.converted && (
              <p className="mt-1.5 font-mono text-xs font-bold text-purple">
                {quoted.sats === null
                  ? "Sats amount unavailable right now"
                  : `≈ ${groupInt(quoted.sats)} sats · locked at checkout`}
              </p>
            )}
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

          {/* Desktop buy box: the CTA lives with the product, not in a viewport-wide bar. */}
          <div className="hidden lg:block">{buyControls}</div>

          {/* Pickup-only is a hard constraint, not a footnote: it decides
              whether this item can reach the buyer at all. */}
          {canPickup && (
            <div className={`flex items-start gap-2.5 rounded-xl border-2 border-ink p-3 ${canShip ? "bg-blue-soft" : "bg-yellow"}`}>
              <MapPin size={18} weight="bold" className="mt-0.5 shrink-0" />
              <div className="text-sm leading-snug">
                <b>{canShip ? "Ship or collect in person" : "Collection only"}</b>
                {product.pickupLocations?.length ? (
                  <span className="block font-mono text-[0.7rem] text-text-muted">
                    {product.pickupLocations.join(" · ")}
                  </span>
                ) : null}
                {!canShip && (
                  <span className="block font-mono text-[0.7rem] text-text-muted">
                    This seller does not post this item.
                  </span>
                )}
              </div>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border-2 border-ink bg-ink text-sm">
            {[
              ["Shipping", shippingLine],
              [canShip ? "Ships from" : "Collect from", product.location],
              ["Category", product.categories.filter((c) => !["Digital", "Service", "Resale", "Exchange", "Swap", "Physical"].includes(c)).join(", ") || "-"],
              ["Quantity", product.quantity != null ? `${groupInt(product.quantity)} available` : "-"],
            ].map(([k, v]) => (
              <div key={k} className="bg-paper-pure p-3">
                <dt className="font-mono text-[0.66rem] uppercase tracking-[0.1em] text-text-subtle">{k}</dt>
                <dd className="mt-0.5 font-medium">{v}</dd>
              </div>
            ))}
          </dl>

          {seller && <SellerStrip profile={seller} avg={avg} count={reviews.reviews.length} />}

          {/* Ask before you buy: if members discussed this item in a moderated
              community, that is the strongest pre-purchase trust signal we have. */}
          {discussedIn.length > 0 && (
            <div className="flex flex-col gap-2">
              {discussedIn.map(({ community, postCount }) => (
                <Link
                  key={community.slug}
                  href={`/communities/${community.slug}`}
                  className="ds-press flex items-center gap-3 rounded-xl border-2 border-ink bg-blue-soft p-3"
                >
                  <UsersThree size={20} weight="bold" className="shrink-0" />
                  <span className="min-w-0 flex-1 text-sm leading-snug">
                    Discussed in <b>{community.name}</b>
                    <span className="font-mono text-[0.68rem] text-text-muted tabular-nums">
                      {" "}· {postCount} post{postCount === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[0.62rem] font-bold uppercase tracking-[0.08em] text-purple">
                    Read →
                  </span>
                </Link>
              ))}
            </div>
          )}

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="ds-display text-xl">Reviews</h2>
              {reviews.reviews.length > 0 && (
                <Stars avg={avg} count={reviews.reviews.length} className="text-sm" />
              )}
            </div>
            {reviews.reviews.length > 0 ? (
              <ul className="flex flex-col gap-2.5">
                {reviews.reviews.slice(0, 4).map((r) => (
                  <ReviewCard
                    key={r.id}
                    review={r}
                    now={1717372800000}
                    authorHandle={profileByPubkey(r.authorPubkey)?.handle}
                  />
                ))}
              </ul>
            ) : (
              <EmptyState
                variant="inline"
                headline="No reviews yet"
                body="Be the first after you buy."
                className="!py-8"
              />
            )}
          </section>

        </div>

        {/* Related items span both columns: an orphaned grid under the buy box reads
            as part of the purchase decision; full-width it reads as browsing. */}
        {others.length > 0 && (
          <section className="mt-8 md:col-span-2 md:mt-2">
            <h2 className="ds-display mb-3 text-xl">More from @{seller?.handle}</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {others.map((p) => (
                <ListingCard key={p.id} product={p} density="tile" fav={favs.has(p.id)} onToggleFav={toggleFav} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ---- Fixed buy bar: mobile/tablet only. Desktop gets the inline buy box. ---- */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 md:pb-6 lg:hidden">
        <div className="mx-auto max-w-[1100px]">{buyControls}</div>
      </div>

      <AnimatePresence>
        {toast && (
          <Toast
            action={
              <Link href="/cart" className="underline underline-offset-2">
                View cart
              </Link>
            }
          >
            Added to cart
          </Toast>
        )}
      </AnimatePresence>
    </>
  );
}

import Head from "next/head";
import { useRouter } from "next/router";
import {
  useCategoryListings,
  useCartStore,
  useSession,
  ratingForPubkey,
} from "@/data/hooks";
import { CaretLeft, MagnifyingGlass } from "@phosphor-icons/react";
import { catMeta, toneBg } from "@/lib/catalog";
import { BottomNav } from "@/components/ui/BottomNav";
import { SectionTitle } from "@/components/ui/Section";
import { Sticker } from "@/components/ui/Sticker";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ListingRowSkeleton } from "@/components/skeletons";
import { ListingCard } from "@/components/ListingCard";
import { FeatureCard } from "@/components/FeatureCard";
import Link from "next/link";

export default function CategoryScreen() {
  const router = useRouter();
  const raw = router.query.category;
  const category = typeof raw === "string" ? decodeURIComponent(raw) : "";
  const { data: listings, isLoading } = useCategoryListings(category);
  const { count } = useCartStore();
  const { favs, toggleFav } = useSession();

  if (!category) return null;

  const meta = catMeta(category);
  const spotlight = listings[0];

  return (
    <>
      <Head>
        <title>{category} · Shopstr</title>
      </Head>

      {/* Colored hero: takes the category's accent (smart-opens into this color) */}
      <header className={`cat-pop relative overflow-hidden border-b-2 border-ink ${toneBg(meta.tone)}`}>
        <div className="mx-auto max-w-[1240px] px-4 pb-6 pt-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              aria-label="Back"
              className={`ds-press grid h-10 w-10 place-items-center rounded-full border-2 ${
                meta.onDark ? "border-white/60 text-white" : "border-ink text-ink"
              } bg-paper-pure/15`}
            >
              <CaretLeft size={18} />
            </button>
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.18em]">Category</span>
            <Link
              href="/search"
              aria-label="Search"
              className={`ds-press grid h-10 w-10 place-items-center rounded-full border-2 ${
                meta.onDark ? "border-white/60 text-white" : "border-ink text-ink"
              } bg-paper-pure/15`}
            >
              <MagnifyingGlass size={18} />
            </Link>
          </div>
          <Sticker name={meta.sticker} className="spin-slow pointer-events-none absolute -right-4 top-10 h-28 w-28 opacity-90" />
          <h1 className="ds-display mt-5 text-5xl leading-[0.86]">{category}</h1>
          {/* Count only when true: never "0 listings" while loading or empty. */}
          {isLoading ? (
            <Skeleton shape="line" w={150} className="mt-2.5 opacity-60" />
          ) : (
            <p className="mt-2.5 font-mono text-sm opacity-85">
              {listings.length > 0
                ? `${listings.length} listing${listings.length === 1 ? "" : "s"} · priced in sats`
                : "Priced in sats"}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-4 pb-28 pt-4 md:pb-12">
        {spotlight && (
          <FeatureCard
            product={spotlight}
            format="spotlight"
            kicker={`Spotlight · ${category}`}
          />
        )}

        <SectionTitle note={listings.length > 0 ? `${listings.length} items` : undefined}>
          All {category}
        </SectionTitle>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <ListingRowSkeleton key={i} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            sticker={meta.sticker}
            headline="Nothing here yet"
            body={`No ${category.toLowerCase()} listed right now. Check back soon, or browse the rest of the market.`}
            cta={
              <Link href="/marketplace">
                <Button variant="secondary">Back to the market</Button>
              </Link>
            }
          />
        ) : (
          <div className="stagger grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {listings.map((p, i) => (
              <div key={p.id} className="self-start" style={{ animationDelay: `${i * 55}ms` }}>
                <ListingCard
                  product={p}
                  rating={ratingForPubkey(p.pubkey)}
                  fav={favs.has(p.id)}
                  onToggleFav={toggleFav}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav active="/marketplace" />
    </>
  );
}

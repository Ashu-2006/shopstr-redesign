import Head from "next/head";
import { useState } from "react";
import { useListings } from "@/data/hooks";
import { ListingCard } from "@/components/ListingCard";
import { FeatureCard } from "@/components/FeatureCard";
import { LineItem } from "@/components/LineItem";
import { ListingRowSkeleton } from "@/components/skeletons";
import { Minus, Plus } from "@phosphor-icons/react";

/* Dev-only gallery of the consolidated card system, so every variant is
   reviewable on one screen before migration. Not linked from the app.
   Route: /dev/cards

   The system: three cards, one axis of variation each.
   - ListingCard (density row | tile)  ->  "is this worth opening?"
   - FeatureCard (format hero | break) ->  the editorial argument
   - LineItem    (trailing slot)       ->  "is this the thing I chose?"
   Rule: a new variant requires a new user decision, not a new page. */

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="ds-display text-xl">{title}</h2>
        <span className="font-mono text-[0.66rem] text-text-subtle">{note}</span>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Decision({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 max-w-[68ch] border-l-2 border-purple pl-3 text-[0.82rem] leading-snug text-text-muted">
      {children}
    </p>
  );
}

export default function CardsPlayground() {
  const { data: listings, isLoading } = useListings();
  const [favs, setFavs] = useState<Set<string>>(() => new Set());
  const toggleFav = (id: string) =>
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const p = listings ?? [];
  const rating = { avg: 4.8, count: 31 };

  return (
    <>
      <Head>
        <title>Card system playground · Shopstr dev</title>
      </Head>
      <main className="mx-auto max-w-[1100px] px-4 py-8 pb-24">
        <h1 className="ds-display text-3xl">The card system</h1>
        <p className="mt-2 max-w-[68ch] text-text-muted">
          Three cards, five variants, down from nine components. Variation is driven by the
          decision the user is making, never by the page the card lands on.
        </p>

        <div className="my-8 h-0.5 bg-ink/15" />

        {isLoading || p.length < 6 ? (
          <div className="grid gap-3.5 lg:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <ListingRowSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {/* ---------------------------------------------------------------- */}
            <Section
              title="ListingCard · density=&quot;row&quot;"
              note="components/ListingCard.tsx · default on every vertical feed"
            >
              <Decision>
                The locked H5 editorial row, now with the save heart and rating that used to be
                search-only. Saving a listing is a marketplace capability, not a search feature.
                Complete anatomy: tint well, type + category chips, display title, 2-line summary,
                price, trust line.
              </Decision>
              <div className="grid gap-3.5 lg:grid-cols-2">
                <ListingCard product={p[0]} rating={rating} fav={favs.has(p[0].id)} onToggleFav={toggleFav} />
                <ListingCard product={p[1]} rating={{ avg: 5, count: 4 }} fav={favs.has(p[1].id)} onToggleFav={toggleFav} />
                <ListingCard product={p[2]} fav={favs.has(p[2].id)} onToggleFav={toggleFav} />
                <ListingCard product={p[3]} />
              </div>
              <p className="mt-2 font-mono text-[0.66rem] text-text-subtle">
                Row 2: no rating (renders nothing, never &quot;0 reviews&quot;). Row 2 right: no
                onToggleFav, heart absent (e.g. seller viewing their own stock).
              </p>
            </Section>

            {/* ---------------------------------------------------------------- */}
            <Section
              title="ListingCard · density=&quot;tile&quot;"
              note="same component · rails + dense grids only"
            >
              <Decision>
                Framed image, open body. The stroke stays on the image (images always carry a
                frame); text hangs below unboxed so grids read light instead of double-bordered
                and cramped. Same tint source, same heart, same chip, same price treatment as the
                row. Kills the ProductCard / ResultCard / NearCard three-way disagreement, and the
                yellow price chip that meant nothing systemically.
              </Decision>
              <div className="mb-2 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">
                In a grid (2-up mobile, 4-up desktop)
              </div>
              <div className="grid grid-cols-2 gap-x-3.5 gap-y-5 md:grid-cols-4">
                {p.slice(0, 4).map((x) => (
                  <ListingCard
                    key={x.id}
                    product={x}
                    density="tile"
                    rating={rating}
                    fav={favs.has(x.id)}
                    onToggleFav={toggleFav}
                  />
                ))}
              </div>
              <div className="mb-2 mt-6 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">
                In a horizontal rail (fixed width via className, not a new component)
              </div>
              <div className="flex snap-x gap-3.5 overflow-x-auto pb-2">
                {p.slice(2, 8).map((x) => (
                  <ListingCard
                    key={x.id}
                    product={x}
                    density="tile"
                    className="w-[200px] shrink-0 snap-start"
                  />
                ))}
              </div>
            </Section>

            {/* ---------------------------------------------------------------- */}
            <Section
              title="FeatureCard · format=&quot;hero&quot;"
              note="components/FeatureCard.tsx · featured carousel only"
            >
              <Decision>
                The H1 overlay slot, unchanged: numeral, gradient scrim, category pill, sticker.
                Editorial by definition, so it appears once per surface, in the carousel.
              </Decision>
              <div className="overflow-hidden rounded-xl border-2 border-ink">
                <FeatureCard product={p[4]} format="hero" n={1} />
              </div>
            </Section>

            {/* ---------------------------------------------------------------- */}
            <Section
              title="FeatureCard · format=&quot;break&quot;"
              note="same component · one per feed, tone is a prop"
            >
              <Decision>
                The H4 mid-feed break. Accent background is now a tone prop (green default) so the
                break can rotate color without a new component. Text stays ink on every accent.
                CategoryFeature and FeaturedTile are retired: dead code doing this same job.
              </Decision>
              <div className="grid gap-4">
                <FeatureCard product={p[5]} format="break" kicker="Editor's pick" />
                <FeatureCard product={p[6] ?? p[0]} format="break" kicker="Trending in zines" tone="yellow" />
              </div>
            </Section>

            {/* ---------------------------------------------------------------- */}
            <Section
              title="LineItem · the trailing slot"
              note="components/LineItem.tsx · cart, orders, recs, chat quotes"
            >
              <Decision>
                One confirmation row, written once. Identity + price only, no discovery
                affordances. The trailing slot is the only variation: Buy in recommendations,
                stepper in cart, status pill in orders, nothing in a chat quote. Replaces RecRow,
                the cart line, the orders line and QuotedCard, and moves the cart logic out of the
                component (pages own behavior, components stay pure).
              </Decision>
              <div className="grid max-w-[560px] gap-3">
                <div>
                  <div className="mb-1.5 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">
                    Recommendation · trailing = Buy
                  </div>
                  <LineItem
                    product={p[0]}
                    trailing={
                      <span className="rounded-pill bg-ink px-3.5 py-2 text-[0.78rem] font-bold text-text-on-dark">
                        Buy
                      </span>
                    }
                  />
                </div>
                <div>
                  <div className="mb-1.5 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">
                    Cart · meta = qty, trailing = stepper
                  </div>
                  <LineItem
                    product={p[1]}
                    meta="Qty 2"
                    trailing={
                      <span className="inline-flex items-center gap-1">
                        <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-paper-pure">
                          <Minus size={13} weight="bold" />
                        </span>
                        <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-paper-pure">
                          <Plus size={13} weight="bold" />
                        </span>
                      </span>
                    }
                  />
                </div>
                <div>
                  <div className="mb-1.5 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">
                    Order · trailing = status pill
                  </div>
                  <LineItem
                    product={p[2]}
                    meta="Aug 9"
                    trailing={
                      <span className="rounded-pill border-2 border-ink bg-green px-2.5 py-1 text-xs font-semibold text-ink">
                        Shipped
                      </span>
                    }
                  />
                </div>
                <div>
                  <div className="mb-1.5 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">
                    Chat quote · size=&quot;sm&quot; frame=&quot;quiet&quot; (light bubble / ink bubble)
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div className="rounded-xl border-2 border-ink bg-paper-pure p-2.5">
                      <LineItem product={p[3]} size="sm" frame="quiet" />
                    </div>
                    <div className="rounded-xl bg-ink p-2.5">
                      <LineItem product={p[3]} size="sm" frame="quiet" onDark />
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* ---------------------------------------------------------------- */}
            <Section title="Not cards" note="SolidTile + SellerCard stay as-is">
              <p className="max-w-[68ch] text-[0.82rem] leading-snug text-text-muted">
                SolidTile (category nav, no product, no price) and SellerCard (a seller entity, not
                a listing) are different objects answering different questions. They keep their own
                components; CategoryTile in BentoTile.tsx retires since SolidTile already does that
                job.
              </p>
            </Section>
          </>
        )}
      </main>
    </>
  );
}

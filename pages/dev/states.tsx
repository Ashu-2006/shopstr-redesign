import Head from "next/head";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import {
  HeroSkeleton,
  ListCardSkeleton,
  ProductCardSkeleton,
  NearCardSkeleton,
  SellerCardSkeleton,
  RowSkeleton,
  ListingDetailSkeleton,
} from "@/components/skeletons";

/* Dev-only gallery of every loading + empty state in the system, so the whole
   vocabulary is reviewable on one screen. Not linked from the app.
   Route: /dev/states */

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="ds-display text-xl">{title}</h2>
        <span className="font-mono text-[0.66rem] text-text-subtle">{note}</span>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function StatesPlayground() {
  return (
    <>
      <Head><title>States playground · Shopstr dev</title></Head>
      <main className="mx-auto max-w-[1100px] px-4 py-8 pb-24">
        <h1 className="ds-display text-3xl">Loading + empty states</h1>
        <p className="mt-2 max-w-[60ch] text-text-muted">
          The full vocabulary. One sweep (`.ds-skeleton`, 1.6s, paper tokens), no spinners
          anywhere. Card skeletons keep the live ink frame and mirror real geometry so
          nothing reflows when data lands.
        </p>

        <div className="my-8 h-0.5 bg-ink/15" />

        <Section title="Skeleton primitive" note="components/ui/Skeleton.tsx · line / rect / circle">
          <div className="flex flex-col gap-4 rounded-lg border-2 border-ink bg-paper-pure p-5 sm:flex-row sm:items-center sm:gap-10">
            <div className="flex-1">
              <div className="mb-2 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">line</div>
              <Skeleton shape="line" />
              <Skeleton shape="line" w="70%" className="mt-2" />
              <Skeleton shape="line" w="45%" className="mt-2" />
            </div>
            <div>
              <div className="mb-2 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">rect</div>
              <Skeleton shape="rect" w={120} h={72} />
            </div>
            <div>
              <div className="mb-2 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">circle</div>
              <Skeleton shape="circle" w={56} h={56} />
            </div>
          </div>
        </Section>

        <Section title="Hero" note="HeroSkeleton · marketplace featured carousel (full-bleed, borderless)">
          <HeroSkeleton />
        </Section>

        <Section title="List card (H5, the default)" note="ListCardSkeleton · feeds, category, marketplace For-you">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <ListCardSkeleton />
            <ListCardSkeleton />
          </div>
        </Section>

        <Section title="Grid card" note="ProductCardSkeleton · shop items, sell/mine, more-from-seller">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </Section>

        <Section title="Rails" note="NearCardSkeleton + SellerCardSkeleton · horizontal scroll rails">
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
            <NearCardSkeleton />
            <NearCardSkeleton />
            <SellerCardSkeleton />
            <SellerCardSkeleton />
          </div>
        </Section>

        <Section title="Rows" note="RowSkeleton · card frame (orders/cart) vs divider frame (inbox sq-48, wallet circle-36)">
          <div className="mb-4 flex flex-col gap-2.5">
            <RowSkeleton />
            <RowSkeleton />
          </div>
          <RowSkeleton frame="divider" avatar="square" avatarSize={48} />
          <RowSkeleton frame="divider" avatar="circle" avatarSize={36} />
        </Section>

        <Section title="Search" note="local skeletons in pages/search.tsx · suggestion rows + result cards">
          <div className="mb-4 max-w-[420px]">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 border-b-2 border-paper-2 py-3.5">
                <Skeleton shape="circle" w={16} h={16} />
                <Skeleton shape="line" w={`${40 + i * 14}%`} h="1.25rem" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex flex-col">
                <div className="overflow-hidden rounded-lg border-2 border-ink">
                  <Skeleton shape="rect" className="aspect-square !rounded-none" w="100%" />
                </div>
                <div className="mt-2">
                  <Skeleton shape="line" w="80%" h="0.95rem" />
                  <Skeleton shape="line" w={72} h="0.92rem" className="mt-1.5" />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Listing detail" note="ListingDetailSkeleton · replaces the old blank return-null on /listing/[id]">
          <div className="overflow-hidden rounded-lg border-2 border-ink/20">
            <ListingDetailSkeleton />
          </div>
        </Section>

        <div className="my-8 h-0.5 bg-ink/15" />

        <Section title="Empty state · page" note="EmptyState variant=page · true zero / not-found, sticker + CTA">
          <div className="rounded-lg border-2 border-ink/20 bg-paper-pure">
            <EmptyState
              headline="Cart's empty"
              body="Go find something worth keeping."
              cta={<Button variant="secondary">Browse the market</Button>}
            />
          </div>
        </Section>

        <Section title="Empty state · inline" note="EmptyState variant=inline · no-results / filter-zero, chrome preserved">
          <EmptyState
            variant="inline"
            headline="Nothing matches"
            body="Try a different term, or clear the filters."
            cta={<Button variant="secondary">Clear filters</Button>}
          />
        </Section>
      </main>
    </>
  );
}

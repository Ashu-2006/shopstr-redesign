/* Shape-matched skeletons, one per card anatomy in the locked card system.
   Each mirrors the REAL component's frame exactly (same border, radius, grid,
   min-heights, padding) so nothing reflows when data lands; the ink frame
   renders live and only content areas sweep. No .stagger on skeletons: they
   appear instantly and calm, the real content keeps its stagger enter.
   Pure presentation. */

import { Skeleton } from "@/components/ui/Skeleton";

/* ---- H1: featured hero (full-bleed, borderless: one calm sweep) ------------ */
export function HeroSkeleton() {
  return (
    <div className="relative h-[360px] w-full overflow-hidden md:h-[440px]">
      <Skeleton shape="rect" className="absolute inset-0 !rounded-none" h="100%" w="100%" />
    </div>
  );
}

/* ---- ListingCard density="row" (H5, the DEFAULT) --------------------------- */
export function ListingRowSkeleton() {
  return (
    <div className="grid min-h-[158px] grid-cols-[42%_1fr] overflow-hidden rounded-lg border-2 border-ink bg-paper-pure">
      <div className="border-r-2 border-ink">
        <Skeleton shape="rect" className="!rounded-none" h="100%" w="100%" />
      </div>
      <div className="flex flex-col p-3.5">
        <div className="mb-2.5 flex gap-1.5">
          <Skeleton shape="rect" w={64} h={22} className="!rounded-pill" />
          <Skeleton shape="rect" w={84} h={22} className="!rounded-pill" />
        </div>
        <Skeleton shape="line" w="88%" h="1.05rem" />
        <Skeleton shape="line" w="60%" h="1.05rem" className="mt-1.5" />
        <Skeleton shape="line" w="92%" className="mt-2.5" />
        <div className="mt-auto flex items-center justify-between pt-2.5">
          <Skeleton shape="line" w={92} h="1.15rem" />
          <Skeleton shape="line" w={56} h="0.66rem" />
        </div>
      </div>
    </div>
  );
}

/* ---- ListingCard density="tile" (grids + rails) -----------------------------
   Framed square image, open body: same frame the real tile paints. Rails pass
   the same fixed-width className the real tile gets. */
export function ListingTileSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="overflow-hidden rounded-lg border-2 border-ink">
        <Skeleton shape="rect" className="aspect-square !rounded-none" w="100%" />
      </div>
      <div className="mt-2">
        <Skeleton shape="line" w="85%" h="0.92rem" />
        <div className="mt-2 flex items-baseline justify-between">
          <Skeleton shape="line" w={72} h="0.95rem" />
          <Skeleton shape="line" w={44} h="0.66rem" />
        </div>
      </div>
    </div>
  );
}

/* ---- Top-seller rail card --------------------------------------------------- */
export function SellerCardSkeleton() {
  return (
    <div className="flex w-[212px] shrink-0 snap-start flex-col gap-3.5 rounded-xl border-2 border-ink bg-paper-pure p-4">
      <div className="flex items-start justify-between">
        <Skeleton shape="rect" w={56} h={56} className="!rounded-[8px]" />
        <Skeleton shape="rect" w={62} h={30} className="!rounded-pill" />
      </div>
      <div>
        <Skeleton shape="line" w="70%" h="1.1rem" />
        <Skeleton shape="line" w={72} className="mt-2" h="0.66rem" />
      </div>
      <div className="mt-auto flex items-center justify-between border-t-2 border-ink/20 pt-3">
        <Skeleton shape="line" w={68} h="0.72rem" />
        <Skeleton shape="line" w={40} h="0.72rem" />
      </div>
    </div>
  );
}

/* ---- Generic row (orders / cart shape, messages, wallet txns) --------------
   frame="card":    rounded-lg border-2 bg-paper-pure p-3 (orders, cart)
   frame="divider": border-b-2 list row (messages, wallet) */
export function RowSkeleton({
  frame = "card",
  avatar = "square",
  avatarSize = 56,
}: {
  frame?: "card" | "divider";
  avatar?: "square" | "circle";
  avatarSize?: number;
}) {
  return (
    <div
      className={
        frame === "card"
          ? "flex items-center gap-3 rounded-lg border-2 border-ink bg-paper-pure p-3"
          : "flex items-center gap-3 border-b-2 border-ink/15 py-3.5"
      }
    >
      <Skeleton
        shape="rect"
        w={avatarSize}
        h={avatarSize}
        className={avatar === "circle" ? "!rounded-full" : "!rounded-md"}
      />
      <div className="min-w-0 flex-1">
        <Skeleton shape="line" w="55%" h="0.95rem" />
        <Skeleton shape="line" w="35%" className="mt-2" />
      </div>
      <Skeleton shape="line" w={56} h="0.85rem" />
    </div>
  );
}

/* ---- Feed: n list-card skeletons in the standard feed grid ------------------ */
export function FeedSkeleton({
  n = 6,
  className = "grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3",
}: {
  n?: number;
  className?: string;
}) {
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <ListingRowSkeleton key={i} />
      ))}
    </div>
  );
}

/* ---- Listing detail: gallery + info columns --------------------------------- */
export function ListingDetailSkeleton() {
  return (
    <main className="mx-auto max-w-[1100px] px-4 pb-44 pt-4 md:grid md:grid-cols-2 md:gap-10 lg:pb-16">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <Skeleton shape="rect" w={96} h={38} className="!rounded-pill" />
          <Skeleton shape="circle" w={40} h={40} />
        </div>
        <div className="overflow-hidden rounded-2xl border-2 border-ink">
          <Skeleton shape="rect" className="aspect-square !rounded-none" w="100%" />
        </div>
        <div className="mt-3 flex gap-2.5">
          <Skeleton shape="rect" w={64} h={64} />
          <Skeleton shape="rect" w={64} h={64} />
          <Skeleton shape="rect" w={64} h={64} />
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-5 md:mt-0">
        <div>
          <Skeleton shape="rect" w="85%" h="2.1rem" />
          <Skeleton shape="rect" w="55%" h="2.1rem" className="mt-2" />
          <Skeleton shape="line" w={170} h="2.25rem" className="mt-3" />
          <Skeleton shape="line" w={140} className="mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton shape="rect" w={84} h={30} className="!rounded-pill" />
          <Skeleton shape="rect" w={96} h={30} className="!rounded-pill" />
        </div>
        <div>
          <Skeleton shape="line" w="100%" />
          <Skeleton shape="line" w="94%" className="mt-2" />
          <Skeleton shape="line" w="60%" className="mt-2" />
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border-2 border-ink bg-ink">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="bg-paper-pure p-3">
              <Skeleton shape="line" w={64} h="0.66rem" />
              <Skeleton shape="line" w="70%" className="mt-2" h="0.9rem" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

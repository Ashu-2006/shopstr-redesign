# Code Quality Audit + Fix Plan

Date: 2026-08-17
Scope: pages/**, components/**, data/**, lib/** (dev playgrounds excluded).
Method: automated review of the endless-scroll change, plus direct verification
of every finding by reading the code. Four parallel specialist audits were
attempted; all four died on network errors, so their partial output is NOT
relied on here. Everything below was confirmed by hand.

## What is already clean (verified, no action)

- **Design-token discipline**: zero `box-shadow`/`drop-shadow`, zero
  `transition: all`/`transition-all`, zero Tailwind default-palette colors, zero
  hardcoded hex in `pages/` or `components/`. The one "shadow" hit is the word
  in a Button comment.
- **Data boundary**: no component imports a mock, fetch, or relay. Every
  `@/data/*` import in `components/` is `import type` only, except one real
  violation (P4 below).

## Findings, ranked

### P0 · Endless scroll auto-loads forever
`components/InfiniteSentinel.tsx:43`

The effect depends on `disabled`. It flips true while a page loads and false
when the page lands, so the effect tears down the observer and builds a new
one. A fresh IntersectionObserver fires its callback immediately for an
already-intersecting target, so the sentinel (still on screen, 800px rootMargin)
re-triggers `loadMore` with the user completely stationary. Repeats until the
tab dies.

**Fix**: stop rebuilding the observer. Keep one observer for the component's
life, read `disabled` from a ref inside the callback, and additionally latch so
a single intersection can only fire once until the sentinel leaves and re-enters.

### P1 · Skeleton/card geometry contract broken -> reflow on every tile grid
`components/skeletons.tsx:50,52`

`ListingTileSkeleton` is `aspect-square` + `mt-2`. The real `ListingCard`
tile (`components/ListingCard.tsx:179,199`) moved to `aspect-[4/5]` + `mt-3`.
Every tile grid (marketplace tail, search results, shop items, sell/mine)
therefore jumps ~60-70px per row when data lands. This directly violates the
no-reflow rule in CLAUDE.md, which is the entire justification for
shape-matched skeletons.

**Fix**: match the real tile exactly (`aspect-[4/5]`, `mt-3`). Add a comment
tying the two files together so the next geometry change updates both.

### P2 · Loading-in-flight state has three disagreeing owners
`data/hooks.ts:186-194`, `pages/marketplace.tsx:242`, `components/InfiniteSentinel.tsx`

Three separate notions of "a page is loading": the hook's `isLoadingMore`, the
sentinel's `disabled` prop, and the button's label swap. They are set
independently and can disagree.

- `data/hooks.ts:190`: the `window.setTimeout` handle is never stored or
  cleared. It fires after unmount (setState on an unmounted component) and
  stacks on repeated calls.
- `pages/marketplace.tsx:242`: the "Load more" button swaps its label to
  "Loading…" but is never `disabled`, so three fast clicks append three pages.

**Fix**: make the hook the single owner. Guard `loadMore` so it is a no-op while
already loading, store and clear the timer, and have the button read
`disabled={isLoadingMore}` from the same flag the sentinel uses.

### P3 · Endless tail shows duplicate and already-seen products
`data/hooks.ts:178`, `pages/marketplace.tsx:36,221`

Three separate content defects in the same feature:
1. The rotation `(p*pageSize + i + p*5) % 24` overlaps itself from page 3 on:
   24 cards are drawn from 18 distinct products, 32 from 20. The same item
   appears twice within one screenful. Keys don't collide (page suffix), so it
   fails silently.
2. The tail starts at catalogue index 0, so "Everything else" re-shows the exact
   listings "For you" and "Near you" just rendered above it.
3. `pages/marketplace.tsx:221`: the tail grid omits the `rating` prop that the
   `card` helper passes, so the same product shows a star rating in one band and
   not in another, contradicting the one-card-everywhere goal.

**Fix**: walk the catalogue with a real cursor (no modular overlap), let the
caller exclude ids already rendered above, and pass `rating` in the tail.

### P4 · FeedScreen violates the pure-presentation rule
`components/FeedScreen.tsx:3`

Imports `useCartStore`, `useSession`, `ratingForPubkey` from `@/data/hooks`.
CLAUDE.md: components are props in, JSX out; pages call hooks and pass data
down. This is the only such violation in `components/`.

**Fix (deferred, flagged)**: hoisting the hooks into the three calling pages is
a real refactor touching /new, /near, /following. It is contained and the
component is not on the port path, so it is documented here rather than
bundled into a correctness pass.

## Order of work

1. P0 sentinel re-arm (breaks the feature; ship first)
2. P1 skeleton geometry (visible on every grid; one-line fix)
3. P2 single owner for load-in-flight
4. P3 tail content correctness
5. P4 documented, not executed this pass

Each lands as its own commit with a browser verification.

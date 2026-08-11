# Loading + Empty States System

Status: PROPOSED (awaiting approval)
Date: 2026-08-12
Sources: armorIQ-platform-proto state system (Skeleton / PageState / error-state spec / 04_UX_LEARNINGS.md), full audit of this repo's 24 routes.

## 1. Goal

Every surface in the app renders a designed state for: **loading, empty, no-results, not-found, populated**. No blank screens, no spinner-pops, no lying copy, no crash-on-empty. One primitive per job, in Sticker Brutalism.

## 2. What armor-proto taught us (mistakes to not repeat)

The armor V1 post-mortem (04_UX_LEARNINGS.md) and the error-state spec document these failures. Each maps to a rule below.

| Armor mistake | Evidence there | Rule here |
|---|---|---|
| Spinner-pop and content jump on every screen | "73 hand-rolled spinners", "No skeleton loading. Spinner to content jump." | **No spinner primitive exists in this app, period.** Skeleton-first, shape-matched, zero reflow. |
| Hand-rolled divergence multiplies | 11 pulse copies, 20 state-card copies had to be absorbed later | We already have 4 divergent empty treatments after ~20 screens. Unify into one `EmptyState` NOW, before the port multiplies them. |
| Zeros shown as empty state | "Zero agents shows a literal 0 card" | Counts and lead-in copy render only when count > 0. A fresh surface gets a designed empty, never "0 items". |
| Dishonest CTAs and invented causes | Retry buttons on 403/404 "that can never work"; a hand-rolled card claiming "Engineering has been paged" | Every empty/not-found CTA must actually work. Never fabricate a cause or a promise. |
| Flash of empty/loading on filter and tab switches | keepPreviousData regression (#74): switching filters unmounted the table | Never re-skeleton data already on screen. Filter switches keep chrome and show inline no-results, not the page empty. First-load simulation fires once per data family per session. |
| Dev state knobs leaked to reviewers | `?state=` overrides removed entirely (#83) | No `?state=` overrides. States derive from real (simulated) query status only. |
| Blank screen on missing record | "No ErrorBoundary exists. A render throw is a blank white screen." | Kill every `return null`. All 5 blank-screen sites get a designed state. |
| Opacity pulse reads cheap | Live Skeleton deliberately replaced `animate-pulse` with a calm grey gradient sweep: "reads as loading more clearly and feels more premium" | Our skeleton is a **gradient sweep** on paper tokens, not an opacity pulse. |
| Rules doc went dangling | `docs/loading-states.html` cited by code but never existed | Rules live in this spec + a condensed block in CLAUDE.md, added in the final phase. |
| Empty vs no-results conflated | Armor enforces true-zero (onboarding CTA) vs filter-zero (inline, "Clear filters", chrome preserved) as separate states | Same two-state distinction here, everywhere a filter exists. |

## 3. State taxonomy for this app

Armor uses five states (empty / loading / error / denied / populated). This app is mock-data, so `error` and `denied` are unreachable until the port back to real relays. Our taxonomy:

1. **loading**: first fetch of a data family. Skeleton, shape-matched. Chrome (nav, headers, borders, tabs) paints immediately.
2. **empty**: true zero. Sticker + display headline + body + working CTA.
3. **no-results**: zero AFTER a user-applied filter/search. Inline, compact, chrome preserved, "Clear filters" CTA. Never the page empty.
4. **not-found**: dynamic route with a bad id. Designed card with back navigation. Never `return null`.
5. **populated**.

Port-back note: `EmptyState` gets no error API now (YAGNI), but the page-level branch ladder (`isLoading ? ... : !data ? ... : empty ? ... : populated`) is exactly where an `error` branch slots in later. Documented, not built.

## 4. The rules (the process, condensed)

1. **Skeleton-first loading.** When page chrome is painted and we are filling in data, use a shape-matched skeleton. Match the real layout so nothing reflows when data lands. Full-bleed surfaces (hero carousel) get a full-bleed skeleton block.
2. **Skeletons keep the ink frame.** The card's `border-2 border-ink` + radius + exact dimensions render immediately; only the content inside is skeleton blocks. Brutalist structure is the loading state.
3. **Never a spinner on blank.** There is no spinner. The only in-progress affordances outside skeletons are the ones that already exist (checkout confirming state, success stroke-draw).
4. **Never re-skeleton shown data.** One simulated first-load per data family per session. Tab/filter switches never trigger loading UI.
5. **Empty is not no-results.** True zero: page `EmptyState` with onboarding CTA. Filter zero: inline variant + "Clear filters". Copy differs.
6. **Copy never lies.** Count pills ("0 items", "Active 0") and lead-ins ("Three things you can buy") render only when true. Optional discovery rails (Top sellers, Near you, claim recs) hide entirely when empty; destination surfaces show designed empties.
7. **CTAs are honest.** Every empty CTA navigates somewhere real or performs a real action.
8. **Headline voice:** short, present tense, in-brand, uppercase display. Body: one sentence that explains and one that recovers. No bare "No data".
9. **Reduced motion:** sweep collapses to a static `--ds-paper-2` fill. Guarded twice is unnecessary here; the standard `prefers-reduced-motion` media query suffices.
10. **Tokens only.** Sweep uses paper tokens; no Tailwind grey palette, no new hex, no shadows.

## 5. Components

All pure presentation (props in, JSX out), matching the data-architecture rule.

### 5a. `components/ui/Skeleton.tsx` (primitive)

```tsx
type SkeletonProps = {
  shape?: "line" | "rect" | "circle";  // line: h-3, radius-sm; rect: radius-lg; circle: radius-circle
  w?: number | string;                 // default: line 100%, others required-ish
  h?: number | string;
  className?: string;
};
// <span aria-hidden="true" className="block ds-skeleton ..." style={{width, height}} />
```

CSS added to `styles/globals.css`:

```css
@keyframes ds-skeleton-sweep { from { background-position: 200% 0 } to { background-position: -200% 0 } }
.ds-skeleton {
  background: linear-gradient(90deg,
    var(--ds-paper-2) 0%, var(--ds-paper-2) 35%,
    var(--ds-paper) 50%,
    var(--ds-paper-2) 65%, var(--ds-paper-2) 100%);
  background-size: 200% 100%;
  animation: ds-skeleton-sweep var(--ds-dur-loop) linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .ds-skeleton { animation: none; background: var(--ds-paper-2); }
}
```

New token in `styles/design-system.css`: `--ds-dur-loop: 1.6s`. Deliberate addition outside the 4-step interaction duration scale; it is an ambient loop, not an interaction, so it does not violate the "adding a fifth means the scale is wrong" rule. Sweep highlight (`--ds-paper` over `--ds-paper-2`) is intentionally calm; contrast is tunable at visual review (fallback highlight: `--ds-paper-pure`).

### 5b. `components/skeletons.tsx` (shape-matched card skeletons)

Each mirrors exact geometry from `components/cards.tsx` / row markup, with the ink frame live:

| Skeleton | Mirrors | Used by |
|---|---|---|
| `ListCardSkeleton` | H5 `ListCard` (grid `42%_1fr`, min-h 158, border-2) | FeedScreen, /c/[category], /marketplace feed |
| `ProductCardSkeleton` | `ProductCard` (aspect-square image, p-3.5 body) | /shop items, /sell/mine, more-from-seller |
| `NearCardSkeleton` | P1 `NearCard` (w-200, img h-150) | Near-you rail |
| `SellerCardSkeleton` | `SellerCard` (w-212, avatar 14) | Top-sellers rail |
| `HeroSkeleton` | H1 `HeroCard` (h-360/440, full-bleed, no border) | Featured carousel |
| `RowSkeleton` | cart/orders/messages/wallet row anatomies (`avatar?: "square" | "circle"`, `divider?: boolean`) | /orders, /messages, /wallet, /cart-adjacent |
| `ListingDetailSkeleton` | listing/[id] layout (gallery block, title lines, price row, control row) | /listing/[id] |
| `FeedSkeleton` | n × ListCardSkeleton in the standard stack | feeds |

Skeletons render WITHOUT `.stagger` (instant, calm). Real content keeps its stagger enter, so the swap reads as content popping in, which is the brand's reward moment.

### 5c. `components/ui/EmptyState.tsx` (primitive)

```tsx
type EmptyStateProps = {
  variant?: "page" | "inline";   // page: generous py-16, sticker + display + body + CTA (the /cart pattern, generalized)
                                 // inline: compact dashed box (border-2 border-dashed border-ink/30), chrome-preserving, for no-results
  sticker?: StickerName;         // page default "shape-starburst"; vary per surface for personality
  headline: string;              // rendered .ds-display uppercase
  body?: string;
  cta?: ReactNode;               // usually <Button variant="secondary">
  secondaryCta?: ReactNode;      // e.g. "Clear filters"
  className?: string;
};
```

Not-found is the page variant + back CTA (the existing listing/[id] "Listing not found" treatment, moved into the primitive). Checkout keeps its `OneWayFrame` empty (flow shell owns that geometry) but its copy aligns with the copy table.

### 5d. Latency simulation in `data/hooks.ts`

The seam stays intact; only the hook internals change. Module-level `Set<string>` of loaded keys (resets on refresh, survives client navigation):

```ts
function useSimulatedLoad(key: string): boolean
// true for ~500-900ms (deterministic per-key jitter) on first mount of that key per session; false forever after.
// Keys are per data family: "listings", "reviews:<id>", "profile:<pk>", "chats", "orders", "txns", "communities".
```

Each hook returns `{ data, isLoading: useSimulatedLoad(key) }`. SSR renders `isLoading: true` (Set empty on server), matching the client's first paint: no hydration mismatch. Revisiting a route never re-skeletons (rule 4). No `?state=` override (armor #83).

Route-transition guard: `/listing/[id]` keeps its `router.isReady && id` precondition (the documented fix for the buyer-flow wedge); `ListingDetailSkeleton` occupies the current `if (!product) return null` slot, and not-found only renders when `router.isReady && id && !isLoading && !product`.

## 6. Per-route wiring matrix

| Route | Loading | Empty / no-results / not-found | Fixes bundled |
|---|---|---|---|
| /marketplace | HeroSkeleton + SellerCardSkeleton rail + ListCardSkeleton feed + NearCardSkeleton rail | Rails HIDE when empty (header included). Feed true-zero: page EmptyState. | Guard `find(...)!` + hardcoded ids; derive featured/break from array safely |
| /new, /near, /following (FeedScreen) | `loading` prop → FeedSkeleton | Keep inline dashed box, move to `EmptyState variant="inline"`; /following true-zero gets page variant + "Find sellers" CTA | — |
| /search | FeedSkeleton under intact search chrome | no-results: inline + "Clear filters" secondaryCta (CTA missing today) | Guard `Math.min(...[])` → Infinity price poisoning |
| /c/[category] | ListCardSkeleton stack | Page EmptyState (replaces bare `<p>`) | "0 items" note renders only when > 0; spotlight hides when empty |
| /communities | Tile skeletons | Page EmptyState + "Start a community" CTA (promote the existing button) | — |
| /communities/[slug] | Detail skeleton | not-found page EmptyState (replaces `return null`) | Guard `list[0]` crash |
| /listing/[id] | ListingDetailSkeleton (replaces `return null`) | not-found (existing treatment, via primitive). Reviews section: inline "No reviews yet. Be the first after you buy." (a real product surface per app-map's review loop). Sizes/more-from hide silently (correct). | — |
| /shop/[handle] | Header + ProductCardSkeleton grid | not-found (replaces `return null`); Items tab empty; Reviews tab empty | — |
| /review/[id] | Flow skeleton | not-found (replaces `return null`) | — |
| /cart | n/a (client store) | Keep the existing treatment; it BECOMES the page-variant primitive | — |
| /checkout | n/a | Keep OneWayFrame empty; copy aligned | — |
| /orders | RowSkeleton × 4 | True-zero: page EmptyState. Filter-zero: inline + "Clear filter" (reachable today, blank today) | Guard `find(...)!` |
| /orders/[id] | Row/detail skeleton | not-found (replaces `return null`) | — |
| /messages | RowSkeleton × 4 (circle avatar) | Page EmptyState under SheetHeader | — |
| /wallet | RowSkeleton × 3 under Activity header | Activity empty: inline variant + "Receive sats" CTA | — |
| /wallet/claim | RowSkeleton recs | Recs section HIDES when empty | "Three things you can buy" copy renders only when recs exist |
| /sell/mine | ProductCardSkeleton grid | Page EmptyState + "Create your first listing" → /sell/new | "Active 0" pill only when > 0; note Sold/Drafts pills are decorative (latent fake-empty, flagged, fix optional) |

## 7. Copy table (page empties)

All headlines uppercase display; body explains + recovers; every CTA works.

| Surface | Sticker | Headline | Body | CTA |
|---|---|---|---|---|
| Cart (existing) | shape-starburst | Cart's empty | Go find something worth keeping. | Browse the market |
| Messages | badge-speech | Inbox is quiet | Chats with sellers land here. Ask about a listing to start one. | Browse the market |
| Orders | shape-sparkle | Nothing on the way | Buy something and track it here, from paid to delivered. | Browse the market |
| Wallet activity | shape-sun-rays | No activity yet | Sats in and out show up here the moment they move. | Receive sats |
| Sell / mine | shape-hand | Nothing listed yet | Your shop is ready. Put your first thing up for sats. | Create a listing |
| Following | badge-love-heart | Follow some sellers | Their new drops will land here first. | Find sellers |
| Shop items tab | shape-smiley | Shelf's empty | This seller hasn't listed anything yet. Check back soon. | Back to market |
| Reviews (inline) | none | No reviews yet | Be the first after you buy. | none |
| No-results (inline, generic) | none | Nothing matches | Try a different term, or clear the filters. | Clear filters |
| Not-found (generic) | shape-daisy | Not here anymore | This page moved or never existed. | Back to the market |

## 8. Build phases

1. **Foundations**: `--ds-dur-loop` token, `.ds-skeleton` utility + keyframe, `Skeleton` primitive, `EmptyState` primitive. Migrate /cart empty onto the primitive as the proof. Commit.
2. **Latency sim**: `useSimulatedLoad` in data/hooks.ts, thread `isLoading` through all hooks. Commit.
3. **Skeletons**: `components/skeletons.tsx` + wire loading branches route by route (matrix order: marketplace, feeds, category, search, listing, shop, orders, messages, wallet, communities, sell/mine). Commit per coherent chunk.
4. **Empties + guards**: wire empty / no-results / not-found per matrix; crash guards; copy-lie fixes. Commit.
5. **Verify + document**: Playwright pass screenshotting loading and empty for each route (temporarily raise sim delay to capture skeletons); check skeleton vs populated geometry for reflow; reduced-motion spot check. Add the condensed rules (section 4) to CLAUDE.md so the spec never goes dangling. Commit.

## 9. Decisions taken (flag if you disagree)

1. **Simulated latency: yes, first-visit-per-session only.** Without it, loading states are dead code we can't see or review. It lives behind the hook seam, so the port back swaps internals only. Alternative rejected: `?state=` dev knob (armor removed theirs for leaking, #83).
2. **Skeletons keep the ink border frame.** Structure-first reads as the brand and guarantees zero reflow. Alternative rejected: borderless grey ghost blocks (generic, off-brand).
3. **Error/denied states: API-ready, not built.** Unreachable with mock data. The branch ladder leaves the slot; building them now would violate the anti-fixture rule (we would have to fabricate causes to show them).

## 10. Out of scope

- ErrorBoundary, retry plumbing, ConnectionStatus/offline (port-time work).
- RefreshIndicator / background refetch (no refetch exists in mock phase).
- Text shimmer / determinate progress (no streaming or measurable work in this app; checkout's confirming state already covers its flow).
- Fixing the decorative Sold/Drafts pills on /sell/mine beyond flagging.

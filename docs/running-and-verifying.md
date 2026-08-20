# Running the app and verifying the port

## Prerequisites

- Node 20+ and npm.
- No other services; the app runs standalone on mock data today.

## Running

```bash
npm install
npm run dev
# app on http://localhost:3000
```

Type checking and prod build:

```bash
npm run build   # will fail loudly on any type error
npm run start   # serves the prod build
```

## The route map

42 route files under `pages/`. Here is what each cluster is for and which hooks it depends on.

### Browse and product

| Route | File | Hooks used |
|---|---|---|
| `/marketplace` | `pages/marketplace.tsx` | `useEndlessListings`, `useTopSellers`, `useSession` |
| `/near` | `pages/near.tsx` | `useListings` |
| `/following` | `pages/following.tsx` | `useListings`, `useSession` |
| `/new` | `pages/new.tsx` | `useListings` |
| `/c/[category]` | `pages/c/[category].tsx` | `useCategoryListings` |
| `/search` | `pages/search.tsx` | `useListings` |
| `/listing/[id]` | `pages/listing/[id].tsx` | `useListing`, `useReviews`, `useCommunitiesForListing` |
| `/shop/[handle]` | `pages/shop/[handle].tsx` | `useSellerListings`, `useProfile`, `useReviews` |

### Buying loop

| Route | File | Hooks used |
|---|---|---|
| `/cart` | `pages/cart.tsx` | `useCart`, `useCartStore` |
| `/checkout` | `pages/checkout.tsx` | `useCheckout`, `useCart`, `useSession` |
| `/paid` | `pages/paid.tsx` | `useCheckout` (read once, then clear) |
| `/orders` | `pages/orders.tsx` | `useOrders` |
| `/orders/[id]` | `pages/orders/[id].tsx` | `useOrder`, `nextAction`, `canUpdateStatus` |
| `/review/[id]` | `pages/review/[id].tsx` | `useOrder`, `useProfile` |

### Chat

| Route | File | Hooks used |
|---|---|---|
| `/messages` | `pages/messages.tsx` | `useChats` |
| `/messages/[handle]` | `pages/messages/[handle].tsx` | `useThreadFor`, `useThreadMessages` |

### Selling loop

| Route | File | Hooks used |
|---|---|---|
| `/sell/new` | `pages/sell/new.tsx` | `useDrafts`, `useSession` |
| `/sell/mine` | `pages/sell/mine.tsx` | `useSellerListings`, `useDrafts`, `usePendingSales` |
| `/profile` | `pages/profile.tsx` | `useProfile`, `useSession` |

### Communities

| Route | File | Hooks used |
|---|---|---|
| `/communities` | `pages/communities.tsx` | `useCommunityDigest`, `useCommunities` |
| `/communities/discover` | `pages/communities/discover.tsx` | `useCommunities` |
| `/communities/new` | `pages/communities/new.tsx` | `useSession` |
| `/communities/[slug]` | `pages/communities/[slug]/index.tsx` | `useCommunity`, `useCommunityPosts` |
| `/communities/[slug]/queue` | `pages/communities/[slug]/queue.tsx` | `useCommunity`, `usePendingPosts`, `useIsModerator` |
| `/communities/[slug]/members` | `pages/communities/[slug]/members.tsx` | `useCommunity`, `useIsModerator` |

### Wallet

| Route | File | Hooks used |
|---|---|---|
| `/wallet` | `pages/wallet.tsx` | `useTxns`, `useClaimable`, `useSession` |
| `/wallet/setup` | `pages/wallet/setup.tsx` | `useSession` |
| `/wallet/send` | `pages/wallet/send.tsx` | `useTxns` |
| `/wallet/receive` | `pages/wallet/receive.tsx` | `useSession` |
| `/wallet/claim` | `pages/wallet/claim.tsx` | `useClaimable` |
| `/wallet/withdraw` | `pages/wallet/withdraw.tsx` | `useTxns` |
| `/wallet/payout` | `pages/wallet/payout.tsx` | `useTxns` |

### Settings

| Route | File | Notes |
|---|---|---|
| `/settings` | `pages/settings/index.tsx` | index of the four below |
| `/settings/profile` | `pages/settings/profile.tsx` | metadata (kind 0) |
| `/settings/keys` | `pages/settings/keys.tsx` | key management, backup |
| `/settings/wallet-connect` | `pages/settings/wallet-connect.tsx` | NIP-47 |
| `/settings/preferences` | `pages/settings/preferences.tsx` | client-only preferences |

### Marketing and system

| Route | File | Notes |
|---|---|---|
| `/` | `pages/index.tsx` | marketing landing |
| `/404` | `pages/404.tsx` | designed not-found |

### Internal / dev

| Route | File | Notes |
|---|---|---|
| `/dev/states` | `pages/dev/states.tsx` | gallery of every skeleton and empty state; use this to check the five-state coverage |
| `/dev/cards` | `pages/dev/cards.tsx` | every card variant on one screen |
| `/dev/loaders` | `pages/dev/loaders.tsx` | boot + skeleton primitives |
| `/dev/landing` | `pages/dev/landing.tsx` | landing page playground |

Delete `pages/dev/*` before shipping to production.

## How to know you haven't regressed anything

### Visual smoke test

For each route above:
1. Visit fresh (open in a new tab or hard-refresh).
2. Confirm the skeleton renders first, then real data lands.
3. Confirm no reflow when data lands: card frames match the skeleton geometry exactly.

The single fastest coverage check is `/dev/states`. It shows every skeleton and every empty state on one screen. If any of them are broken, this is where you see it.

### Loading and empty coverage

- Every list route (`/marketplace`, `/c/[category]`, `/search`, `/messages`, `/orders`, `/communities`, `/wallet`) should render as: skeleton → (real data | designed empty | filter no-results).
- Every detail route (`/listing/[id]`, `/orders/[id]`, `/communities/[slug]`, `/messages/[handle]`) should return the designed 404 when the id is unknown, not a blank screen or a thrown error.

### Motion

`/dev/loaders` shows the boot splash and every skeleton animation. If reduced-motion is enabled at the OS level, animations should fall back to a static fill (already implemented in `globals.css`).

### Type check

```bash
npm run build
```

Types are the port's safety net. `data/types.ts` is the domain contract; if `build` fails, a hook body's return no longer matches its declared shape.

### The Playwright helper

The repo has been screenshot-tested with `@playwright/test`. There is no committed test suite (the redesign is design-first), but the pattern is:

```bash
npx playwright launch chromium --headless
# open localhost:3000/<route>, screenshot, diff
```

If you set up regression screenshots during the port, keep them under `screenshots/` (already in `.gitignore` at the project level).

## Common pitfalls during the port

- **Screens re-skeletoning on every navigation.** The simulator is scoped to one first-load per data family per session by design (`loadedFamilies` in `data/hooks.ts`). Real network state should replicate this: once a query has resolved for a family, subsequent renders should not flash a skeleton.
- **Component reaching into `data/mock/*`.** Should be impossible (all imports go through `data/hooks.ts`), but if you find one, promote it to a hook first.
- **`data.length === 0` treated as loading.** Empty is not loading. `EmptyState` renders when `!isLoading && data.length === 0`.
- **A hook returning `undefined` instead of `null` for not-found.** `data === null && !isLoading` is how detail pages know to show the 404 UI. `undefined` breaks that.

## When you're done

The port is done when:

- Every hook in [`data-hooks-contract.md`](data-hooks-contract.md) reads from real Nostr / Cashu.
- `/dev/states` looks identical to today.
- Every route in the table above renders real data.
- `npm run build` passes.

# Data hooks contract: the wiring table

The only file that changes on port is [`data/hooks.ts`](../data/hooks.ts). This doc lists every hook it exports, the shape it returns, and which Nostr event / NIP / Cashu operation it should read from in production. When every row here is wired, the port is done.

Types referenced below live in [`data/types.ts`](../data/types.ts). Do not change their shapes; if a real Nostr event does not populate a field, that is an adapter gap, not a type problem.

Every hook returns `{ data, isLoading }` (`AsyncResult<T>` in types). `isLoading` today is a per-family first-load simulator; on port it should reflect real request state.

---

## Listings (NIP-99, kind 30402)

### `useListings(): AsyncResult<ProductData[]>`
All active listings for the marketplace feed. Source: kind 30402 across configured relays. Filter to non-expired, non-deleted.

### `useEndlessListings(pageSize, exclude?)`
Paged version of the feed. Shape includes `items`, `hasMore`, `loadMore()`, `isLoadingMore`. On port, page with `until = oldestSeenTimestamp` per relay, append. `exclude` is a set of listing ids already rendered in editorial rails; skip BEFORE paging so each page is `pageSize` fresh cards.

### `useListing(id: string): AsyncResult<ProductData | null>`
One listing by id. Return `null` (not `undefined`) when not found; the not-found state UI keys off `data === null && !isLoading`.

### `useSellerListings(pubkey): AsyncResult<ProductData[]>`
Active listings by one seller. Kind 30402 filtered by author pubkey.

### `useSoldListings(): AsyncResult<ProductData[]>`
The current user's sold history. On port, derive from completed orders (see Orders section) rather than a separate listing status.

### `useCategoryListings(category): AsyncResult<ProductData[]>`
Filter by the `t` tag. Case-insensitive match.

### `productById(id): ProductData | undefined`
Synchronous accessor used inside memoized selectors. On port, back this with an in-memory index of the last fetched listings so it stays cheap.

**Field constraints for `ProductData`:**
- `price`, `totalCost`, `shippingCost` are **integer sats**. No decimals, no BTC floats.
- `shippingType` is `"N/A" | "Free" | "Pickup" | "Free/Pickup" | "Added Cost"`. Drop the shipping tag entirely when the raw value is anything else (matches upstream `utils/STATIC-VARIABLES.ts`).
- Only `"Added Cost"` charges shipping; all others force `shippingCost = 0`.
- `pickupLocations` is required when `shippingType` allows pickup.

---

## Profiles (NIP-01 kind 0)

### `useProfile(pubkey): AsyncResult<Profile | null>`
Standard metadata event. Map `name` → `handle`, `nip05` → `nip05`, `picture` / `banner` verbatim.

### `profileByPubkey(pubkey) / profileByHandle(handle)`
Sync accessors for memoization. Back with an in-memory profile cache warmed by whatever profiles the current view is rendering.

---

## Reviews (NIP-85, kind 31555)

### `useReviews(pubkey): AsyncResult<SellerReviews>`
Every review addressed to this seller's products. On port, query kind 31555 with `#p` (or `#a`, whichever upstream uses) equal to the seller pubkey, then map to `Review`.

**Load-bearing rule:** the `score` is not stored. It is computed:
- `thumb` is mandatory binary. It carries 50% of the total by itself.
- Each supplied `dimension` (value / quality / delivery / communication) splits the remaining 50% equally.
- The only implementation lives in `weightedScore()` in `data/hooks.ts`. Everything else calls that.
- Absent dimensions mean "not rated", not "bad". Do not coerce missing to `false`.

### `averageWeighted(reviews)`, `averageRating(reviews)`, `thumbRate(reviews)`, `dimensionBreakdown(reviews)`
Pure selectors over `Review[]`. Never store any of these; recompute on read.

### `ratingForPubkey(pubkey)`
Convenience for header badges: `{ avg, count }`. Same rule: computed, never stored.

---

## Chat / DMs (NIP-17 gift-wrapped)

### `useChats(): AsyncResult<ChatThread[]>`
Inbox: one entry per counterparty pubkey per listing thread. Sort by `lastMessageAt` desc. On port, unwrap NIP-17 wrappers, group by (counterparty, listing id), and denormalize the first "opener" message's `productId` / `productTitle` / `productImage` into the thread summary so the inbox does not need a second lookup.

### `useThreadFor(handle): AsyncResult<ChatThread | null>`
One thread by counterparty handle (used from listing → "Message seller").

### `useThreadMessages(handle): AsyncResult<ChatMessage[]>`
Full message list, oldest first. `from` is `"me" | "them"` computed against the current session pubkey.

**Constraint:** Do not send order state changes over DM alone. Orders are their own event stream (see below); DMs are for conversation.

---

## Cart (client state)

### `useCart(): AsyncResult<CartItem[]>`
Cart is client-only today (`data/store.ts` + `localStorage`). Decide on port whether it stays local or becomes a NIP-51 replaceable list per pubkey. Either way, keep the `{ data, isLoading }` envelope.

### `useCartStore` (re-exported)
Mutations: `add`, `remove`, `updateQuantity`, `clear`. Keep the signatures.

---

## Checkout (client state)

### `useCheckout` (re-exported from `data/store.ts`)
The checkout wizard's persistent context: fulfilment choice, shipping / pickup address, review confirmation, payment method. Lives across the flow's 4-5 steps.

On port: this stays client state until the buyer commits. On commit, publish a NIP-17 order event to the seller and clear the wizard.

---

## Orders (role-gated state machine)

### `useOrders(): AsyncResult<Order[]>`
All orders the current session participates in (as buyer or seller). On port, source from NIP-17 order events plus any status-update events; project to `Order` on read.

### `useOrder(id): AsyncResult<Order | null>`
One order.

### `canUpdateStatus(order, next): boolean`
The role-gated transition rule. Look at the current implementation and mirror it against the upstream state machine before wiring transitions.

### `nextAction(order): {...}`
The single "do the next thing" descriptor rendered on the order detail. Keep the shape; it drives UI copy and CTA.

### `usePendingSales(): AsyncResult<Order[]>`
Seller's pending queue. Derived from `useOrders`, filtered by role and status.

---

## Wallet (Cashu, NIP-60 / NIP-61)

### `useTxns(): AsyncResult<WalletTxn[]>`
Full wallet transaction history. Sourced from the local Cashu wallet state today. On port, replace with NIP-60 wallet events (or whatever mechanism the current Shopstr wallet uses; verify against `useCashuWallet` upstream).

### `useClaimable(): AsyncResult<(typeof CLAIMABLE & { id: string }) | null>`
The single currently-claimable ecash token (from someone zapping / sending you a NIP-61 nutzap). Return `null` when nothing is pending.

---

## Communities (NIP-72)

### `useCommunities(): AsyncResult<Community[]>`
All communities the current pubkey belongs to. Source: kind 34550.

### `useCommunity(slug): AsyncResult<Community | null>`
One community. Use `d` tag as the slug.

### `useIsModerator(slug): boolean`
Whether the session pubkey is in the community's moderator list.

### `useCommunityPosts(slug): AsyncResult<CommunityPost[]>`
**Only** posts that have been approved by a moderator, per NIP-72's approval mechanism. Approval is kind 4550. Never render an unapproved post in this list.

### `usePendingPosts(slug): AsyncResult<CommunityPost[]>`
Moderator queue: posts submitted but not yet approved. Visible to moderators only.

### `useMyPendingPosts(slug): CommunityPost[]`
The current user's own submissions awaiting approval. Visible to the author only.

### `useCommunityDigest(): AsyncResult<CommunityDigestEntry[]>`
Cross-community "what's new" summary for the discover page. Read across the user's communities, roll up per-community.

### `useCommunitiesForListing(product): AsyncResult<Community[]>`
Which communities have curated (approved a post referencing) this listing.

### `communityForCurator(handle) / communityForListing(productId)`
Sync accessors for cross-reference badges.

### `moderatorsOf(community): string[]`, `nextPostId(): string`
Pure helpers, kept as-is.

---

## Boot gate

### `useAppBoot(): { booting: boolean }`
The one-time splash before ANY data exists. Resolves on the first data family landing, with a 900ms floor (to prevent flash) and an 8s ceiling (safety net against a wedged relay).

On port: the floor and ceiling stay; the poll should read "any real request has resolved" instead of "any simulated family loaded".

---

## Sellers rail

### `useTopSellers(limit=4): AsyncResult<TopSeller[]>`
The "top sellers near you" rail. Today it ranks by mock stats. On port, define a real ranking (recent sales volume, review score, distance) and back it here.

---

## The port checklist

For each hook above:

- [ ] Reads from the correct Nostr kind / NIP mechanism.
- [ ] Returns the exact `AsyncResult<T>` shape.
- [ ] Money is integer sats.
- [ ] Identity is npub / pubkey; no email / phone / password anywhere.
- [ ] Reviews compute score on read via `weightedScore()`, never store.
- [ ] Shipping types are the closed enum, not free text.
- [ ] Not-found returns `null`, not `undefined` or a thrown error.
- [ ] Loading state is real request state.

When every row is checked, every screen in the app is live. That is the port.

# Domain-correctness fix plan

Executing the Tier 1 + high-impact Tier 2 findings from
`docs/upstream-domain-gaps.md`. Goal: the mock stops contradicting the protocol,
so the port is a hook-body rewrite rather than a redesign.

Ground rules, unchanged:
- All data through `data/hooks.ts` returning `{data, isLoading}`.
- `components/` stay pure presentation.
- Money is integer sats **on the wire**; a listing may *quote* another currency.
- Every data surface keeps its five states.

---

## Slice 1 — Shipping enum drives fulfilment (contract change)

**Why first:** smallest blast radius (6 call sites), and it unblocks the
checkout's fulfilment logic which slice 4 also touches.

1. `data/types.ts`: replace `shippingType?: string` with the closed union
   `ShippingType = "N/A" | "Free" | "Pickup" | "Free/Pickup" | "Added Cost"`.
2. `lib/catalog.ts` (or a new `lib/fulfilment.ts`): port upstream's two rules.
   - `effectiveShippingCost(type, cost)`: 0 for `Free`/`Free/Pickup`/`Pickup`/
     `N/A`; `cost` only for `Added Cost`; `null` when unknowable.
   - `fulfilmentOptions(type)`: `{ canShip, canPickup }` —
     `Pickup` → pickup only; `Free/Pickup` → both; everything else → ship only.
3. `data/mock/listings.ts`: remap all 24 listings off `Standard`/`Tracked` onto
   the real five. Digital/service items become `N/A`.
4. `pages/listing/[id].tsx`: shipping line reads from `effectiveShippingCost`,
   and says "Pickup only" where that is the truth.
5. `pages/checkout.tsx`: the ship/pickup step renders only the options the cart
   authorizes. If any item is pickup-only, shipping is not offered for it.
6. Add `pickupLocations?: string[]`; the pickup step makes the buyer choose one.

**Done when:** a `Pickup` listing cannot be shipped anywhere in the flow, and no
listing shows a shipping cost that upstream would force to zero.

## Slice 2 — Review model: thumb + named dimensions (contract change)

**Why second:** touches the most components, so do it before more surfaces
depend on the star average.

1. `data/types.ts`: new `Review { id, authorPubkey, productId, thumb: boolean,
   dimensions: Partial<Record<ReviewDimension, boolean>>, text?, createdAt }`
   with `ReviewDimension = "value" | "quality" | "delivery" | "communication"`.
   `SellerReviews` becomes `{ pubkey, reviews: Review[] }`.
2. `data/hooks.ts`: port `weightedScore(review)` exactly — thumb is 50%, the
   remaining dimensions split the other 50% equally. `averageRating` becomes the
   mean of weighted scores, i.e. **0..1**, plus
   `dimensionBreakdown(reviews)` returning per-dimension % for the seller page.
3. Presentation decision: keep a **0..5 display** derived as `weighted * 5` so
   the existing `Stars` component and all its call sites keep working, but the
   source of truth is the weighted 0..1. This avoids rewriting every card while
   making the model correct. `Stars` gains an optional thumb-percentage mode.
4. `pages/review/[id].tsx`: rebuild as thumb up/down (primary, required) + four
   optional dimension toggles + optional text.
5. `pages/shop/[handle].tsx` reviews tab: add the dimension breakdown.
6. Reviews are keyed per `productId` and roll up to the merchant.

**Done when:** submitting a thumbs-down with all four dimensions on cannot
produce a score above 50%, and the seller page shows a per-dimension breakdown.

## Slice 3 — Order statuses + role gating

1. `data/mock/extras.ts`: `OrderStatus = "pending" | "confirmed" | "shipped" |
   "delivered" | "cancelled"`. Drop `"paid"`. Add `isSale: boolean` so an order
   knows whether the current user is buyer or seller.
2. `data/hooks.ts`: `canUpdateStatus(order, next)` porting upstream's rule —
   seller may set `confirmed`/`shipped`/`delivered`, buyer may only `cancel`.
3. `pages/orders.tsx`: chips for all five, `pending` styled as needs-attention.
4. `pages/orders/[id].tsx`: the stepper becomes
   `pending → confirmed → shipped → delivered`, with `cancelled` as a terminal
   off-ramp. Add the buyer's **Cancel order** action (gated, only while
   `pending`), and the seller's **Confirm order** / **Mark shipped** actions.
5. Shipping info gains `tracking`, `carrier`, `eta` on shipped orders.

**Done when:** a buyer can cancel only a pending order, a seller can confirm
one, and the UI never offers an action the role cannot perform.

## Slice 4 — Multi-currency quoting

1. `ProductData` gains `currency: "sats" | "USD" | "EUR"` (already present but
   always "sats") and the display layer stops assuming sats.
2. `lib/format.ts`: `quotedPrice(product)` returning both the quoted amount and
   the sats equivalent, plus a fixed mock rate table in `data/mock/rates.ts`.
3. Listing + cards show "$40 · ≈38,000 sats" when currency is not sats.
4. Checkout: the invoice countdown becomes the **rate lock** ("price locked for
   9:58"), and a `rate-unavailable` state is designed for the payment step.

**Done when:** a USD-quoted listing is purchasable and never shows a bare sats
number as if the seller set it.

## Slice 5 — Per-size stock + seller-required field

1. `sizeQuantities?: Record<string, number>` on `ProductData`.
2. Sold-out sizes render disabled; add-to-cart blocks when every size is 0.
3. `required?: string` renders as a mandatory input in checkout that blocks pay.

## Slice 6 — Cart: per-seller grouping

1. `useCart` derives `groups: { sellerPubkey, items, subtotal, shipping }[]`.
2. Cart + checkout review render one section per seller, and the confirmation
   copy tells the truth: "3 orders with 3 sellers".
3. Per-seller free-shipping threshold with a progress nudge.

## Deferred (documented, not built now)
Per-mint wallet balances, the configurable storefront (kind 30019), typed order
DMs as structured cards, and `return-request`. Each is a surface of its own and
none of them invalidates a component contract the way slices 1-4 do.

---

## Order and verification
Slices land in order, each type-checked, screenshot-verified at 1440 + 390, and
committed on its own. Playwright drives the interactions that have real state
(fulfilment gating, review weighting, status transitions).

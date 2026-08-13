# Upstream domain gaps

Audit of the redesign's mock domain model against the real Shopstr app
(`D:\Coding\shopstr`, upstream `shopstr-eng/shopstr`), 2026-08-13.

Scope note: infrastructure gaps (no relays, no signing, no real cashu) are
**intentional** and excluded. Everything below is a product/UX/semantic gap
where the mock currently misrepresents how the protocol works, so the design
would need rework at port time.

Ranked by how expensive each is to defer. Items 1-4 change component
*contracts*; the rest add fields or surfaces.

---

## Tier 1: the design currently contradicts the protocol

### 1. `shippingType` uses invented values, and the enum IS the fulfilment model

Upstream is a closed 5-value allowlist, enforced at parse time:

```ts
// shopstr/utils/STATIC-VARIABLES.ts:27-38
"N/A" | "Free" | "Pickup" | "Free/Pickup" | "Added Cost"
```

`parseShippingTag` drops the entire shipping tag when the type is not in
`SHIPPING_OPTIONS` (`utils/parsers/product-tag-helpers.ts:26-32`), and
`getEffectiveShippingCost` forces cost to **0** for `Free`, `Free/Pickup`,
`Pickup` and `N/A` — only `"Added Cost"` ever charges
(`product-tag-helpers.ts:70-95`, verified).

We invent `"Standard"` and `"Tracked"` (`data/mock/listings.ts:25,46`) and type
it loosely as `shippingType?: string` (`data/types.ts:22`).

**Design consequence.** These are not labels, they are the fulfilment rules:
- `"Pickup"` = shipping is impossible → the checkout must NOT offer "Ship to me".
- `"Free/Pickup"` = the buyer chooses per order → the **only** case where our
  global ship/pickup toggle (`pages/checkout.tsx:157-160`) is legitimate.
- `"Added Cost"` = the only case where a shipping line item is real.

Right now checkout offers a fulfilment choice that no listing field authorizes.
Fix the enum, then derive the checkout's options from the listing instead of
always showing both.

### 2. Reviews are a thumb + named dimensions, not a 5-star average

Upstream kind-31555 reviews carry `["rating", value, category]` tags. The
`thumb` category is binary and worth **50% of the whole score**; every other
category splits the remaining 50% equally
(`utils/parsers/review-parser-functions.ts:6-27`, verified). The composer
collects a thumb plus four named booleans: **value, quality, delivery,
communication** (`components/messages/chat-panel.tsx:664,680,696,712`).
Reviews are keyed to a **product address** (`kind:pubkey:dTag`), so they are
per-listing and roll *up* to the merchant.

We use a single 1-5 star picker (`pages/review/[id].tsx:17,70-85`) over
`scores: number[]` with a flat mean (`data/types.ts:49-62`).

**Design consequence.** Wrong scale (0..1 weighted vs 1..5), wrong shape (one
number vs thumb + 4 dimensions), wrong composition (flat mean vs 50/50). The
review screen needs a thumb up/down as the primary control with four optional
toggles, and the seller page can then show a breakdown ("delivery 90%,
communication 60%"), which is impossible today. This is the biggest structural
mismatch in the app.

### 3. Order statuses are wrong, and they are role-gated

Upstream: `pending → confirmed → shipped → delivered`, plus `cancelled` and
`completed`. Authority is enforced: the **seller** owns
`confirmed`/`shipped`/`delivered`, the **buyer** owns only `cancelled`
(`mcp/tools/order-status-auth.ts:3-27`, verified).

We have `OrderStatus = "paid" | "shipped" | "delivered"`
(`data/mock/extras.ts:266`). `"paid"` does not exist upstream; `pending`,
`confirmed` and `cancelled` are all missing.

**Design consequence.** `pending` (paid, not yet acknowledged) is the state
buyers are most anxious in and the one sellers must act on — upstream's seller
dashboard CTA keys off exactly it (`orders-dashboard.tsx:1626`). We have no
seller "confirm order" affordance and **no cancellation path at all**.

### 4. Currency is genuinely multi-currency

Upstream `price` is `[amount, currency]` (`product-parser-functions.ts:96-100`);
a non-sats listing is converted to sats **at checkout** via a live rate, with an
explicit failure state ("Could not look up the current {currency} → sats
exchange rate", `components/product-invoice-card.tsx:659-690`). Sellers also
declare `fiat_options` and a `payment_preference`.

We assert "money is always integer sats" (`data/types.ts:5`).

**Design consequence.** A seller can list in USD. That needs a dual price
display ("$40 · ≈38,000 sats"), a rate-expiry concept, and a mid-checkout rate
failure state. Our invoice countdown (`pages/checkout.tsx:410-431`) is the
natural home for "price locked for N min".

---

## Tier 2: real fields with nowhere to live

### 5. Missing listing fields

| Field | Meaning upstream |
|---|---|
| `sizeQuantities: Map<string,number>` | **per-size stock**; sizes sell out individually |
| `volumePrices`, `weightPrices` | variant axes that **change the price** |
| `bulkPrices` | quantity-break pricing |
| `pickupLocations` | required when type is `Pickup`/`Free/Pickup` |
| `required` | seller-defined field the buyer **must** fill to check out |
| `restrictions` | e.g. "US only, no P.O. box" |
| `contentWarning` | NIP-36; upstream filters these out of the feed |
| `expiration` | listing expiry |
| `publishedAt` / `d` | differ from `createdAt` on edited listings; `d` is event identity |

Highest impact: **`sizeQuantities`** (we let any size be picked and show one
flat `quantity`, `pages/listing/[id].tsx:265-275`; upstream disables sold-out
sizes and blocks add-to-cart when all are empty) and **`required`** (a hard
checkout blocker upstream, `product-invoice-card.tsx:409-414`).

Note `volumePrices`/`bulkPrices` mean **price is not one number** once variants
exist, which our `price * quantity` math (`data/store.tsx:85`) cannot express.

### 6. The buyer form is missing required fields, and pickup uses the wrong form

Upstream has two form types. Shipping requires **Name, Address, City, Postal
Code, State/Province, Country** (`utils/types/types.ts:238-247`). Pickup/digital
uses a **contact** form: Contact, Contact Type, Instructions, all mandatory
(`types.ts:249-254`). There is also a saved-address book (`SavedAddress`).

We collect only `name, address, city, zip` (`data/store.tsx:223-231`) — **no
state/province, no country** — and our pickup step asks for display name + note
(`pages/checkout.tsx:184-188`), which is not a contact method, and never asks
the buyer to choose one of the listing's `pickupLocations`.

### 7. Multi-seller cart: no grouping, discounts, or free-shipping thresholds

Upstream groups the cart by seller pubkey and pays **each seller separately**,
one order and one DM per merchant (`components/cart-invoice-card.tsx:284-290`).
Each seller has a `freeShippingThreshold`; crossing it zeroes that seller's
shipping and drives a "Free shipping unlocked!" nudge
(`utils/cart-totals.ts:47-50`, `components/free-shipping-notification.tsx`).
Discount codes are **per seller** (`utils/cart-discounts.ts:1`). Shipping
multiplies by quantity (`cart-totals.ts:57-61`).

We have one flat list, one subtotal, one total (`data/store.tsx:83-87`), and sum
shipping "per item, not per unit" (`pages/checkout.tsx:106-109`) — the opposite
of upstream. No discount entry, no per-seller sections, no threshold nudge.

**Design consequence.** "You are about to place 3 separate orders with 3
sellers, each with its own shipping and its own DM thread" is a fundamentally
different review screen than our single-total one.

### 8. Wallet hides per-mint balances and pending states

Upstream ecash is `Proof[]` across **multiple mints**, and the wallet shows
**two numbers**: `totalBalance` (all proofs) and `walletBalance` (only the
selected mint's) — `pages/wallet/index.tsx:18-19,47-73,117,123`. There are
dedicated retry/recovery services for stuck mint/melt/swap operations
(`utils/cashu/*`), i.e. pending states are first-class and user-visible.

We have a single `walletBalance: number` (`data/store.tsx:136`) and 4 mock txns
with no status, mint, or timestamp (`data/mock/extras.ts:291-303`).

**Design consequence.** Need balance **per mint** (sats at mint A cannot be
spent at mint B without a swap), a mint picker / add-mint surface, and
**pending** transaction states.

---

## Tier 3: cheap to fix now

### 9. Profile gaps
Upstream kind-0 carries `name, picture, about, banner, lud16, nip05,
payment_preference, fiat_options` (`utils/types/types.ts:212-226`). We lack
**`lud16`** (the lightning address, needed for the payout surface we already
model), `payment_preference`, and we never use `banner`. We also collapse
display `name` into `handle`. `totalSales` is our invention with no upstream
source. NIP-05 has no verified/unverified state, though a badge is exactly what
the UI should show.

### 10. Storefront (kind 30019) is a whole missing surface
Upstream `ShopProfile` + `StorefrontConfig` (`utils/types/types.ts:174-210`)
carry `merchants: string[]` (multi-merchant shops), `productLayout:
grid|list|featured`, `landingPageStyle: classic|hero|minimal`, `shopSlug`,
`customDomain`, fonts, `sections`, `footer`, `navLinks`, and
`showCommunityPage`/`showWalletPage`. Our `pages/shop/[handle].tsx` is one fixed
layout — a seller-themed, seller-configured storefront is a headline upstream
feature we do not represent.

### 11. Order DMs are a typed sequence, not free text
Upstream messages carry a `subject` tag from a specific set: `order-info`,
`order-payment`, `order-receipt`, `payment-change`, `payment-confirmation`,
`shipping-info`, `order-completed`, `listing-inquiry`, `address-change`,
`return-request` (`components/messages/messages.tsx:194-200`). `shipping-info`
specifically carries **tracking, carrier, eta**
(`utils/messages/order-message-utils.ts:121-165`).

Our `ChatMessage` is untyped free text (`data/types.ts:93-101`). Consequences:
order events should render as **structured cards** (upstream does exactly this,
`chat-message.tsx:93-96`); orders need tracking/carrier/ETA fields;
`return-request` is an entire missing flow.

### 12. Listing `status` and the category vocabulary
Upstream `status` gates purchase (sold/inactive must not be buyable); we only
ever set `"active"` (`data/mock/listings.ts:29`), so there is no sold-out state
in the design. And upstream `CATEGORIES` is a fixed 23-entry list
(`STATIC-VARIABLES.ts:1-25`) whose first six are *transaction types* (Digital,
Physical, Services, Resale, Exchange, Swap) sharing the `t`-tag namespace with
real categories. We invent `"Ceramics"`, `"Keyboards"`, `"Apparel"`, which would
return empty filter results on port.

---

## Correctly absent (do not add)
No auctions/bidding, no tax calculation, and no shipping zones/regions beyond
the free-text `restrictions` field exist upstream.

## Suggested order
1. Shipping enum + derive fulfilment options from the listing
2. Review model → thumb + 4 dimensions
3. Order statuses incl. `pending`/`confirmed`/`cancelled`, with role gating
4. Currency as real multi-currency
5. Per-seller cart grouping + thresholds + discounts
6. Full shipping/contact form fields
7. `sizeQuantities` + `required`
8. Per-mint wallet balances + pending states

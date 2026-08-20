# Design decisions: where the redesign disagrees with current Shopstr on purpose

If you look at the redesign and see something that looks "wrong" compared to today's app, check here first before changing it back. Each entry is a decision, the reason, and where the receipts live.

For the underlying audit that produced these, see [`upstream-domain-gaps.md`](upstream-domain-gaps.md).

---

## 1. Checkout has its own URL and persistent state

**Today**: checkout lives inline inside the product page as a `<ProductInvoiceCard>`, no URL of its own, state in `localStorage`.

**Redesign**: `/checkout` is a real route with a 4-5 step wizard. The wizard's state (`useCheckout` in `data/store.ts`) survives navigation. There is an explicit review-before-pay step.

**Why**: a checkout without a URL is un-linkable and un-recoverable. Users refresh, come back later, share carts. On mobile especially, an inline invoice card fights the browser's native "keep this screen" affordances. The review-before-pay step exists because the current flow shows a total and immediately produces a Lightning invoice, giving users no last chance to check what they're paying for.

**On port**: keep the wizard URL. On commit, publish the NIP-17 order event to the seller and clear the wizard state.

---

## 2. Reviews compute score on read; never store an average

**Today**: reviews exist as NIP-85 events with a thumb + optional dimensions. Some display code implies averages could be stored.

**Redesign**: every displayed rating is computed from raw `Review` events by `weightedScore()` in `data/hooks.ts`. Thumb carries 50% of the score; supplied dimensions split the remaining 50% equally; missing dimensions mean "not rated", not "bad".

**Why**: NIP-85 is the source of truth. A stored average is a lie waiting to happen: it drifts, it stales, it disagrees with the events any relay can see. Compute-on-read is the only way a decentralized review system stays honest.

**On port**: do not add a "cached rating" field to `Profile` or `ProductData`. If performance becomes an issue, memoize in the client, do not persist.

---

## 3. Shipping is an enum, and it drives fulfilment

**Today**: `utils/STATIC-VARIABLES.ts` defines the enum (`N/A`, `Free`, `Pickup`, `Free/Pickup`, `Added Cost`); upstream drops the shipping tag entirely when the value is off-list.

**Redesign**: the checkout wizard's fulfilment step reads `shippingType` and shows the right options: "Ship to me" only when the enum allows, "Pick it up" only when the enum allows, both when the enum is `Free/Pickup`. `shippingCost` charges only when `Added Cost`.

**Why**: the current app frequently shows shipping cost fields that are meaningless (a `Pickup`-only listing can't ship). Driving fulfilment from the enum removes those dead paths.

**On port**: keep the enum closed. If you need a new fulfilment mode, add it to the enum in both this repo and upstream simultaneously.

---

## 4. Order status is a role-gated state machine

**Today**: order status transitions exist but are loosely enforced.

**Redesign**: `canUpdateStatus(order, next)` in `data/hooks.ts` is the only place transitions are validated. A buyer can only move an order the way a buyer is allowed to; same for sellers. `nextAction(order)` returns a single "do the next thing" descriptor that drives the CTA on the order detail page.

**Why**: without role gating, the UI ends up with buttons that publish events the other party will ignore, and users lose trust in the app.

**On port**: mirror this exactly. If the upstream state machine disagrees, fix upstream to match rather than loosening the redesign.

---

## 5. Multi-currency quoting with a rate lock

**Today**: prices are integer sats. Display in other currencies is ad hoc.

**Redesign**: money is stored as integer sats everywhere (unchanged), but display in a chosen currency is a leaf-level conversion using a rate that is locked for the duration of a checkout. Once you enter checkout, the sats-to-your-currency conversion does not move.

**Why**: sats are the truth; conversion is UX. A rate that shifts mid-checkout is the fastest way to look untrustworthy.

**On port**: the rate lock lives in the checkout wizard state. Fetch fresh on entry, freeze until commit or abandon.

---

## 6. Communities are digest-first, with a real moderator queue

**Today**: communities exist as NIP-72 events but the current UI treats them as a generic groups feature.

**Redesign**: `/communities` is a cross-community digest ("what's new across the communities I belong to"). Each community page shows only approved posts (per NIP-72's approval mechanism, kind 4550). Moderators get a dedicated `/queue` view showing pending submissions. Authors get "my pending submissions" visibility on their own drafts.

**Why**: NIP-72 is fundamentally an approval-gated content model. Ignoring the approval mechanism produces a "communities" feature that doesn't actually match the protocol, and any moderator action becomes invisible. See `docs/community-overhaul-spec.md` for the full spec.

**On port**: never render unapproved posts in the public feed. Moderator queue is a separate query for kind 1 events without a matching 4550 approval.

---

## 7. Chat is commerce-first

**Today**: chat is a generic DM feature.

**Redesign**: the inbox is item-aware. Every thread has an optional `productId`, and the thread summary denormalizes `productTitle` and `productImage` so the inbox reads like conversations about listings and orders, not a generic chat client.

**Why**: on a marketplace, almost every conversation is about a listing or an order. Making that context first-class removes the "which thing were we talking about?" tax.

**On port**: when unwrapping NIP-17 events, extract the listing reference from the opener message and hoist it into the thread summary.

---

## 8. Every data surface has five explicit states

**Today**: many screens spin, then blank, then show data.

**Redesign**: **loading**, **empty**, **no-results**, **not-found**, **populated**. There is no spinner in the app. Chrome (nav, headers, tabs, borders) paints immediately; content areas fill with skeletons that match the real card geometry exactly, so nothing reflows when data lands.

- **Loading**: skeleton primitives from `components/ui/Skeleton.tsx` and card skeletons from `components/skeletons.tsx`.
- **Empty** (true zero): `EmptyState` `variant="page"`. sticker, headline, one CTA that works.
- **No-results** (filter zero): `EmptyState` `variant="inline"`. dashed box, "Clear filters" style recovery.
- **Not-found** (bad id): a dedicated 404 with back navigation.
- **Populated**: the real UI.

**Why**: shippability. Screens are the easy part; states are what make an app feel real. On port, keep the primitives; only their trigger conditions change (`isLoading` becomes real request state, `data.length === 0` still means empty).

**On port**: do not add a spinner primitive. If a rail loads too fast to skeleton, use a fade-in from opacity 0.9, not a spinner.

---

## 9. Motion is token-driven and hover is gated

**Today**: motion is ad hoc.

**Redesign**: four durations, four easing curves, one shared interaction vocabulary (press, pop, stagger, slide). Hover effects are wrapped in `@media (hover:hover) and (pointer:fine)` so touch users never get a stuck hover state. Everything respects `prefers-reduced-motion`.

**Why**: consistent motion is what separates "app" from "site". Gating hover is the single biggest bug fix for touch users nobody thinks to do.

**On port**: do not touch. Motion tokens and gating are already implemented in `styles/design-system.css` and `styles/globals.css`.

---

## 10. Neutral is the primary color; six accents plus purple carry personality

**Today**: purple + bitcoin orange, with informal use of other colors.

**Redesign**: surfaces are true-neutral grey (equal RGB channels, zero chroma). Purple `#5A51E5` is the primary accent. Six named accents (orange, yellow, red, green, blue, pink) plus purple. No other colors. Bitcoin orange is one of the six, not a special case.

**Why**: a marketplace needs surfaces that step back and content that steps forward. Warm neutrals fight product photography; a true-neutral base lets images read cleanly.

**On port**: do not touch. Tokens are in `styles/design-system.css` as `--ds-*` and mapped to Tailwind via `@theme`.

---

## If you find a decision you disagree with

Open an issue or ping me. Every entry above has a reason. Most reasons have moved through the code more than once. If the reason no longer holds, the decision should change; if you just prefer the current behaviour, the redesign wins by default.

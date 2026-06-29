# Shopstr — App Map (IA, flows, features)

Single source of truth for what the app is and what we're building. Synthesized from
the Figma affinity map + proposed IA board, the flow list (A–H), and the 25-feature
inventory. Frontend + mock only this phase; ports to the real repo later.

> Not all hard-and-fast. Modify as we go when it's useful.

## What Shopstr is
A mobile-first, Nostr-native marketplace for a **circular Bitcoin economy** — buy and
sell real goods for **sats**. Identity is **npub/pubkey** (NIP-07 extension, NIP-46
bunker, NIP-49 nsec, or a silently-generated key). Money is **Cashu (NIP-60) + Lightning**.
Listings are **NIP-99** product events. DMs are **NIP-17** gift-wrapped. No email/phone/password.

## Audience color code (from affinity map)
- **Buyer-facing** (yellow) · **Seller-facing** (blue) · **Both / fluid role** (green)

## Affinity map — every feature by job
- **DISCOVER (find what to buy):** browse default feed · by category · by type (Digital/Physical/Service/Resale/Exchange/Swap) · by location (country) · "New this week" · "Near me" · "Following" (follow graph) · keyword search (local today) · WoT filter toggle · sort (recent/price/popular) · product card in grid
- **EVALUATE (decide on a listing):** listing detail · image gallery · title + price in sats · variants (size/weight/volume) · shipping policy · description (Markdown) · seller card + avatar · seller's other listings · merchant review badge · follow-seller indicator (PR #460) · share link
- **TRANSACT (buy and pay):** add to cart · cart (multi-seller) · ship vs pickup · shipping address · saved address (PR #396) · create account (delayed wall step 3) · sign in (extension/bunker/nsec) · discount code · choose payment · Lightning (QR + countdown) · Cashu paste · order confirmation
- **COMMUNICATE (talk to others):** inquiry from listing (with product context) · reply to seller DM · receive shipping update DM · send order DM (seller) · auto payment/shipping confirm DMs (PR #155) · view all DM threads · new-message notification
- **SETTLE (close the loop):** save encrypted nsec (post-payment) · leave review (NIP-85) · 7-day review reminder DM · snooze review · open dispute · track shipping via DM · buyer order history · seller sales dashboard (PR #440) · mark shipped · future escrow confirm-delivery
- **EARN (sell/manage — mostly out of scope this term):** create/edit/delete listing · variants & shipping · discount code · shopfront preview · shop profile · encrypted digital delivery (PR #231) · Top Product / Total Revenue · receive Cashu on sale
- **WALLET & SATS:** Cashu balance · claim token (manual) · post-claim recommendations card (NEW) · send sats · withdraw to Lightning (retention card) · tx history · connect NWC · switch default payout · pre-applied wallet balance on Buy CTA
- **IDENTITY & SETTINGS:** sign in (NIP-07/46/49) · create account (silent or explicit) · view/edit profile · follow merchant (PR #460, NIP-02) · relays (NIP-65) · content filters (NIP-36) · theme toggle · community moderation (NIP-72) · API keys

## Proposed IA — routes (mobile-first)

### PUBLIC DISCOVERY (no auth)
`/` Landing → `/marketplace` (default feed) · `/search` (full results, NIP-50 future) ·
`/categories` → `/categories/[c]` · `/new` · `/near-me` (geo) · `/following` (kind:3) ·
`/listing/[id]` (NIP-99) → `/shop/[slug]` (canonical shopfront; `/marketplace/[npub]` 301→slug) ·
`/communities` (NIP-72) → `/communities/[naddr]`

### ACCOUNT GATE (modal + onboarding)
`SignInModal` (at `/checkout/account` or top-bar Sign In) → NIP-07 ext / NIP-46 bunker /
NIP-49 nsec / **Create New Account** → `/onboarding/keys` (generate + NIP-49 encrypt) →
`/onboarding/user-type` (buyer|seller fork) → `/onboarding/user-profile` (NIP-01) →
buyer: `/onboarding/wallet` (Cashu default, NWC toggle) · seller: `/onboarding/shop-profile`

### TRANSACTIONAL (cart + 5-step routed checkout)
`/cart` (multi-seller, localStorage) → **Checkout** →
`/checkout/order-type` (1/5) → `/checkout/shipping` OR `/checkout/pickup` (2/5) →
`/checkout/account` (3/5 **DELAYED WALL**) → `/checkout/payment` (4/5, Lightning|Cashu) →
`/checkout/confirm` = `/order-summary/[id]` (5/5, loop-closing).
Direct **Buy Now** from `/listing/[id]` jumps straight into the checkout machine (skips cart).

### BUYER AUTHED (ProtectedRoute)
`/orders` (purchase records, split from chat) · `/order-summary/[id]` (permanent) ·
`/messages` (NIP-17 threads) → `/messages/[npub]` · `/wallet` (NIP-60) → `/wallet/send` ·
`/wallet/receive` · `/wallet/withdraw` (Lightning melt + retention sheet) · `/profile`

### SELLER AUTHED (ProtectedRoute — mostly out of scope)
`/my-listings` (NIP-99 manager) · `/my-listings/new` · `/my-listings/edit/[id]` ·
`/my-listings/orders` (sales dashboard, PR #440)

### SETTINGS (protected, off main path)
`/settings` · `/settings/user-profile` · `/settings/shop-profile` ·
`/settings/addresses` (PR #396) · `/settings/preferences` (theme + NIP-36) ·
`/settings/relays` (NIP-65) · `/settings/nwc` · `/settings/api-keys` · `/settings/community` (NIP-72)

### SYSTEM / API (non-UI)
`/api/health` · `/api/sitemap.xml` · `/api/robots.txt` · `/api/.well-known/agent.json` ·
`/api/db/*` (Postgres cache) · `/api/storefront/*` · `/api/mcp/*`

## Cross-cutting UI
- **Bottom nav:** Browse · Cart · Orders · Wallet · Profile
- **Discovery top bar:** search (promoted) + filters
- **Profile menu:** identity · my listings · settings · wallet · sign out
- Report/moderation; **empty / loading / error states on every surface**

## Key principles (from the IA)
1. **Delayed auth wall.** No sign-in at "Buy" — the wall sits at `/checkout/account` (step 3/5),
   after order-type + shipping, before payment. First buyer need silently generates a key;
   "save your account" (passphrase) prompts at persistence, before payment.
2. **Separate records from messages.** `/orders` = records only; `/messages` = DM threads
   (resolves the conflict where both shared `/orders`).
3. **Loop-closing confirmation.** `/order-summary/[id]` invites the next action: leave review,
   save key, browse. Review is surfaced (confirmation + 7-day DM + in-thread CTA), not buried.
4. **Canonical shopfront** `/shop/[slug]`; legacy `/marketplace/[npub]` 301-redirects.
5. **Wallet closes its own loop:** post-claim recommendations card on `/wallet` after a successful claim.

## Gaps / conflicts flagged (initial pass)
- **GAP** "Find a specific seller by name" routes through local-only search → lift search to a real `/search` route (or a "Find a seller" surface).
- **GAP** "How much have I spent this month" — wallet has balance, no spend analytics. Future, out of scope.
- **CONFLICT** "Sign in" lived in 3 places (top nav, Buy click, /onboarding/keys) → canonical home is `/checkout/account` + "Already have an account?" link; top-nav stays for explicit returning users.
- **CONFLICT** DM threads + order records shared `/orders` → split (Principle 2).
- **WRONG PLACE** Saved Addresses had no home → `/settings/addresses` + inline during checkout shipping.
- **WRONG PLACE** Post-claim recommendations had no home → on `/wallet` after claim.

## Scope this phase
In: buyer Discovery / Buying / Checkout / Account / Post-purchase / Messaging / Wallet flows.
Out (listed for completeness): seller create/manage flows (except the one in-scope seller touch:
claim/fulfil a sale → post-claim buyer nudge). Dispute is future-state.

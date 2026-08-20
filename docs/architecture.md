# Architecture: the shape of the port

One rule to remember, one file to touch. Everything below explains why.

## The data boundary

Every component and every page reads data from **one file**: [`data/hooks.ts`](../data/hooks.ts). Nothing else in the codebase talks to a fetch, a relay, a WebSocket, a mock file, or a context provider directly. Not `components/`, not `pages/`, nowhere.

Each hook returns the same envelope:

```ts
{ data: T, isLoading: boolean }
```

Loading is real (not decorative): a first-load simulator fires once per data family per session, so skeletons are visible today. On port, you rewrite the six or so hook bodies to read real Nostr events and Cashu state, keep the `{ data, isLoading }` shape, and every screen in the app works unchanged.

**The port is: rewrite hook bodies, don't rewrite screens.** If you catch yourself editing a component, stop and route it through a hook instead.

## Repo layout

```
data/
  hooks.ts        the only data boundary (rewrite this on port)
  types.ts        shared contracts, DO NOT edit shapes lightly
  store.ts        mutable client state (cart, session, checkout)
  mock/           mock catalogues; delete or gate behind an env flag on port

pages/            Next.js Pages Router; each file is a route
  index.tsx       marketing landing
  marketplace.tsx browse feed
  listing/[id].tsx product detail
  cart.tsx, checkout.tsx, orders.tsx, orders/[id].tsx
  messages.tsx, messages/[handle].tsx
  communities.tsx, communities/[slug]/*
  sell/*, wallet/*, settings/*
  dev/*           internal galleries (states, cards, loaders, landing)

components/       pure presentation: props in, JSX out. NO hooks that fetch.
  ui/             tokens, primitives (Skeleton, EmptyState, Button, etc.)
  cards/          H1, H2, H4, H5, P1, solid, the locked card system
  ...one folder per feature

styles/
  design-system.css   --ds-* tokens (color, type, spacing, radius, motion)
  globals.css         Tailwind v4 @theme mapping + hover-gating

Assets/           21 sticker SVGs (imported via @/Assets alias)
```

## Contracts that must not drift

These live in [`data/types.ts`](../data/types.ts) and match the current Shopstr app on purpose. If your Nostr adapter cannot fill one of these fields, that's a real gap to fix in the adapter, not a reason to change the shape.

- **`ProductData`**: NIP-99 classified listings. `price` and `totalCost` are **integer sats**. `shippingType` is a **closed enum** from `utils/STATIC-VARIABLES.ts`; drop the shipping tag entirely when it is not one of the five values.
- **`Profile`**: `pubkey`, `npub`, `handle`, optional `nip05`. Never email / phone / password.
- **`Review`**: NIP-85 kind 31555. `thumb` is mandatory binary. `dimensions` is `Partial<Record<ReviewDimension, boolean>>`; absent means "not rated", not "bad". Score is computed by `weightedScore()` in `data/hooks.ts` (50% thumb + 50% split across supplied dimensions). **Never pre-store an average.**
- **`ChatThread` / `ChatMessage`**: NIP-17 gift-wrapped DMs. `productId` is optional so a thread can be attached to a listing.
- **`Order`**: role-gated statuses. See `canUpdateStatus()` in `data/hooks.ts`. the buyer and seller each have a fixed set of allowed transitions.

## The three rules that keep the port small

1. **Screens never fetch.** If a screen needs data, it calls a hook. If a hook is missing, add it to `data/hooks.ts`; don't inline a fetch.
2. **Types are frozen.** `data/types.ts` mirrors the real Shopstr domain. Change types only when the real Shopstr shape changes, and only after reading [`upstream-domain-gaps.md`](upstream-domain-gaps.md).
3. **Sats are integers.** Every money value is `number` and represents sats. Any conversion (USD, EUR, etc.) is display-only, done at the leaf.

## What the mock layer does today (and how it maps to real)

Today `data/hooks.ts` reads from `data/mock/*` synchronously and gates it through `useSimulatedLoad(key)` to make the loading state visible. On port:

- Replace mock imports with a Nostr client + Cashu wallet.
- Drop `useSimulatedLoad` (real network latency is your loading state now).
- Keep the `{ data, isLoading }` envelope so components stay unchanged.

The full hook-by-hook mapping (which Nostr kind, which tag, which relay query) is in [`data-hooks-contract.md`](data-hooks-contract.md).

## What lives outside the hook layer

- **Client state** (cart, session, checkout wizard, drafts, wallet txns) lives in `data/store.ts` and is re-exported through `data/hooks.ts`. Persistence is `localStorage` today; on port you decide whether cart / drafts stay local or become NIP-51 lists / Cashu tokens.
- **Motion** is CSS + a few `framer-motion` calls, all pointing at `--ds-*` tokens. Do not touch during the port.
- **State primitives** (`components/ui/Skeleton.tsx`, `components/ui/EmptyState.tsx`, `components/skeletons.tsx`) are the entire loading / empty vocabulary. Do not touch during the port.

## Failure modes to expect

- **A hook's data shape changes mid-port.** If the real Nostr event carries a field the mock did not (e.g. an `expiration` tag), add it to the type in `data/types.ts` and let the component pick it up. Do not add it as an "extras" bag on the side.
- **Loading feels different once real.** The simulator delays 500-900ms; real relays can be faster or slower. Skeletons already fit the real card geometry, so nothing reflows either way. If a rail feels wrong, tune the query, not the skeleton.
- **A component tries to import from `data/mock/*` after your rewrite.** That is a bug from before the port; move that read into `data/hooks.ts` and re-export.

# Handoff: porting the redesign into Shopstr

For the maintainer picking this up. Read the five docs in this folder, in this order, and you have everything you need to wire the redesign to the live Nostr backend.

## What this repo is

A complete frontend redesign of Shopstr, built in the real stack (Next.js 16, React 19, TypeScript, Tailwind v4). About 40 routes, mobile-primary with dedicated desktop layouts, every data surface implementing loading / empty / no-results / not-found / populated. Runs on mock data today.

## What you actually need to do

Swap the mock hook layer for real Nostr / Cashu calls. The redesign was built so this is the only step: no component touches a fetch or a relay, every screen consumes the same six-ish hooks, money is already integer sats, identity is already npub + handle. When the hook bodies read real events, the UI is done.

## Reading order

1. **[architecture.md](architecture.md)** covers the shape of the codebase and the one rule that keeps the port small: the data boundary.
2. **[data-hooks-contract.md](data-hooks-contract.md)** is the wiring table. Every hook, its return shape, and which Nostr event kind / NIP it should read from in production. This is the doc you will live inside.
3. **[design-decisions.md](design-decisions.md)** lists where the redesign disagrees with the current app on purpose. If you see something that looks "wrong" compared to today's Shopstr, check here before changing it.
4. **[upstream-domain-gaps.md](upstream-domain-gaps.md)** is the audit that produced those decisions, with citations back to your codebase. Reference material for #3.
5. **[running-and-verifying.md](running-and-verifying.md)** covers the dev server, route map, and how to check you have not regressed anything during the port.

## What NOT to read

- `CLAUDE.md` in the repo root is the operating manual for anyone extending the code (design tokens, motion rules, brand rules). For a pure port you can skip it.
- `docs/app-map.md`, `docs/community-overhaul-spec.md`, `docs/settings-wallet-plan.md`, `docs/landing-plan-v2.md`, `docs/domain-fix-plan.md`, `docs/upstream-domain-gaps.md`, `docs/mid-term.md`, and the blog / evaluation files are my working notes. They are useful context, not required reading. The five files above are the handoff.

## Where the code lives

- Redesign repo: https://github.com/Ashu-2006/shopstr-redesign
- Live deployment: https://shopstr-redesign.vercel.app
- Figma file (design system + final screens, transferable): shared separately.

## Reaching me

I will stay available for design questions as the port lands. Preferred contact: whatever channel we used during SoB.

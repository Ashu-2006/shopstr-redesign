# Shopstr Redesign — Project Instructions

Frontend + design only for a Bitcoin circular-economy marketplace (buy/sell for sats).
Mock data only; ports back to the real Shopstr repo later. See `data/` for the
architecture and **`docs/app-map.md`** for the full IA / routes / flows / principles.
These instructions override defaults.

## Git workflow (IMPORTANT)
- **Commit after every major piece of work** on your own initiative (a feature, a screen, a nav/layout change, a refactor). Do not wait to be asked to commit. Write a clear message and end it with the required `Co-Authored-By` trailer.
- **Never push unless I explicitly ask you to push.** When I do ask, **push directly to `main`** (this repo works on `main`; do not open PRs or feature branches unless I say so).
- Never use `--no-verify` or skip hooks. Never force-push `main`.

## Stack
- Next.js 16 (Pages Router, Turbopack), React 19, TypeScript 5, `@/` alias to repo root.
- Tailwind CSS v4 (CSS-first: `@import "tailwindcss"` + `@theme inline`). NOT v3 — no `tailwind.config.js` utilities, no `@tailwind base`. Any font/other `@import url(...)` MUST come BEFORE `@import "tailwindcss"` (Tailwind expands into rules; CSS requires all `@import`s first, else the build 500s).
- Motion: framer-motion / motion 12, gsap 3. three.js available. dialkit + agentation are dev tools.

## Data architecture (non-negotiable)
- No page/component imports a fetch, relay, context, or mock directly. ALL data flows through `data/hooks.ts` (`useListings`, `useListing`, `useReviews`, `useProfile`, `useCart`, `useChats`), each returning `{ data, isLoading }`.
- `components/` are pure presentation: props in, JSX out. No hooks/fetch/context. Pages call hooks and pass data down.
- Money is always integer **sats**. Identity is **npub/pubkey + handle + optional nip05** — never email/phone/password. Listing type is `ProductData` in `data/types.ts`.
- Reviews: rating = avg(scores), count = scores.length. Never pre-store the average.

## Design language
**Style name: "Sticker Brutalism"** (neo-brutalist structure + Y2K/sticker-pop maximalism + editorial grotesque type). Bold, playful, geometric. Tokens live in `styles/design-system.css` as `--ds-*`, mapped into Tailwind `@theme` in `styles/globals.css`. ALWAYS use tokens — never hardcode hex, never use Tailwind's default color palette (no `bg-slate-500` etc.).

Visual references: `design/style-guide.html` (the system) and `design/screens.html` (9 screens across 3 layout variations: A Bento Home, B Sticker Profile, C Original full-bleed pop). Serve from the PROJECT ROOT so `/Assets/*` resolves.

### Color
- **LIGHT THEME IS PRIMARY.** Background is neutral paper (`--ds-paper`), text is mostly black (`--ds-text`).
- **Neutral is the primary color**: primary buttons and primary backgrounds are neutral (ink `#121212` / paper). 
- **Purple `#5A51E5` is the primary accent** — secondary buttons, structural emphasis, links.
- **Playful accents — the ONLY six**: orange `#FF8336`, yellow `#FFC313`, red `#FF4040`, green `#25C26E`, blue `#00AEFF` (bright sky blue), pink `#FF3DAC`. No others — no violet, no indigo-blue. Used **extensively and creatively** — chips, shapes, category coding, decorative assets. Take every reasonable chance to use them.
- Some modes use an accent color as a **full-bleed background** (e.g. the pink product screen). Will be specified per-mode.
- **Text is white ONLY over ink (`#121212`) and over purple (`#5A51E5`).** Over all six accents (including blue) and everywhere else, text is black.

### Type — three OFL families, three jobs
- **Display**: Archivo Black, **UPPERCASE**, tight tracking (`.ds-display`). Headings shout.
- **Body**: Space Grotesk.
- **Value/numbers**: Space Mono with **tabular figures** (`.ds-value`). Every number that represents value (sats, prices, ratings, counts) uses it.

### Separation — NO SHADOWS
- Never use `box-shadow` / `drop-shadow` for elevation. Create separation with **spacing first**.
- Use a 1–2px **stroke** (`--ds-stroke`, color = ink) only when spacing alone isn't enough.

### Shapes as assets
- Geometric shapes — circle, square, triangle, semicircle, arrow — are first-class
  decorative AND functional elements (see the logo, the "Buy / chat" control row, nav).
  Use them as buttons, accents, bullets, dividers, backgrounds. Be generous and creative.

### Sticker library (`/Assets`, 21 SVGs)
Named `shape-*` (sparkle, starburst, daisy, sun-rays, heart-circle, smiley, hand, sunstar-*, etc.) and `badge-*` (new-round/arch/speech/oval, love-heart, bff-star). Scatter them through the UI for personality. Three ways to use them, all encouraged:
- **Decoration**: position-absolute, behind/around content, rotated. Recolor/resize freely (they're SVG; the source palette is close-but-not-identical to our tokens — that's fine, or recolor to match).
- **As buttons**: a sticker IS the control (e.g. the chat/more buttons in the control row). Hover = pop + counter-rotate (`scale(1.12) rotate(-12deg)`), active = press (`scale(.94)`).
- **Letter-swap**: replace a glyph (often "o") in a display heading with a sticker — `.swap img { height:.78em; vertical-align:-.12em }`, spin on heading hover. See the `How will today change tomorrow?` reference.
- **On-action reveal**: a sticker pops in to reward a tap (Add-to-cart → sparkle).

### Motion / interaction (use the installed skills)
- Interaction libs available: framer-motion/motion, gsap, the `transitions-dev` skill (21 `t-*` CSS transitions with motion tokens), make-interfaces principles.
- Default interactions: scale-on-press `0.96`; sticker pop/spin; tab/pill slide; success-check stroke-draw on confirmation; staggered enter (~100ms). Spring `bounce:0`. Name transition properties — never `transition: all`. Always keep the `prefers-reduced-motion` guard.
- **Hover vs tap logic (required):** gate hover effects behind `@media (hover:hover)` so touch devices never get a stuck hover state. Touch interactions fire on tap/`:active` (or a JS-toggled `.tapped` class for replayable pops). Phone-mockup "preview" wiggles are desktop-only. In React this is automatic via event handlers; in static HTML use the `@media(hover:hover)` + `.tapped` pattern (see `design/screens.html`).

### Assets / sticker file paths
- Static design files (`design/*.html`) reference stickers with a RELATIVE path: `assets/<name>.svg` (a copy of `/Assets` lives at `design/assets/`). Never use an absolute `/Assets/...` in a static file — it only resolves when served from project root and 404s otherwise.
- The React app imports from the root `Assets/` via the `@/` alias.

### Radius
- Chunky squircles and pills are the brand. Prefer large radii (`--ds-radius-lg`+, `--ds-radius-pill`).
- Respect **concentric radius**: inner radius = outer − padding.

### Motion (make-interfaces principles)
- Scale-on-press `0.96` (`.ds-press`). Spring transitions use `bounce: 0`.
- Split + stagger enter animations (~100ms). Exits subtle. `transition: all` is banned — name properties.
- Icons: Phosphor + Bitcoin Design "Atoms" (Bitcoin/Nostr). Use `tabular-nums` on live numbers.

## Build workflow (IMPORTANT)
- **Responsive web app**, not phone-in-a-frame mockups. Support mobile AND desktop, but **design mobile-primary**. Real, production-grade web layouts.
- **Complete information + hierarchy**: include every piece of info a user actually needs on a screen, and order it by importance. Don't ship thin/placeholder screens.
- **Iterative loop**: build a slice → verify it renders with Playwright (screenshot) → the user reviews and says what to fix → iterate. Always self-verify before handing back.
- Reference a Pinterest layout for structure (pick ONE, build it faithfully), but the CONTENT/copy is ours to decide.

## Chosen card system (locked, from design/editorial-swipe-explorations.html)
- **H5 (wide editorial w/ description)** = the DEFAULT list card for most feed/list items (image-left, tags, title, 2-line description, price, rating).
- **H1 (overlay-bottom + numeral)** = the top "Featured" horizontal auto-scrolling carousel.
- **H2 (split, text on purple)** = the "Category spotlight" feature card.
- **H4 (full-bleed accent, inset photo)** = a single centered "break" card mid-feed to break rhythm.
- **P1 (roomy, price chip)** = the "Near you" horizontal-scroll card.
- **Solid compact** (hard accent color + text + sticker element, full size) = category tiles.
- **Icons: Phosphor** (`@phosphor-icons/web`, bold weight, `<i class="ph-bold ph-*">`); React app uses `@phosphor-icons/react`. Bitcoin/Nostr glyphs still from Bitcoin Design "Atoms". Brand sticker SVGs stay as-is (not icons).
- **Transitions (premium):** staggered card enter (~55-60ms/child via `.stagger` + `rise` keyframe), carousel auto-advance (pauses on hover/touch), hover-lift on cards (desktop only), cart-badge bump, screen route transition. Working reference: `design/app-prototype.html`.

## Marketplace / browsing UX notes (from review)
- **Search + filters = progressive disclosure.** Don't show the full search field + every filter row by default. Collapse them; reveal on click/tap (a search icon expands the field; a "Filters" control opens the chips). Keep the default browse view clean.
- **Avoid cramped grids.** The plain 2-col card grid felt small/cramped on mobile. Vary the rhythm — mixed tile sizes, editorial rows, magazine/asymmetric layouts — so browsing never feels monotonous.

## Loading + empty states (the rules; full spec in docs/superpowers/specs/2026-08-12-loading-empty-states-design.md)
Every data surface implements: **loading (skeleton) / empty / no-results / not-found / populated.**
- **Skeleton-first, never a spinner.** No spinner primitive exists in this app; don't add one. Chrome (nav, headers, tabs, borders) paints immediately; content areas fill with `Skeleton` blocks (`components/ui/Skeleton.tsx`, `.ds-skeleton` gradient sweep, `--ds-dur-loop`). Card skeletons in `components/skeletons.tsx` mirror the real card geometry exactly (same frame, radius, min-heights) so NOTHING reflows when data lands.
- **Never re-skeleton shown data.** `useSimulatedLoad` in `data/hooks.ts` fires once per data family per session. Tab/filter switches never show loading UI. No `?state=` dev overrides; state derives from `isLoading` only.
- **Empty is not no-results.** True zero: `EmptyState` page variant (sticker + display headline + body + a CTA that WORKS). Filter/search zero: `variant="inline"` (dashed box, chrome preserved, "Clear filters"-style recovery). Dynamic routes with a bad id: not-found page variant + back nav; `return null` blank screens are banned.
- **Copy never lies.** Counts and lead-ins render only when > 0 (no "0 items", no "Active 0"). Optional discovery rails (Top sellers, Near you, claim recs) hide entirely when empty; destination surfaces show designed empties. Headline: short, present tense; body: one line that explains and recovers.
- Reduced motion: the sweep falls back to a static fill (already in globals.css); keep that guard when touching skeleton CSS.

## Pinterest reference rule (IMPORTANT)
The `Pinterest/` folder holds layout/component references. **If you are referencing a
layout or component from a Pinterest image, build it FULLY like that ONE reference.
Do NOT mix layouts** — don't take the header from one and the grid from another in the
same component. Pick one reference per thing and execute it faithfully end-to-end.

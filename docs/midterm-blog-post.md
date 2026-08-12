# Redesigning Shopstr: a mobile-first marketplace for the Bitcoin circular economy

*Summer of Bitcoin 2026 - Midterm progress update*

## Who I am and what I am working on

I am a designer working on Shopstr, a marketplace built on Bitcoin and Nostr where people buy and sell real goods for sats. My project is a full redesign of the Shopstr experience: a new visual language, a cleaner information architecture, and a mobile-first product that feels like a real consumer marketplace instead of a developer tool. Over the program I have also started implementing the redesign in code, opening frontend work on the real stack rather than handing off static mockups.

## The problem I am solving

Shopstr already works as a censorship-resistant, peer-to-peer marketplace. The gap is experience. For most people, shopping happens on a phone, and the bar is set by mainstream e-commerce apps. If buying and selling for sats feels harder or less polished than buying with a card, the circular economy never gets going.

So the problem is twofold:

- Make the marketplace genuinely pleasant to browse, search, and buy on mobile.
- Design the circular economy itself, the flows that turn a buyer into a seller and keep sats circulating inside the app, instead of just leaking out after a single purchase.

## What I completed in the first six weeks

- Primary and secondary research on marketplace UX and the existing Shopstr product, with analysis of the findings.
- A full Features and Function Inventory of the current app.
- A new site map and navigation structure for the redesigned app.
- A UX audit with concrete, approved improvements.
- The primary user flows mapped out: browsing, search and filtering, product detail, and buying.
- A design system: color tokens, a three-family type system, spacing, radii, and a "Sticker Brutalism" neo-brutalist visual language, all as reusable tokens.
- A set of supporting visual assets (shapes, stickers, badges) the design language relies on.
- Wireframes for the new and updated UX flows.
- A rough but working prototype built in code (with AI assistance) so the direction can be clicked through, not just looked at.

## The hardest problem I faced

The hardest part has been crossing from "designer who can mock things up" to "person who ships working frontend code." I am not primarily a frontend developer, and the project's deliverables grew after selection to include real implementation, not just design.

A concrete example: getting a modern Tailwind CSS v4 setup working, where stylesheet import ordering is strict and a single mistake silently breaks the whole build. My instinct was to debug it the way a designer tweaks a mockup, by changing values until something looks right. That got me nowhere. The lesson was that frontend problems have to be diagnosed structurally, by understanding the build pipeline and why the tool behaves the way it does. I cannot treat the frontend as a black box; I have to understand enough of the architecture to reason about failures.

## What I learned about Bitcoin, open source, and design

- **The protocol shapes the product.** In a normal app you design the ideal UX and the backend follows. In a Bitcoin and Nostr marketplace, identity, payments, and data all carry protocol constraints, and good UX means designing within them rather than around them.
- **Friction is sometimes a feature.** The reflex in e-commerce is to remove all friction. But a small amount of intentional friction, in onboarding and listing, filters out low-quality and spam users and protects the trust that a marketplace runs on. The real skill is deciding where to be frictionless (browsing, buying) and where to keep friction (identity, listing, trust).
- **Design and engineering are one loop, not two stages.** Being asked to implement my own designs taught me more about why interfaces are built the way they are, what is cheap and what is expensive, than pure mockup work ever could.

## What I plan to finish before the final evaluation

The priority for the second half, agreed with my maintainer, is to refine the designs and build the circular economy: the UX that pulls a buyer back into the loop as a seller so value keeps circulating inside Shopstr.

By the final evaluation there will be:

- Refined, high-fidelity designs for the core marketplace and the circular-economy flows.
- Documentation that lets the maintainer port the work into the real product.
- A working frontend implementation of the core flows, opened as PRs, to the extent I can complete it.

The design and documentation are the guaranteed deliverable. The frontend implementation is a strong plus that my maintainer and I have agreed on, and I am pushing to get as far into it as I can.

## Links to my work

- Coded prototype / frontend: *(add link)*
- Design system and tokens: *(add link)*
- Information architecture and app map: *(add link)*
- Wireframes and design explorations: *(add link)*
- Research notes and feature inventory: *(add link)*

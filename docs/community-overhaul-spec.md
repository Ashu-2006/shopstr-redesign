# Communities: diagnosis and overhaul spec

Status: proposed, 2026-08-13. Supersedes the current `/communities` and
`/communities/[slug]` pages. Read with `docs/app-map.md`.

---

## 1. What is actually wrong

Not a styling problem. The feature has no mechanism, so there is nothing for a
design to express.

### 1.1 A community is a category page wearing a costume

`pages/communities/[slug].tsx:25` and `pages/c/[category].tsx:24` call the same
hook with the same argument:

```ts
useCategoryListings(comm.category)   // community page
useCategoryListings(category)        // category page
```

Both then render the same `ListCard` grid. `/communities/riso` and
`/c/art-print` are the same query with a different banner. Everything that makes
a community a community (who is in it, what they said, what a moderator chose to
surface) is absent.

### 1.2 There is no membership

`const [joined, setJoined] = useState(false)` (`[slug].tsx:26`). Joining is
component-local state: it evaporates on navigation, nothing reads it, and no
surface anywhere changes because you joined. The primary CTO on the page, the
full-width purple **Join community** button, is decorative.

Compare `favs` and `follows`, which are real session state in
`data/store.tsx:103-106`. Membership was never given the same treatment.

### 1.3 The counts are strings

```ts
members: "1,243", listings: "84", online: "37"   // data/mock/extras.ts
```

Pre-formatted strings cannot be computed, compared, sorted, or incremented. The
data model is admitting these are decorative labels, not state. "37 online" is
the clearest tell: a marketplace has no presence system, so the number is
invented, and it is given equal visual weight to the two facts that matter.

### 1.4 Listings cannot belong to a community

`ProductData` in `data/types.ts` has no community field. A listing can never say
"posted in Riso & Print Club", and a community can never own a listing. The
relationship is inferred one-directionally from a category string, so a
community is a saved search that a person happens to be named next to.

### 1.5 Dead ends and no reason to return

- **Start a community** links to `/communities`, the page you are already on
  (`communities.tsx:103`).
- The community occupies **1 of 5 bottom-nav slots**, the most expensive real
  estate in the app, and offers nothing that changes between visits.
- No community is reachable from a listing or a shop, which are the two places
  you would actually discover one.
- Pinned is `listings[0]` (`[slug].tsx:82`) — an array index dressed as a
  moderator decision.

### 1.6 The visit-frequency question, answered honestly

> Why is a person coming to a community page, and how often?

Today: **once, by accident, from the nav, and never again.** There is no new
information on a second visit, nothing addressed to them, nothing they can do
that they cannot do better on the category page (which has real filters).

---

## 2. What upstream actually ships (the target)

The real Shopstr (`D:\Coding\shopstr`, upstream `shopstr-eng/shopstr`) has a
complete NIP-72 moderated community. The mock is not a simplification of it;
it is unrelated to it. Key facts to design against:

| Concern | Reality upstream |
|---|---|
| Community definition | kind **34550**, addressed `34550:<pubkey>:<d>` |
| Posts | kind **1111** (NIP-22 comment), scoped by `A`/`a` tag to the community |
| Approval | kind **4550** published by a moderator, referencing the post |
| Retract | kind **5** deletion referencing the approval |
| Roles | `moderators: string[]` from `p` tags; owner always included |
| Gate | Posts are **requests** until a moderator approves; there is a real pending queue |
| Discovery scope | relay filter `{kinds:[34550], "#t":["shopstr"]}` |
| Listings ↔ community | **no link exists**, confirmed across the whole repo |
| Community ↔ merchant | a community is associated with a **merchant pubkey**; storefronts get an optional Community tab (`storefront.showCommunityPage`) |

Two decisions follow directly:

1. **The unit of a community is a post awaiting or holding approval, not a
   listing.** Approval is the entire mechanism. A design with no approval state
   is not a NIP-72 community.
2. **Listings are not owned by communities.** Since no link exists upstream, a
   community must earn its feed from *posts about* items (which can quote a
   listing), not from a category query pretending to be curation.

---

## 3. Jobs to be done

Ordered by frequency, which is what should drive the layout.

| # | Job | Frequency | Today |
|---|---|---|---|
| J1 | "What's new from my people since I last looked?" | daily/weekly | impossible |
| J2 | "Is this thing legit / worth the sats?" (ask before buying) | per purchase | impossible |
| J3 | "Show the thing I just made/found to people who care" | weekly | impossible |
| J4 | (Moderator) "Clear the queue, keep the place good" | daily | impossible |
| J5 | "Find a community worth joining" | **once** | the whole current design |
| J6 | "Start a community" | once, rare | broken link |

The current design spends its entire surface on **J5**, the one job a user does
exactly once, and offers nothing for J1-J4, the jobs that generate return
visits. That inversion is the architectural failure.

---

## 4. Target architecture

### 4.1 Routes

```
/communities                     Your communities + digest, not a directory
/communities/discover            The directory (J5), demoted out of the default
/communities/[slug]              Community home: post feed, gated by approval
/communities/[slug]/members      Roster (moderators first)
/communities/[slug]/queue        Moderator-only pending queue (J4)
/communities/new                 Create (fixes the dead link)
```

`/communities` stops being a directory. Signed-in with memberships, it is a
**digest**: new approved posts across your communities, your pending requests,
and (if you moderate) your queue count. Empty state falls back to discover.

### 4.2 Data model

```ts
// data/types.ts
export interface Community {
  slug: string;            // the NIP-72 `d` identifier
  name: string;
  about: string;
  image?: string;
  ownerPubkey: string;
  moderatorPubkeys: string[];   // owner always included
  tone: AccentTone;
  icon: string;                 // Phosphor name
  memberCount: number;          // NUMBER. computed, sortable
  postCount: number;
  /** Topical hint for discovery only. Does NOT define the feed. */
  topics: string[];
}

export interface CommunityPost {
  id: string;
  communitySlug: string;
  authorPubkey: string;
  text: string;
  at: number;                   // unix seconds
  /** Mirrors NIP-72: a post is a request until a moderator approves it. */
  status: "approved" | "pending";
  approvedByPubkey?: string;
  /** A post may quote a listing. This is the honest listing relationship. */
  productId?: string;
  kind: "show" | "ask" | "sale";   // show-and-tell / question / heads-up
  replyCount: number;
  parentId?: string;               // one level of threading, as upstream
}
```

Session state gains real membership, alongside `favs`/`follows`:

```ts
joinedCommunities: Set<string>;
toggleJoin: (slug: string) => void;
/** Slugs the current user moderates. Drives the queue + approve affordances. */
moderatorOf: Set<string>;
```

Hooks: `useCommunities`, `useCommunity(slug)`, `useCommunityPosts(slug)`,
`usePendingPosts(slug)`, `useCommunityDigest()`, `useCommunityMembers(slug)`.

### 4.3 Page anatomy: `/communities/[slug]`

Ordered by job frequency, not by vanity.

1. **Identity bar** (compact, not a 130px stock photo): icon tile in the
   community tone, name, `N members · N posts today`, and a **Join/Joined**
   control wired to real state. Moderators get a **Queue (3)** chip here.
2. **Composer, gated and honest.** For members: a real input with the three
   post kinds (Show / Ask / Sale) and an "attach a listing" affordance. Under
   it, one line of truth: *"Posts are reviewed by @ekko before they appear."*
   Non-members see the composer disabled with **Join to post**.
3. **Your pending requests**, if any. The single biggest omission today: if
   approval exists, a member must be able to see their own post waiting. A
   pending card reads `Pending approval · sent 2h ago`.
4. **The feed: posts, not a product grid.** Each post is authored, timestamped,
   typed by kind, and may embed a listing card. This is what differs between
   visits, so it gets the most space.
5. **Rail at lg+**: about, moderators (with avatars), rules, and a
   *Listings from members* rail — the category query demoted to where it
   belongs, as one module, clearly labeled as members' listings rather than
   masquerading as curation.

### 4.4 Page anatomy: `/communities` (the digest)

- **Header**: "Your communities", with a real unread count.
- **New in your communities**: the merged approved-post feed (J1). This is the
  reason to return.
- **Awaiting approval**: your own pending posts across communities (J3 follow-through).
- **Your queue**, moderators only: count per community, links to the queue (J4).
- **Rail/section**: your joined communities as compact rows with fresh-post counts.
- **Bottom**: "Find more communities" → `/communities/discover`.
- **Empty (no memberships)**: the discover directory inline, with the current
  bento tiles reused but earning their keep (each tile shows *this week's*
  activity, not a static member count).

### 4.5 Moderator queue: `/communities/[slug]/queue`

The role that upstream implements and the mock ignores entirely. Rows of pending
posts with **Approve** / **Decline**, author trust signals (rating, sales),
and a preview of the quoted listing. Approve/decline is optimistic with a toast.
Reduces to a designed empty ("Queue clear") which is a *reward*, not a void.

### 4.6 Entry points (fixing discovery)

- **Listing page**: if a post in a community quotes this listing, show
  *"Discussed in Riso & Print Club"* → deep link. This is the J2 path and the
  only place a community can prove its value before a purchase.
- **Shop page**: a merchant's community as a tab/card, matching upstream's
  `showCommunityPage`.
- **Post-purchase** (`/paid`): "Show it off in Clay Heads" → J3, which closes
  the circular-economy loop the project cares about.

---

## 5. What gets deleted

- The 130px stock Unsplash banner (same photo for every community).
- The **Online** stat. No presence system exists; it is invented data.
- Stat tiles as three equal boxes. Two real numbers become one inline line.
- `pinned = listings[0]`.
- The full-width purple Join button as the page's visual climax.
- Category-query-as-community-feed, as the page's primary content.

## 6. Risks / calls made

- **Scope.** This is the largest single surface in the redesign. The pages are
  ~266 lines today; the target is a real feed with roles and states. Sequenced
  in 4 slices below so it lands incrementally.
- **Mock-only, no relays.** Approval is simulated in session state. The
  `{data, isLoading}` seam holds so porting rewrites hook bodies only.
- **Not a social network.** Every post type stays anchored to commerce
  (Show / Ask / Sale, optional listing quote). This is a marketplace feature,
  not a feed to scroll for its own sake.
- **Nav slot justified.** After the overhaul the nav destination is a digest
  with an unread count, which is a defensible use of 1 of 5 slots. If we ever
  decide it is not, the fallback is to move it under Browse and give the slot
  to Orders.

## 7. Build order

1. **Data + state**: types, mock posts across 5 communities with mixed
   approval states, hooks, `joinedCommunities` / `moderatorOf` in the store.
2. **`/communities/[slug]`**: identity bar, gated composer, pending, post feed,
   desktop rail.
3. **`/communities` digest** + `/communities/discover` split, real empties.
4. **`/communities/[slug]/queue`** + `/communities/new`, plus the three entry
   points (listing, shop, `/paid`).

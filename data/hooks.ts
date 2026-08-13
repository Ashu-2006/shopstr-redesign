/* =============================================================================
   The ONLY data boundary in the app.
   Components and pages import from here and nowhere else — never from mock/,
   never from a relay/context/fetch. Every hook returns { data, isLoading } so
   that on port these ~6 bodies get rewritten to read React Context (nostr /
   cashu) and components stay untouched.

   During the design phase the data is synchronous mock, but isLoading is REAL:
   each data family simulates one first-load per session (useSimulatedLoad
   below) so loading states are visible, reviewable, and testable. On port,
   only these hook bodies change; the { data, isLoading } seam stays.
   ========================================================================== */

import { useEffect, useMemo, useState } from "react";
import type {
  ProductData,
  Profile,
  SellerReviews,
  Review,
  ReviewDimension,
  CartItem,
  ChatThread,
  ChatMessage,
  AsyncResult,
} from "@/data/types";
import { REVIEW_DIMENSIONS } from "@/data/types";
import { MOCK_LISTINGS } from "@/data/mock/listings";
import {
  MOCK_PROFILES,
  MOCK_REVIEWS,
  MOCK_CHATS,
} from "@/data/mock/profiles";
import { MOCK_THREAD_MESSAGES } from "@/data/mock/messages";
import {
  MOCK_COMMUNITIES,
  MOCK_COMMUNITY_POSTS,
  MOCK_ORDERS,
  MOCK_TXNS,
  CLAIMABLE,
  type Community,
  type CommunityPost,
  type Order,
  type WalletTx,
} from "@/data/mock/extras";
import { useCartStore, useSession, type OwnPost } from "@/data/store";

/* Re-export the mutable client-state hooks so the whole app imports state and
   data from this one module (the data boundary), never from store/ or mock/. */
export { useCartStore, useSession, useCheckout } from "@/data/store";

/* ---------------------------------------------------------- SIMULATED LOAD --
   One simulated first-load per DATA FAMILY per session (module-level Set, so
   it survives client navigation and resets on refresh). Rules encoded here:
   - Never re-skeleton data already shown: revisits and same-family routes
     resolve instantly (e.g. marketplace -> listing detail is one family).
   - No ?state= dev override; pages derive display state from isLoading only.
   - SSR renders isLoading=true (Set is empty on the server), which matches
     the client's first paint, so there is no hydration mismatch. */

const loadedFamilies = new Set<string>();

/** Deterministic per-key jitter in [500, 900) ms; no Math.random so SSR and
    client agree and states are stable for screenshots. */
function simDelay(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return 500 + (Math.abs(h) % 400);
}

function useSimulatedLoad(key: string): boolean {
  const [state, setState] = useState(() => ({
    key,
    loading: !loadedFamilies.has(key),
  }));
  // Render-time reset when the key changes (React's derive-from-props pattern).
  if (state.key !== key) {
    setState({ key, loading: !loadedFamilies.has(key) });
  }
  useEffect(() => {
    if (loadedFamilies.has(key)) return;
    const t = setTimeout(() => {
      loadedFamilies.add(key);
      setState((s) => (s.key === key ? { key, loading: false } : s));
    }, simDelay(key));
    return () => clearTimeout(t);
  }, [key]);
  return state.loading && !loadedFamilies.has(key);
}

/* ------------------------------------------------------------------- BOOT --
   The app-boot gate. Distinct from per-surface loading: this covers the one
   moment before ANY data exists, where there is no card geometry to skeleton.
   It resolves on a real signal (the first data family landing), never a fixed
   timer, with a floor so the animation cannot flash, and a ceiling so a stalled
   family can never trap the user on the splash.
   Once booted it stays booted for the session, so client navigation never
   replays it (same rule as useSimulatedLoad). */

const BOOT_FLOOR_MS = 900; // one full sticker orbit; below this it flashes
const BOOT_CEILING_MS = 8000; // hard release: a wedged load can't trap the user

let hasBooted = false;

export function useAppBoot(): { booting: boolean } {
  const [booting, setBooting] = useState(!hasBooted);

  useEffect(() => {
    if (hasBooted) return;
    const started = Date.now();
    let done = false;
    const release = () => {
      if (done) return;
      done = true;
      hasBooted = true;
      setBooting(false);
    };
    // Hold until the first data family has actually landed AND the floor has
    // passed, so the splash tracks the real load instead of a guess. The
    // ceiling is a safety net for a wedged family, not the normal path: on a
    // healthy load the poll always wins (families land in 500-900ms).
    const poll = setInterval(() => {
      const elapsed = Date.now() - started;
      if (loadedFamilies.size > 0 && elapsed >= BOOT_FLOOR_MS) {
        clearInterval(poll);
        release();
      }
    }, 80);
    const ceiling = setTimeout(() => {
      clearInterval(poll);
      release();
    }, BOOT_CEILING_MS);
    return () => {
      clearInterval(poll);
      clearTimeout(ceiling);
    };
  }, []);

  return { booting };
}

/** All active listings. */
export function useListings(): AsyncResult<ProductData[]> {
  const isLoading = useSimulatedLoad("listings");
  const data = useMemo(() => MOCK_LISTINGS, []);
  return { data: isLoading ? [] : data, isLoading };
}

/** A single listing by id (null if not found). */
export function useListing(id: string): AsyncResult<ProductData | null> {
  const isLoading = useSimulatedLoad("listings");
  const data = useMemo(
    () => MOCK_LISTINGS.find((l) => l.id === id) ?? null,
    [id]
  );
  return { data: isLoading ? null : data, isLoading };
}

/**
 * A seller's reviews. The average is always DERIVED, never pre-stored.
 * See weightedScore() for the thumb-weighted composition upstream uses.
 */
export function useReviews(pubkey: string): AsyncResult<SellerReviews> {
  const isLoading = useSimulatedLoad(`reviews:${pubkey}`);
  const empty = useMemo(() => ({ pubkey, reviews: [] }), [pubkey]);
  const data = useMemo(() => MOCK_REVIEWS[pubkey] ?? { pubkey, reviews: [] }, [pubkey]);
  return { data: isLoading ? empty : data, isLoading };
}

/** A profile by pubkey (null if unknown). */
export function useProfile(pubkey: string): AsyncResult<Profile | null> {
  const isLoading = useSimulatedLoad("profiles");
  const data = useMemo(() => MOCK_PROFILES[pubkey] ?? null, [pubkey]);
  return { data: isLoading ? null : data, isLoading };
}

/** The current user's cart — backed by the live CartProvider store. */
export function useCart(): AsyncResult<CartItem[]> {
  const { items } = useCartStore();
  return { data: items, isLoading: false };
}

/** The current user's DM threads, newest first. */
export function useChats(): AsyncResult<ChatThread[]> {
  const isLoading = useSimulatedLoad("chats");
  const data = useMemo(
    () => [...MOCK_CHATS].sort((a, b) => b.lastMessageAt - a.lastMessageAt),
    []
  );
  return { data: isLoading ? [] : data, isLoading };
}

/** One DM thread's summary, by counterparty handle. */
export function useThreadFor(handle: string): AsyncResult<ChatThread | null> {
  const isLoading = useSimulatedLoad("chats");
  const data = useMemo(
    () => MOCK_CHATS.find((t) => t.counterpartyHandle === handle) ?? null,
    [handle]
  );
  return { data: isLoading ? null : data, isLoading };
}

/** The message history of one DM thread, oldest first. */
export function useThreadMessages(handle: string): AsyncResult<ChatMessage[]> {
  const isLoading = useSimulatedLoad("chats");
  const data = useMemo(() => MOCK_THREAD_MESSAGES[handle] ?? [], [handle]);
  return { data: isLoading ? [] : data, isLoading };
}

/** All listings by a seller (by pubkey). */
export function useSellerListings(pubkey: string): AsyncResult<ProductData[]> {
  const isLoading = useSimulatedLoad("listings");
  const data = useMemo(
    () => MOCK_LISTINGS.filter((l) => l.pubkey === pubkey),
    [pubkey]
  );
  return { data: isLoading ? [] : data, isLoading };
}

/** Listings in a category (matches any category tag). Routes carry lowercase
    slugs ("ceramics") while listings store display-cased names ("Ceramics"),
    so the match is case-insensitive. */
export function useCategoryListings(category: string): AsyncResult<ProductData[]> {
  const isLoading = useSimulatedLoad("listings");
  const data = useMemo(() => {
    const slug = category.toLowerCase();
    return MOCK_LISTINGS.filter((l) => l.categories.some((c) => c.toLowerCase() === slug));
  }, [category]);
  return { data: isLoading ? [] : data, isLoading };
}

/** NIP-72 communities. */
export function useCommunities(): AsyncResult<Community[]> {
  const isLoading = useSimulatedLoad("communities");
  return { data: isLoading ? [] : MOCK_COMMUNITIES, isLoading };
}

export function useCommunity(slug: string): AsyncResult<Community | null> {
  const isLoading = useSimulatedLoad("communities");
  const data = useMemo(
    () => MOCK_COMMUNITIES.find((c) => c.slug === slug) ?? null,
    [slug]
  );
  return { data: isLoading ? null : data, isLoading };
}

/* ------------------------------------------------------- COMMUNITY: NIP-72 --
   The mechanism, not decoration. A post is a REQUEST until a moderator
   approves it (upstream: kind 1111 gated by kind 4550). These hooks derive
   every community surface from that one rule, and fold in the session's local
   moderation verdicts + own submissions so the flow is reviewable end to end.
   -------------------------------------------------------------------------- */

/** The signed-in user. Single place to change when auth lands. */
export const ME = "ekko";

/**
 * Monotonic id source for locally-composed posts. Module-level (not React
 * state) so ids never repeat within a session even across remounts. Upstream
 * this is the signed event id.
 */
let postSeq = 0;
export function nextPostId(): string {
  postSeq += 1;
  return String(postSeq);
}

/** Full moderator list for a community: owner first, then named moderators. */
export function moderatorsOf(c: Community): string[] {
  return [c.curator, ...c.moderators.filter((m) => m !== c.curator)];
}

/** Does the current user moderate this community? */
export function useIsModerator(slug: string): boolean {
  const comm = MOCK_COMMUNITIES.find((c) => c.slug === slug);
  return !!comm && moderatorsOf(comm).includes(ME);
}

/**
 * All posts for a community, with session state folded in: locally declined
 * posts disappear, locally approved ones flip to approved, and the user's own
 * submissions from this session are appended as pending.
 */
function resolvePosts(
  slug: string,
  moderated: Map<string, "approved" | "declined">,
  ownPosts: OwnPost[]
): CommunityPost[] {
  const own: CommunityPost[] = ownPosts
    .filter((p) => p.communitySlug === slug)
    .map((p) => ({
      id: p.id,
      communitySlug: p.communitySlug,
      authorHandle: ME,
      kind: p.kind,
      text: p.text,
      at: p.at,
      // A moderator publishes their own approval, so their post is live at once.
      status: p.selfApproved ? ("approved" as const) : ("pending" as const),
      approvedBy: p.selfApproved ? ME : undefined,
      productId: p.productId,
      replyCount: 0,
    }));

  return [...MOCK_COMMUNITY_POSTS.filter((p) => p.communitySlug === slug), ...own]
    .filter((p) => moderated.get(p.id) !== "declined")
    .map((p) =>
      moderated.get(p.id) === "approved"
        ? { ...p, status: "approved" as const, approvedBy: ME }
        : p
    )
    .sort((a, b) => b.at - a.at);
}

/** Approved posts only — what a member sees in the feed. */
export function useCommunityPosts(slug: string): AsyncResult<CommunityPost[]> {
  const isLoading = useSimulatedLoad("communities");
  const { moderated, ownPosts } = useSession();
  const data = useMemo(
    () => resolvePosts(slug, moderated, ownPosts).filter((p) => p.status === "approved"),
    [slug, moderated, ownPosts]
  );
  return { data: isLoading ? [] : data, isLoading };
}

/**
 * The moderator queue: other people's posts awaiting a verdict. Your own
 * requests are excluded — they surface to you as "waiting on approval" instead,
 * so a moderator never sees their own post twice or approves themselves.
 */
export function usePendingPosts(slug: string): AsyncResult<CommunityPost[]> {
  const isLoading = useSimulatedLoad("communities");
  const { moderated, ownPosts } = useSession();
  const data = useMemo(
    () =>
      resolvePosts(slug, moderated, ownPosts).filter(
        (p) => p.status === "pending" && p.authorHandle !== ME
      ),
    [slug, moderated, ownPosts]
  );
  return { data: isLoading ? [] : data, isLoading };
}

/** The current user's own posts still awaiting approval, in one community. */
export function useMyPendingPosts(slug: string): CommunityPost[] {
  const { moderated, ownPosts } = useSession();
  return useMemo(
    () =>
      resolvePosts(slug, moderated, ownPosts).filter(
        (p) => p.status === "pending" && p.authorHandle === ME
      ),
    [slug, moderated, ownPosts]
  );
}

export interface CommunityDigestEntry {
  community: Community;
  /** Approved posts, newest first. */
  posts: CommunityPost[];
  /** Pending posts awaiting THIS user's verdict (moderators only). */
  queueCount: number;
  /** The user's own posts awaiting approval here. */
  myPendingCount: number;
}

/**
 * The /communities landing: what's new across the communities you joined,
 * plus your queue if you moderate. This is the reason to return, so it is
 * derived rather than hand-authored.
 */
export function useCommunityDigest(): AsyncResult<CommunityDigestEntry[]> {
  const isLoading = useSimulatedLoad("communities");
  const { joinedCommunities, moderated, ownPosts } = useSession();

  const data = useMemo(
    () =>
      MOCK_COMMUNITIES.filter((c) => joinedCommunities.has(c.slug)).map((community) => {
        const all = resolvePosts(community.slug, moderated, ownPosts);
        const isMod = moderatorsOf(community).includes(ME);
        return {
          community,
          posts: all.filter((p) => p.status === "approved"),
          queueCount: isMod ? all.filter((p) => p.status === "pending").length : 0,
          myPendingCount: all.filter(
            (p) => p.status === "pending" && p.authorHandle === ME
          ).length,
        };
      }),
    [joinedCommunities, moderated, ownPosts]
  );

  return { data: isLoading ? [] : data, isLoading };
}

/**
 * Communities where an approved post quotes this listing. Powers the
 * "Discussed in ..." entry point on the listing page (the ask-before-you-buy
 * path, and the only place a community proves its value pre-purchase).
 */
export function useCommunitiesForListing(
  productId: string
): { community: Community; postCount: number }[] {
  const { moderated, ownPosts } = useSession();
  return useMemo(() => {
    if (!productId) return [];
    return MOCK_COMMUNITIES.map((community) => {
      const postCount = resolvePosts(community.slug, moderated, ownPosts).filter(
        (p) => p.status === "approved" && p.productId === productId
      ).length;
      return { community, postCount };
    }).filter((e) => e.postCount > 0);
  }, [productId, moderated, ownPosts]);
}

/** The community a merchant owns, for the shop page tab (upstream parity). */
export function communityForCurator(handle: string): Community | null {
  return MOCK_COMMUNITIES.find((c) => c.curator === handle) ?? null;
}

/**
 * The community best matched to a listing's category, for the post-purchase
 * "show it off" prompt. Topic match only: a community never owns a listing.
 */
export function communityForListing(productId: string): Community | null {
  const product = MOCK_LISTINGS.find((l) => l.id === productId);
  if (!product) return null;
  return (
    MOCK_COMMUNITIES.find((c) =>
      c.topics.some((t) =>
        product.categories.some((cat) => cat.toLowerCase() === t.toLowerCase())
      )
    ) ?? null
  );
}

/** The current user's orders. */
export function useOrders(): AsyncResult<Order[]> {
  const isLoading = useSimulatedLoad("orders");
  return { data: isLoading ? [] : MOCK_ORDERS, isLoading };
}

export function useOrder(id: string): AsyncResult<Order | null> {
  const isLoading = useSimulatedLoad("orders");
  const data = useMemo(() => MOCK_ORDERS.find((o) => o.id === id) ?? null, [id]);
  return { data: isLoading ? null : data, isLoading };
}

/** Wallet transaction history. */
export function useTxns(): AsyncResult<WalletTx[]> {
  const isLoading = useSimulatedLoad("wallet");
  return { data: isLoading ? [] : MOCK_TXNS, isLoading };
}

/** The pending claimable sale (seller-to-buyer bridge), null when none. */
export function useClaimable(): AsyncResult<typeof CLAIMABLE | null> {
  const isLoading = useSimulatedLoad("wallet");
  return { data: isLoading ? null : CLAIMABLE, isLoading };
}

export interface TopSeller {
  profile: Profile;
  avg: number;
  count: number;
}

/** Top sellers by sats moved, with derived rating. For the home rail. */
export function useTopSellers(limit = 4): AsyncResult<TopSeller[]> {
  const isLoading = useSimulatedLoad("profiles");
  const data = useMemo(() => {
    return Object.values(MOCK_PROFILES)
      .slice()
      .sort((a, b) => (b.totalSales ?? 0) - (a.totalSales ?? 0))
      .slice(0, limit)
      .map((profile) => {
        const sellerReviews = MOCK_REVIEWS[profile.pubkey]?.reviews ?? [];
        return {
          profile,
          avg: averageRating(sellerReviews),
          count: sellerReviews.length,
        };
      });
  }, [limit]);
  return { data: isLoading ? [] : data, isLoading };
}

/* ---- Small derivations consumers commonly need (pure, not hooks) ---- */

/* ------------------------------------------------------- REVIEW SCORING --
   Ported 1:1 from upstream (utils/parsers/review-parser-functions.ts). A review
   is NOT a star rating: the mandatory binary thumb is worth 50% of the score,
   and whatever named dimensions the reviewer supplied split the other 50%
   equally. A thumbs-down therefore caps at 50% no matter how good the rest is.
   -------------------------------------------------------------------------- */

/** One review's weighted score, in 0..1. */
export function weightedScore(review: Review): number {
  const thumbScore = (review.thumb ? 1 : 0) * 0.5;
  const dims = Object.values(review.dimensions);
  if (dims.length === 0) return thumbScore;
  const each = 0.5 / dims.length;
  return thumbScore + dims.reduce((t, ok) => t + (ok ? each : 0), 0);
}

/** Mean weighted score across reviews, in 0..1. 0 when there are none. */
export function averageWeighted(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  return reviews.reduce((t, r) => t + weightedScore(r), 0) / reviews.length;
}

/**
 * The 0..5 number the UI shows. The weighted 0..1 score is the source of truth;
 * this is purely a display projection so the existing Stars component and every
 * card keep working. Never store or compare this.
 */
export function averageRating(reviews: Review[]): number {
  return averageWeighted(reviews) * 5;
}

/** Per-dimension approval rate, for the seller page breakdown. */
export function dimensionBreakdown(
  reviews: Review[]
): { dimension: ReviewDimension; pct: number; count: number }[] {
  return REVIEW_DIMENSIONS.map((dimension) => {
    const rated = reviews.filter((r) => r.dimensions[dimension] !== undefined);
    const good = rated.filter((r) => r.dimensions[dimension]).length;
    return {
      dimension,
      pct: rated.length === 0 ? 0 : Math.round((good / rated.length) * 100),
      count: rated.length,
    };
  }).filter((d) => d.count > 0);
}

/** Share of reviews that were a thumbs-up, as a percentage. */
export function thumbRate(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  return Math.round((reviews.filter((r) => r.thumb).length / reviews.length) * 100);
}

/** Look up a profile by handle (slug used in routes). */
/** Look up a profile by pubkey (synchronous; for rendering review authors). */
export function profileByPubkey(pubkey: string): Profile | null {
  return MOCK_PROFILES[pubkey] ?? null;
}

export function profileByHandle(handle: string): Profile | null {
  return (
    Object.values(MOCK_PROFILES).find((p) => p.handle === handle) ?? null
  );
}

/** Derived rating for a seller (pure helper for cards that take rating as a prop). */
export function ratingForPubkey(pubkey: string): { avg: number; count: number } {
  const reviews = MOCK_REVIEWS[pubkey]?.reviews ?? [];
  return { avg: averageRating(reviews), count: reviews.length };
}

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
  CartItem,
  ChatThread,
  AsyncResult,
} from "@/data/types";
import { MOCK_LISTINGS } from "@/data/mock/listings";
import {
  MOCK_PROFILES,
  MOCK_REVIEWS,
  MOCK_CHATS,
} from "@/data/mock/profiles";
import {
  MOCK_COMMUNITIES,
  MOCK_ORDERS,
  MOCK_TXNS,
  CLAIMABLE,
  type Community,
  type Order,
  type WalletTx,
} from "@/data/mock/extras";
import { useCartStore } from "@/data/store";

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
 * A seller's reviews. Consumers derive rating = avg(scores) and
 * count = scores.length; we never pre-store the average.
 */
export function useReviews(pubkey: string): AsyncResult<SellerReviews> {
  const isLoading = useSimulatedLoad(`reviews:${pubkey}`);
  const data = useMemo(
    () => MOCK_REVIEWS[pubkey] ?? { pubkey, scores: [] },
    [pubkey]
  );
  return { data: isLoading ? { pubkey, scores: [] } : data, isLoading };
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

/** The current user's DM threads. */
export function useChats(): AsyncResult<ChatThread[]> {
  const isLoading = useSimulatedLoad("chats");
  const data = useMemo(() => MOCK_CHATS, []);
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
        const scores = MOCK_REVIEWS[profile.pubkey]?.scores ?? [];
        return { profile, avg: averageRating(scores), count: scores.length };
      });
  }, [limit]);
  return { data: isLoading ? [] : data, isLoading };
}

/* ---- Small derivations consumers commonly need (pure, not hooks) ---- */

/** Average rating from a scores array, or 0 when there are none. */
export function averageRating(scores: number[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/** Look up a profile by handle (slug used in routes). */
export function profileByHandle(handle: string): Profile | null {
  return (
    Object.values(MOCK_PROFILES).find((p) => p.handle === handle) ?? null
  );
}

/** Derived rating for a seller (pure helper for cards that take rating as a prop). */
export function ratingForPubkey(pubkey: string): { avg: number; count: number } {
  const scores = MOCK_REVIEWS[pubkey]?.scores ?? [];
  return { avg: averageRating(scores), count: scores.length };
}

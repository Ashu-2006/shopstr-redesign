/* =============================================================================
   The ONLY data boundary in the app.
   Components and pages import from here and nowhere else — never from mock/,
   never from a relay/context/fetch. Every hook returns { data, isLoading } so
   that on port these ~6 bodies get rewritten to read React Context (nostr /
   cashu) and components stay untouched.

   During the design phase these are synchronous and isLoading is always false.
   The async-looking signature is intentional — it's the seam.
   ========================================================================== */

import { useMemo } from "react";
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

/** All active listings. */
export function useListings(): AsyncResult<ProductData[]> {
  const data = useMemo(() => MOCK_LISTINGS, []);
  return { data, isLoading: false };
}

/** A single listing by id (null if not found). */
export function useListing(id: string): AsyncResult<ProductData | null> {
  const data = useMemo(
    () => MOCK_LISTINGS.find((l) => l.id === id) ?? null,
    [id]
  );
  return { data, isLoading: false };
}

/**
 * A seller's reviews. Consumers derive rating = avg(scores) and
 * count = scores.length; we never pre-store the average.
 */
export function useReviews(pubkey: string): AsyncResult<SellerReviews> {
  const data = useMemo(
    () => MOCK_REVIEWS[pubkey] ?? { pubkey, scores: [] },
    [pubkey]
  );
  return { data, isLoading: false };
}

/** A profile by pubkey (null if unknown). */
export function useProfile(pubkey: string): AsyncResult<Profile | null> {
  const data = useMemo(() => MOCK_PROFILES[pubkey] ?? null, [pubkey]);
  return { data, isLoading: false };
}

/** The current user's cart — backed by the live CartProvider store. */
export function useCart(): AsyncResult<CartItem[]> {
  const { items } = useCartStore();
  return { data: items, isLoading: false };
}

/** The current user's DM threads. */
export function useChats(): AsyncResult<ChatThread[]> {
  const data = useMemo(() => MOCK_CHATS, []);
  return { data, isLoading: false };
}

/** All listings by a seller (by pubkey). */
export function useSellerListings(pubkey: string): AsyncResult<ProductData[]> {
  const data = useMemo(
    () => MOCK_LISTINGS.filter((l) => l.pubkey === pubkey),
    [pubkey]
  );
  return { data, isLoading: false };
}

/** Listings in a category (matches any category tag). */
export function useCategoryListings(category: string): AsyncResult<ProductData[]> {
  const data = useMemo(
    () => MOCK_LISTINGS.filter((l) => l.categories.includes(category)),
    [category]
  );
  return { data, isLoading: false };
}

/** NIP-72 communities. */
export function useCommunities(): AsyncResult<Community[]> {
  return { data: MOCK_COMMUNITIES, isLoading: false };
}

export function useCommunity(slug: string): AsyncResult<Community | null> {
  const data = useMemo(
    () => MOCK_COMMUNITIES.find((c) => c.slug === slug) ?? null,
    [slug]
  );
  return { data, isLoading: false };
}

/** The current user's orders. */
export function useOrders(): AsyncResult<Order[]> {
  return { data: MOCK_ORDERS, isLoading: false };
}

export function useOrder(id: string): AsyncResult<Order | null> {
  const data = useMemo(() => MOCK_ORDERS.find((o) => o.id === id) ?? null, [id]);
  return { data, isLoading: false };
}

/** Wallet transaction history. */
export function useTxns(): AsyncResult<WalletTx[]> {
  return { data: MOCK_TXNS, isLoading: false };
}

/** The pending claimable sale (seller-to-buyer bridge), null when none. */
export function useClaimable(): AsyncResult<typeof CLAIMABLE | null> {
  return { data: CLAIMABLE, isLoading: false };
}

export interface TopSeller {
  profile: Profile;
  avg: number;
  count: number;
}

/** Top sellers by sats moved, with derived rating. For the home rail. */
export function useTopSellers(limit = 4): AsyncResult<TopSeller[]> {
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
  return { data, isLoading: false };
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

/* =============================================================================
   Client-state layer — the mutable counterpart to the read-only hooks.

   The hooks in `data/hooks.ts` are the READ seam (they'll later read nostr/cashu).
   This file owns the MUTABLE app state that lives only in the browser during a
   session: the cart, the session (favourites / follows / payout / wallet), and
   the ephemeral checkout draft. On port these providers map cleanly onto the
   real app's React Context tree.

   Money is always integer sats. Identity is pubkey/handle based.
   ========================================================================== */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "@/data/types";
import { MOCK_LISTINGS } from "@/data/mock/listings";

/* ------------------------------------------------------------------ CART -- */

interface CartApi {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (id: string, qty?: number, size?: string) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const CartCtx = createContext<CartApi | null>(null);

function findListing(id: string) {
  return MOCK_LISTINGS.find((l) => l.id === id) ?? null;
}

function CartProvider({ children }: { children: ReactNode }) {
  // Seed with a couple of items so the cart reads populated during design.
  const [items, setItems] = useState<CartItem[]>(() => [
    { product: MOCK_LISTINGS[0], quantity: 1 },
    { product: MOCK_LISTINGS[2], quantity: 2, size: "M" },
  ]);

  const add = useCallback((id: string, qty = 1, size?: string) => {
    const product = findListing(id);
    if (!product) return;
    setItems((prev) => {
      const ex = prev.find((c) => c.product.id === id && c.size === size);
      if (ex)
        return prev.map((c) =>
          c === ex ? { ...c, quantity: c.quantity + qty } : c
        );
      return [{ product, quantity: qty, size }, ...prev];
    });
  }, []);

  const inc = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((c) => (c.product.id === id ? { ...c, quantity: c.quantity + 1 } : c))
    );
  }, []);

  const dec = useCallback((id: string) => {
    setItems((prev) =>
      prev
        .map((c) => (c.product.id === id ? { ...c, quantity: c.quantity - 1 } : c))
        .filter((c) => c.quantity > 0)
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((c) => c.product.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartApi>(() => {
    const count = items.reduce((n, c) => n + c.quantity, 0);
    const subtotal = items.reduce((n, c) => n + c.product.price * c.quantity, 0);
    return { items, count, subtotal, add, inc, dec, remove, clear };
  }, [items, add, inc, dec, remove, clear]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCartStore(): CartApi {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCartStore must be used within AppProviders");
  return ctx;
}

/* --------------------------------------------------------------- SESSION -- */

/**
 * A post the user submitted this session. Lands pending like upstream, unless
 * the user moderates the community — a moderator's own post is self-approved
 * (upstream: they can publish the kind-4550 approval themselves).
 */
export interface OwnPost {
  id: string;
  communitySlug: string;
  kind: "show" | "ask" | "sale";
  text: string;
  at: number;
  productId?: string;
  /** Set when the author moderates this community. */
  selfApproved?: boolean;
}

interface SessionApi {
  signedIn: boolean;
  signIn: () => void;
  favs: Set<string>;
  toggleFav: (id: string) => void;
  follows: Set<string>;
  toggleFollow: (handle: string) => void;
  /** Community slugs the user has joined. Real state: gates posting. */
  joinedCommunities: Set<string>;
  toggleJoin: (slug: string) => void;
  /** Locally approved / declined post ids, so moderation is reviewable. */
  moderated: Map<string, "approved" | "declined">;
  moderatePost: (id: string, verdict: "approved" | "declined") => void;
  /** Posts the user submitted this session (they land pending). */
  ownPosts: OwnPost[];
  submitPost: (post: OwnPost) => void;
  /** Where a seller's sats land after a sale. Inverted default = stay in Shopstr. */
  payout: "shopstr" | "lightning";
  setPayout: (v: "shopstr" | "lightning") => void;
  /** Spendable in-app (Cashu) wallet balance, integer sats. */
  walletBalance: number;
}

const SessionCtx = createContext<SessionApi | null>(null);

function SessionProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [follows, setFollows] = useState<Set<string>>(new Set());
  const [payout, setPayout] = useState<"shopstr" | "lightning">("shopstr");
  // Seeded so the signed-in user has somewhere to return to on first run.
  const [joinedCommunities, setJoined] = useState<Set<string>>(
    () => new Set(["riso", "film", "ceramics"])
  );
  const [moderated, setModerated] = useState<Map<string, "approved" | "declined">>(
    () => new Map()
  );
  const [ownPosts, setOwnPosts] = useState<OwnPost[]>([]);

  const toggleFav = useCallback((id: string) => {
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleFollow = useCallback((handle: string) => {
    setFollows((prev) => {
      const next = new Set(prev);
      next.has(handle) ? next.delete(handle) : next.add(handle);
      return next;
    });
  }, []);

  const toggleJoin = useCallback((slug: string) => {
    setJoined((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }, []);

  const moderatePost = useCallback((id: string, verdict: "approved" | "declined") => {
    setModerated((prev) => new Map(prev).set(id, verdict));
  }, []);

  const submitPost = useCallback((post: OwnPost) => {
    setOwnPosts((prev) => [...prev, post]);
  }, []);

  const value = useMemo<SessionApi>(
    () => ({
      signedIn,
      signIn: () => setSignedIn(true),
      favs,
      toggleFav,
      follows,
      toggleFollow,
      joinedCommunities,
      toggleJoin,
      moderated,
      moderatePost,
      ownPosts,
      submitPost,
      payout,
      setPayout,
      walletBalance: 182400,
    }),
    [
      signedIn, favs, toggleFav, follows, toggleFollow,
      joinedCommunities, toggleJoin, moderated, moderatePost,
      ownPosts, submitPost, payout,
    ]
  );

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession(): SessionApi {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error("useSession must be used within AppProviders");
  return ctx;
}

/* -------------------------------------------------------------- CHECKOUT -- */

export interface CheckoutDraft {
  fulfilment: "ship" | "pickup";
  name: string;
  address: string;
  city: string;
  zip: string;
  /** Upstream requires state/province AND country on a shipping address. */
  state: string;
  country: string;
  /** Pickup only: which of the seller's declared collection points. */
  pickupLocation: string;
  /** Pickup only: how the seller reaches the buyer (upstream ContactFormData). */
  contact: string;
  contactType: "nostr" | "phone" | "signal";
  note: string;
  pay: "lightning" | "cashu";
}

interface CheckoutApi {
  draft: CheckoutDraft;
  set: <K extends keyof CheckoutDraft>(key: K, value: CheckoutDraft[K]) => void;
  reset: () => void;
}

const INITIAL_DRAFT: CheckoutDraft = {
  fulfilment: "ship",
  name: "Ekko R.",
  address: "Skalitzer Str. 12",
  city: "Berlin",
  zip: "10997",
  state: "Berlin",
  country: "Germany",
  pickupLocation: "",
  contact: "",
  contactType: "nostr",
  note: "",
  pay: "lightning",
};

const CheckoutCtx = createContext<CheckoutApi | null>(null);

function CheckoutProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<CheckoutDraft>(INITIAL_DRAFT);
  const set = useCallback<CheckoutApi["set"]>((key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);
  const reset = useCallback(() => setDraft(INITIAL_DRAFT), []);
  const value = useMemo<CheckoutApi>(() => ({ draft, set, reset }), [draft, set, reset]);
  return <CheckoutCtx.Provider value={value}>{children}</CheckoutCtx.Provider>;
}

export function useCheckout(): CheckoutApi {
  const ctx = useContext(CheckoutCtx);
  if (!ctx) throw new Error("useCheckout must be used within AppProviders");
  return ctx;
}

/* ------------------------------------------------------------ COMPOSITE -- */

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <CheckoutProvider>{children}</CheckoutProvider>
      </CartProvider>
    </SessionProvider>
  );
}

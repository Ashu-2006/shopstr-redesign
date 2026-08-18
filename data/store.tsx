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
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "@/data/types";
import { MOCK_LISTINGS } from "@/data/mock/listings";
import { satsFor } from "@/lib/money";

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
    // satsFor() converts a fiat-quoted listing; using product.price directly
    // would add a $85 listing to the cart as 85 sats.
    const subtotal = items.reduce((n, c) => n + (satsFor(c.product) ?? 0) * c.quantity, 0);
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
/** Mirrors OrderStatus in data/mock/extras. Kept local so the client-state
    layer never imports from mock/ (the data boundary owns that direction). */
type OrderStatusValue = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

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
  /** Order-status changes made this session, by order id. */
  orderStatus: Map<string, OrderStatusValue>;
  setOrderStatus: (id: string, status: OrderStatusValue) => void;
  /** Shipment details the seller captured when marking an order shipped.
      Separate from status so "shipped" can never exist without a tracking
      story — the upstream flow's one real modal, kept. */
  shipments: Map<string, { carrier: string; tracking: string }>;
  setShipment: (id: string, s: { carrier: string; tracking: string }) => void;
  /** Where a seller's sats land after a sale. Inverted default = stay in Shopstr. */
  payout: "shopstr" | "lightning";
  setPayout: (v: "shopstr" | "lightning") => void;

  /* ------------------------------------------------------------- WALLET -- */
  /** How the wallet was set up. `null` = not set up yet: /wallet shows the
      setup CTA instead of a balance, and buy-with-sats is not offered. */
  wallet: WalletSetup | null;
  setupWallet: (w: WalletSetup) => void;
  /** Spendable balance, integer sats. DERIVED from `txns`, never stored twice
      (the same rule reviews follow: the average is computed, never persisted). */
  walletBalance: number;
  /** Full ledger, newest first. The wallet activity list renders this. */
  txns: WalletTxn[];
  /** Credit the wallet (mint/receive a token, claim a sale). */
  walletReceive: (amount: number, opts?: { kind?: WalletTxnKind; title?: string; sub?: string }) => void;
  /** Debit the wallet. Returns false (and does nothing) if funds are short, so
      callers can surface a real error instead of going negative. */
  walletSend: (amount: number, opts?: { kind?: WalletTxnKind; title?: string; sub?: string }) => boolean;
  /** Ids of claimable payouts already swept, so a claim can't be replayed. */
  claimed: Set<string>;
  claim: (id: string, amount: number, fromHandle: string) => void;

  /* ----------------------------------------------------------- SETTINGS -- */
  /** NIP-65 relay list. `read`/`write` mark the outbox split. */
  relays: Relay[];
  addRelay: (url: string, mode: RelayMode) => void;
  removeRelay: (url: string) => void;
  /** Cashu mints available to the built-in wallet; first is the active one. */
  mints: string[];
  addMint: (url: string) => void;
  removeMint: (url: string) => void;
  /** Shipping addresses reused at checkout. */
  addresses: SavedAddress[];
  saveAddress: (a: Omit<SavedAddress, "id"> & { id?: string }) => void;
  removeAddress: (id: string) => void;
  /** The editable half of the user's nostr profile (kind-0 metadata). */
  profile: ProfileDraft;
  saveProfile: (p: ProfileDraft) => void;

  /* ------------------------------------------------------------ SELLING -- */
  /** Listing drafts, newest first. Autosaved by the composer on every change:
      losing a half-written listing to a closed tab is the upstream failure
      this exists to fix (its 1,761-line form has zero draft support). */
  drafts: ListingDraft[];
  saveDraft: (d: ListingDraft) => void;
  deleteDraft: (id: string) => void;
  /** Listings published this session, newest first. Merged into the seller's
      Active lane by the hooks so publish has a visible result immediately. */
  ownListings: PublishedListing[];
  publishListing: (l: PublishedListing) => void;
  unlistListing: (id: string) => void;
}

/** A listing in progress. Everything optional except identity + freshness:
    a draft is valid the moment it has ANY content worth returning to. */
export interface ListingDraft {
  id: string;
  title: string;
  summary: string;
  /** Raw input string, so the composer round-trips exactly what was typed. */
  price: string;
  category: string;
  condition: string;
  quantity: string;
  location: string;
  shippingCost: string;
  sizes: string;
  images: string[];
  /** Unix ms of the last edit; drives the "edited 2m ago" line in Drafts. */
  updatedAt: number;
}

/** The publishable shape the composer produces. Kept structural (not imported
    from mock/) so client state never depends on fixture modules. */
export interface PublishedListing {
  id: string;
  pubkey: string;
  title: string;
  summary: string;
  images: string[];
  price: number;
  currency: string;
  totalCost: number;
  location: string;
  categories: string[];
  shippingCost?: number;
  condition?: string;
  quantity?: number;
  sizes?: string[];
}

export type RelayMode = "read" | "write" | "both";
export interface Relay {
  url: string;
  mode: RelayMode;
}

export interface SavedAddress {
  id: string;
  label: string;
  name: string;
  line1: string;
  city: string;
  zip: string;
  country: string;
}

export interface ProfileDraft {
  displayName: string;
  handle: string;
  about: string;
  nip05: string;
  picture: string;
}

/** How the user's wallet is configured.
    `cashu` = the built-in NIP-60 wallet against a mint.
    `nwc`   = an external Lightning wallet over NIP-47. */
export type WalletSetup =
  | { type: "cashu"; mint: string }
  | { type: "nwc"; connection: string; walletName: string };

/** Named union mapped 1:1 onto upstream's six numeric transaction types, so the
    port is a lookup rather than a redesign (1 receive, 2 send, 3 mint, 4 melt,
    5 purchase, 6 sale). */
export type WalletTxnKind = "receive" | "send" | "mint" | "melt" | "purchase" | "sale";

export interface WalletTxn {
  id: string;
  kind: WalletTxnKind;
  /** Signed integer sats: positive credits, negative debits. */
  amount: number;
  at: number;
  title: string;
  sub: string;
}

/** Seed ledger. Sums to the 182,400 the design was built around, so nothing
    on screen changes until the user actually moves money. */
const SEED_TXNS: WalletTxn[] = [
  { id: "tx_4", kind: "mint", amount: 8000, at: 1717300000000, title: "Claimed token", sub: "Cashu mint" },
  { id: "tx_3", kind: "purchase", amount: -14000, at: 1717200000000, title: "Cold-brew concentrate", sub: "To @alice · Lightning" },
  { id: "tx_2", kind: "receive", amount: 50000, at: 1717100000000, title: "Received", sub: "From @nuno · Cashu" },
  { id: "tx_1", kind: "purchase", amount: -12000, at: 1717000000000, title: "Risograph zine no.4", sub: "To @ekko · Lightning" },
];
/** The opening balance the seed ledger is offset from, so the sum lands on the
    figure the screens were designed against. */
const SEED_OPENING = 150400;
/** Fixed "now" for new transaction stamps. Deliberately not Date.now(): a live
    clock differs between server and client render and trips hydration. */
const NOW_REF = 1717372800000;

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
  const [orderStatus, setOrderStatusMap] = useState<Map<string, OrderStatusValue>>(
    () => new Map()
  );

  /* Wallet. Seeded as already set up with the built-in Cashu wallet so the
     designed screens still read populated on first run; /wallet/setup lets the
     user re-run the flow, and the not-set-up branch is reachable by resetting. */
  const [wallet, setWallet] = useState<WalletSetup | null>({
    type: "cashu",
    mint: "mint.minibits.cash",
  });
  const [txns, setTxns] = useState<WalletTxn[]>(SEED_TXNS);
  const [claimed, setClaimed] = useState<Set<string>>(new Set());

  // Balance is DERIVED, never stored: one source of truth for money on screen.
  const walletBalance = useMemo(
    () => txns.reduce((sum, t) => sum + t.amount, SEED_OPENING),
    [txns]
  );

  // Monotonic ids without Date.now/random, which would break SSR agreement.
  const txSeq = useRef(0);
  const pushTxn = useCallback((t: Omit<WalletTxn, "id" | "at">) => {
    txSeq.current += 1;
    const id = `tx_new_${txSeq.current}`;
    setTxns((prev) => [{ ...t, id, at: NOW_REF + txSeq.current * 1000 }, ...prev]);
  }, []);

  const setupWallet = useCallback((w: WalletSetup) => setWallet(w), []);

  /* Settings. Seeded with the defaults upstream ships so the manager screens
     read populated, and every add/remove below is real state. */
  const [relays, setRelays] = useState<Relay[]>([
    { url: "wss://relay.damus.io", mode: "both" },
    { url: "wss://nos.lol", mode: "both" },
    { url: "wss://relay.primal.net", mode: "read" },
    { url: "wss://nostr.mutinywallet.com", mode: "write" },
  ]);
  const [mints, setMints] = useState<string[]>([
    "mint.minibits.cash",
    "mint.coinos.io",
  ]);
  const [addresses, setAddresses] = useState<SavedAddress[]>([
    {
      id: "addr_1",
      label: "Home",
      name: "Ekko R.",
      line1: "Skalitzer Str. 12",
      city: "Berlin",
      zip: "10997",
      country: "Germany",
    },
  ]);
  const [profile, setProfile] = useState<ProfileDraft>({
    displayName: "Ekko",
    handle: "ekko",
    about: "Riso prints and small-run zines from Berlin.",
    nip05: "ekko@shopstr.store",
    picture: "",
  });

  const addRelay = useCallback((url: string, mode: RelayMode) => {
    const clean = url.trim();
    if (!clean) return;
    // Replace rather than duplicate: adding a known relay changes its mode.
    setRelays((prev) => {
      const rest = prev.filter((r) => r.url !== clean);
      return [...rest, { url: clean, mode }];
    });
  }, []);
  const removeRelay = useCallback((url: string) => {
    setRelays((prev) => prev.filter((r) => r.url !== url));
  }, []);

  const addMint = useCallback((url: string) => {
    const clean = url.trim().replace(/^https?:\/\//, "");
    if (!clean) return;
    setMints((prev) => (prev.includes(clean) ? prev : [clean, ...prev]));
  }, []);
  const removeMint = useCallback((url: string) => {
    setMints((prev) => prev.filter((m) => m !== url));
  }, []);

  const addrSeq = useRef(0);
  const saveAddress = useCallback((a: Omit<SavedAddress, "id"> & { id?: string }) => {
    setAddresses((prev) => {
      if (a.id) return prev.map((x) => (x.id === a.id ? ({ ...a, id: a.id } as SavedAddress) : x));
      addrSeq.current += 1;
      return [...prev, { ...a, id: `addr_new_${addrSeq.current}` } as SavedAddress];
    });
  }, []);
  const removeAddress = useCallback((id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const saveProfile = useCallback((p: ProfileDraft) => setProfile(p), []);

  /* Selling: drafts autosave (upsert by id, newest edit first) and the
     session-published listings that feed the Active lane. */
  const [drafts, setDrafts] = useState<ListingDraft[]>([]);
  const saveDraft = useCallback((d: ListingDraft) => {
    setDrafts((prev) => [d, ...prev.filter((x) => x.id !== d.id)]);
  }, []);
  const deleteDraft = useCallback((id: string) => {
    setDrafts((prev) => prev.filter((x) => x.id !== id));
  }, []);
  const [shipments, setShipments] = useState<Map<string, { carrier: string; tracking: string }>>(
    () => new Map()
  );
  const setShipment = useCallback((id: string, s: { carrier: string; tracking: string }) => {
    setShipments((prev) => new Map(prev).set(id, s));
  }, []);

  const [ownListings, setOwnListings] = useState<PublishedListing[]>([]);
  const publishListing = useCallback((l: PublishedListing) => {
    setOwnListings((prev) => [l, ...prev.filter((x) => x.id !== l.id)]);
  }, []);
  const unlistListing = useCallback((id: string) => {
    setOwnListings((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const walletReceive = useCallback(
    (amount: number, opts?: { kind?: WalletTxnKind; title?: string; sub?: string }) => {
      if (!Number.isFinite(amount) || amount <= 0) return;
      pushTxn({
        kind: opts?.kind ?? "receive",
        amount: Math.round(amount),
        title: opts?.title ?? "Received",
        sub: opts?.sub ?? "Cashu",
      });
    },
    [pushTxn]
  );

  const walletSend = useCallback(
    (amount: number, opts?: { kind?: WalletTxnKind; title?: string; sub?: string }) => {
      if (!Number.isFinite(amount) || amount <= 0) return false;
      const amt = Math.round(amount);
      // Guard here rather than at the call site so the ledger can never go
      // negative, whichever surface is spending.
      if (amt > walletBalance) return false;
      pushTxn({
        kind: opts?.kind ?? "send",
        amount: -amt,
        title: opts?.title ?? "Sent",
        sub: opts?.sub ?? "Lightning",
      });
      return true;
    },
    [pushTxn, walletBalance]
  );

  const claim = useCallback(
    (id: string, amount: number, fromHandle: string) => {
      // Idempotent: a claimed payout can't be swept twice.
      let already = false;
      setClaimed((prev) => {
        if (prev.has(id)) {
          already = true;
          return prev;
        }
        return new Set(prev).add(id);
      });
      if (already) return;
      pushTxn({
        kind: "sale",
        amount: Math.round(amount),
        title: "Sale claimed",
        sub: `From @${fromHandle} · Cashu`,
      });
    },
    [pushTxn]
  );

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

  const setOrderStatus = useCallback((id: string, status: OrderStatusValue) => {
    setOrderStatusMap((prev) => new Map(prev).set(id, status));
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
      orderStatus,
      setOrderStatus,
      payout,
      setPayout,
      wallet,
      setupWallet,
      walletBalance,
      txns,
      walletReceive,
      walletSend,
      claimed,
      claim,
      relays,
      addRelay,
      removeRelay,
      mints,
      addMint,
      removeMint,
      addresses,
      saveAddress,
      removeAddress,
      profile,
      saveProfile,
      drafts,
      saveDraft,
      deleteDraft,
      ownListings,
      publishListing,
      unlistListing,
      shipments,
      setShipment,
    }),
    [
      signedIn, favs, toggleFav, follows, toggleFollow,
      joinedCommunities, toggleJoin, moderated, moderatePost,
      ownPosts, submitPost, orderStatus, setOrderStatus, payout,
      wallet, setupWallet, walletBalance, txns, walletReceive, walletSend,
      claimed, claim,
      relays, addRelay, removeRelay, mints, addMint, removeMint,
      addresses, saveAddress, removeAddress, profile, saveProfile,
      drafts, saveDraft, deleteDraft, ownListings, publishListing, unlistListing,
      shipments, setShipment,
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

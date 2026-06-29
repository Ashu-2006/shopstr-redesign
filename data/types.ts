/* =============================================================================
   Data contracts — these MUST match the real Shopstr app shapes.
   When this frontend is ported back, the *.ts hook bodies get rewritten to read
   React Context / nostr / cashu, but these types stay frozen. Money is always
   integer sats. Identity is npub/pubkey based — never email/phone/password.
   ========================================================================== */

/** A marketplace listing. */
export interface ProductData {
  id: string;
  pubkey: string;
  title: string;
  summary: string;
  images: string[];
  /** Integer sats. */
  price: number;
  currency: string;
  /** Integer sats: price + shipping (+ any fees). */
  totalCost: number;
  location: string;
  categories: string[];
  shippingType?: string;
  /** Integer sats. */
  shippingCost?: number;
  condition?: string;
  quantity?: number;
  sizes?: string[];
  status?: string;
}

/** A seller/buyer identity. Nostr-native: no email/phone/password ever. */
export interface Profile {
  pubkey: string;
  npub: string;
  handle: string;
  nip05?: string;
  about?: string;
  picture?: string;
  banner?: string;
  /** Integer sats moved through this account (display stat). */
  totalSales?: number;
}

/**
 * Reviews for a seller. A seller's rating = average of `scores`; the review
 * count = `scores.length`. Kept as raw scores so the average is derived, never
 * stored.
 */
export interface SellerReviews {
  pubkey: string;
  scores: number[];
  comments?: ReviewComment[];
}

export interface ReviewComment {
  id: string;
  authorPubkey: string;
  score: number;
  text: string;
  /** Unix seconds. */
  createdAt: number;
}

/** A line item in the cart. */
export interface CartItem {
  product: ProductData;
  quantity: number;
  /** Selected size, when the product offers sizes. */
  size?: string;
}

/** A direct-message thread (nostr DM), summarized for the inbox. */
export interface ChatThread {
  id: string;
  /** The other party. */
  counterpartyPubkey: string;
  counterpartyHandle: string;
  counterpartyPicture?: string;
  /** Optional listing this conversation is about. */
  productId?: string;
  lastMessage: string;
  /** Unix seconds. */
  lastMessageAt: number;
  unread: number;
}

/** The standard hook return envelope. Mechanical to wire to Context later. */
export interface AsyncResult<T> {
  data: T;
  isLoading: boolean;
}

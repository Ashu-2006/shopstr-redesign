/* Mock data beyond listings/profiles — communities, orders, a claimable sale,
   and the seller-to-buyer loop fixtures. Behind the hooks in data/hooks.ts. */

/**
 * A NIP-72 moderated community (kind 34550 upstream). `slug` is the `d`
 * identifier. Counts are NUMBERS so they can be computed, compared and sorted:
 * the old pre-formatted strings could only ever be decoration.
 */
export interface Community {
  slug: string;
  name: string;
  about: string;
  /** Phosphor icon NAME string (from the allowlist), rendered by the consumer. */
  emoji: string;
  /** Topical hint, for discovery only. Does NOT define the feed. */
  topics: string[];
  memberCount: number;
  /** accent key for tiles / badge */
  tone: "pink" | "yellow" | "green" | "blue" | "purple";
  /** Owner handle. Always also a moderator. */
  curator: string;
  /** Handles that can approve posts. The owner is prepended by the hook. */
  moderators: string[];
  /** featured on the discover directory (wide tile). */
  featured?: boolean;
  rules?: string[];
}

/** Why a member posted. Every kind stays anchored to commerce. */
export type PostKind = "show" | "ask" | "sale";

/**
 * A community post (kind 1111 upstream). A post is a REQUEST until a moderator
 * approves it (kind 4550) — that gate is the whole mechanism of NIP-72, so it
 * is modeled here rather than assumed away.
 */
export interface CommunityPost {
  id: string;
  communitySlug: string;
  authorHandle: string;
  kind: PostKind;
  text: string;
  /** Unix seconds. */
  at: number;
  status: "approved" | "pending";
  approvedBy?: string;
  /** A post may quote a listing. This is the honest listing relationship. */
  productId?: string;
  replyCount: number;
}

export const MOCK_COMMUNITIES: Community[] = [
  {
    slug: "riso",
    name: "Riso & Print Club",
    about: "Risograph, screen print, and zines. Show your pulls, ask about paper stock, trade misprints.",
    emoji: "Palette",
    topics: ["Art & Print"],
    memberCount: 1243,
    tone: "purple",
    curator: "ekko",
    moderators: ["mara.knits"],
    featured: true,
    rules: ["Show your work, not just links", "Price in sats, ship what you photograph"],
  },
  {
    slug: "coffee",
    name: "Specialty Coffee",
    about: "Roasters and home brewers swapping beans, grinders, and dialed-in recipes.",
    emoji: "Coffee",
    topics: ["Coffee"],
    memberCount: 940,
    tone: "yellow",
    curator: "alice",
    moderators: [],
    rules: ["Roast date on every bean post"],
  },
  {
    slug: "film",
    name: "Film Shooters",
    about: "35mm and medium format. Serviced bodies, honest light meter readings, no fungus.",
    emoji: "Camera",
    topics: ["Photography"],
    memberCount: 2310,
    tone: "green",
    curator: "daveshoots",
    moderators: ["ekko"],
    rules: ["Disclose every fault", "Sample frames or it did not happen"],
  },
  {
    slug: "textiles",
    name: "Slow Textiles",
    about: "Hand-knit, naturally dyed, mended. Made slowly and meant to last.",
    emoji: "Cube",
    topics: ["Apparel"],
    memberCount: 610,
    tone: "blue",
    curator: "mara.knits",
    moderators: [],
  },
  {
    slug: "ceramics",
    name: "Clay Heads",
    about: "Wheel-thrown, hand-built, wood-fired. Glaze recipes welcome.",
    emoji: "Sphere",
    topics: ["Ceramics"],
    memberCount: 1120,
    tone: "pink",
    curator: "alice",
    moderators: ["ekko"],
    rules: ["Food-safe glazes only for tableware"],
  },
];

/**
 * Community posts. `at` is unix seconds against the app's fixed now
 * (1717372800). Mixed approval states on purpose: pending posts are what make
 * the moderator queue and the "your request is waiting" state reviewable.
 * `ekko` is the current user, and moderates riso + film via MOCK_COMMUNITIES.
 */
export const MOCK_COMMUNITY_POSTS: CommunityPost[] = [
  // ---- riso (current user moderates) ----
  {
    id: "cp_r1",
    communitySlug: "riso",
    authorHandle: "mara.knits",
    kind: "show",
    text: "Two-colour pull on 300gsm, fluoro pink over blue. The misregistration was an accident I am keeping.",
    at: 1717358400,
    status: "approved",
    approvedBy: "ekko",
    replyCount: 4,
  },
  {
    id: "cp_r2",
    communitySlug: "riso",
    authorHandle: "alice",
    kind: "ask",
    text: "Anyone drum-scanned a riso print without the moire? Flatbed keeps fighting the halftone.",
    at: 1717344000,
    status: "approved",
    approvedBy: "ekko",
    replyCount: 6,
  },
  {
    id: "cp_r3",
    communitySlug: "riso",
    authorHandle: "ekko",
    kind: "sale",
    text: "Issue 4 is off the drum. 40 copies, signed on the verso.",
    at: 1717333000,
    status: "approved",
    approvedBy: "ekko",
    productId: "lst_007",
    replyCount: 2,
  },
  {
    id: "cp_r4",
    communitySlug: "riso",
    authorHandle: "daveshoots",
    kind: "ask",
    text: "Is 80gsm too thin for a two-colour run, or am I underthinking the paper?",
    at: 1717366000,
    status: "pending",
    replyCount: 0,
  },
  {
    id: "cp_r5",
    communitySlug: "riso",
    authorHandle: "nuno",
    kind: "sale",
    text: "Clearing out my spare drum. Purple, low mileage.",
    at: 1717369000,
    status: "pending",
    replyCount: 0,
  },

  // ---- film (current user moderates) ----
  {
    id: "cp_f1",
    communitySlug: "film",
    authorHandle: "daveshoots",
    kind: "show",
    text: "CLA'd this rangefinder over the weekend. Shutter is dead quiet again, meter within a third of a stop.",
    at: 1717351200,
    status: "approved",
    approvedBy: "daveshoots",
    productId: "lst_005",
    replyCount: 7,
  },
  {
    id: "cp_f2",
    communitySlug: "film",
    authorHandle: "carol",
    kind: "ask",
    text: "Buying a body with light seals described as 'recently done'. What do I ask to know if that is true?",
    at: 1717340000,
    status: "approved",
    approvedBy: "ekko",
    replyCount: 11,
  },
  {
    id: "cp_f3",
    communitySlug: "film",
    authorHandle: "mara.knits",
    kind: "show",
    text: "First roll through the Rollei. Metering by memory, mostly got away with it.",
    at: 1717364000,
    status: "pending",
    replyCount: 0,
  },

  // ---- ceramics ----
  {
    id: "cp_c1",
    communitySlug: "ceramics",
    authorHandle: "alice",
    kind: "show",
    text: "Speckled white over a matte oatmeal, cone 6. This batch finally sat where I wanted it.",
    at: 1717356000,
    status: "approved",
    approvedBy: "alice",
    productId: "lst_001",
    replyCount: 5,
  },
  {
    id: "cp_c2",
    communitySlug: "ceramics",
    authorHandle: "nuno",
    kind: "ask",
    text: "Pinholing on the inside of tall mugs only. Too thick, or firing too fast?",
    at: 1717320000,
    status: "approved",
    approvedBy: "ekko",
    replyCount: 8,
  },

  // ---- coffee ----
  {
    id: "cp_co1",
    communitySlug: "coffee",
    authorHandle: "alice",
    kind: "sale",
    text: "Cold-brew concentrate, this week's roast. Ships cold, drink within ten days.",
    at: 1717310000,
    status: "approved",
    approvedBy: "alice",
    productId: "lst_012",
    replyCount: 1,
  },

  // ---- textiles ----
  {
    id: "cp_t1",
    communitySlug: "textiles",
    authorHandle: "mara.knits",
    kind: "show",
    text: "Madder root on wool, third exhaust bath. The palest one is my favourite.",
    at: 1717290000,
    status: "approved",
    approvedBy: "mara.knits",
    replyCount: 3,
  },
];

export type OrderStatus = "paid" | "shipped" | "delivered";

export interface Order {
  id: string;
  productId: string;
  sellerHandle: string;
  status: OrderStatus;
  /** human "2d ago" etc. */
  placed: string;
  network: "Lightning" | "Cashu";
}

export const MOCK_ORDERS: Order[] = [
  { id: "A1F2", productId: "lst_007", sellerHandle: "ekko", status: "shipped", placed: "2d ago", network: "Lightning" },
  { id: "9C3D", productId: "lst_001", sellerHandle: "alice", status: "delivered", placed: "1wk ago", network: "Cashu" },
  { id: "77B0", productId: "lst_005", sellerHandle: "daveshoots", status: "paid", placed: "3wk ago", network: "Lightning" },
];

/** A just-arrived sale the seller can claim — drives the seller-to-buyer bridge. */
export const CLAIMABLE = {
  amount: 45000,
  fromHandle: "bagelmaker",
  productTitle: "Hand-thrown stoneware mug",
};

export interface WalletTx {
  dir: "in" | "out";
  title: string;
  sub: string;
  amount: number;
}

export const MOCK_TXNS: WalletTx[] = [
  { dir: "out", title: "Risograph zine no.4", sub: "To @ekko · Lightning", amount: -12000 },
  { dir: "in", title: "Received", sub: "From @nuno · Cashu", amount: 50000 },
  { dir: "out", title: "Cold-brew concentrate", sub: "To @alice · Lightning", amount: -14000 },
  { dir: "in", title: "Claimed token", sub: "Cashu mint", amount: 8000 },
];

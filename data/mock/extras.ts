/* Mock data beyond listings/profiles — communities, orders, a claimable sale,
   and the seller-to-buyer loop fixtures. Behind the hooks in data/hooks.ts. */

export interface Community {
  slug: string;
  name: string;
  emoji: string;
  /** Primary category whose listings populate the community feed. */
  category: string;
  members: string;
  listings: string;
  online: string;
  /** accent key for tiles / badge */
  tone: "pink" | "yellow" | "green" | "blue" | "purple";
  curator: string;
  /** featured on the communities landing (wide tile). */
  featured?: boolean;
  blurb?: string;
}

export const MOCK_COMMUNITIES: Community[] = [
  {
    slug: "riso",
    name: "Riso & Print Club",
    emoji: "🎨",
    category: "Art & Print",
    members: "1,243",
    listings: "84",
    online: "37",
    tone: "purple",
    curator: "ekko",
    featured: true,
    blurb: "Most active this week · 84 new listings",
  },
  {
    slug: "coffee",
    name: "Specialty Coffee",
    emoji: "☕",
    category: "Coffee",
    members: "940",
    listings: "51",
    online: "21",
    tone: "yellow",
    curator: "alice",
  },
  {
    slug: "film",
    name: "Film Shooters",
    emoji: "📷",
    category: "Photography",
    members: "2,310",
    listings: "120",
    online: "88",
    tone: "green",
    curator: "daveshoots",
  },
  {
    slug: "textiles",
    name: "Slow Textiles",
    emoji: "🧶",
    category: "Apparel",
    members: "610",
    listings: "39",
    online: "12",
    tone: "blue",
    curator: "mara.knits",
  },
  {
    slug: "ceramics",
    name: "Clay Heads",
    emoji: "🏺",
    category: "Ceramics",
    members: "1,120",
    listings: "46",
    online: "29",
    tone: "pink",
    curator: "alice",
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

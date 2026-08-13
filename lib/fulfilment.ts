import type { ProductData, ShippingType } from "@/data/types";

/* =============================================================================
   Fulfilment rules, ported 1:1 from upstream Shopstr
   (utils/parsers/product-tag-helpers.ts). The shipping type IS the fulfilment
   model, so these two functions are the only place the app decides whether a
   thing can be shipped and what shipping costs. Never branch on the raw string
   at a call site.
   ========================================================================== */

/** Types where shipping is never charged, regardless of shippingCost. */
const ZERO_COST: ShippingType[] = ["Free", "Free/Pickup", "Pickup", "N/A"];

/**
 * The real shipping cost in sats.
 * Returns null when it is genuinely unknowable (no type, or "Added Cost" with a
 * missing/invalid cost) so callers can render "calculated at checkout" instead
 * of a confident zero.
 */
export function effectiveShippingCost(
  shippingType?: ShippingType,
  shippingCost?: number
): number | null {
  if (!shippingType) return null;
  if (ZERO_COST.includes(shippingType)) return 0;
  if (typeof shippingCost !== "number" || !Number.isFinite(shippingCost) || shippingCost < 0) {
    return null;
  }
  return shippingCost;
}

export interface FulfilmentOptions {
  canShip: boolean;
  canPickup: boolean;
}

/**
 * What the buyer is allowed to choose for this listing.
 * "Pickup" means shipping is impossible; "Free/Pickup" is the ONLY case where
 * offering both is legitimate.
 */
export function fulfilmentOptions(shippingType?: ShippingType): FulfilmentOptions {
  switch (shippingType) {
    case "Pickup":
      return { canShip: false, canPickup: true };
    case "Free/Pickup":
      return { canShip: true, canPickup: true };
    default:
      // "Free", "Added Cost", "N/A", or unset: shipped (or delivered digitally).
      return { canShip: true, canPickup: false };
  }
}

/** Fulfilment options for a whole cart: only what EVERY item allows. */
export function cartFulfilmentOptions(products: ProductData[]): FulfilmentOptions {
  if (products.length === 0) return { canShip: true, canPickup: false };
  return products.reduce<FulfilmentOptions>(
    (acc, p) => {
      const o = fulfilmentOptions(p.shippingType);
      return { canShip: acc.canShip && o.canShip, canPickup: acc.canPickup && o.canPickup };
    },
    { canShip: true, canPickup: true }
  );
}

/** Human shipping line for a listing. */
export function shippingLabel(product: ProductData, formatSats: (n: number) => string): string {
  const { canShip, canPickup } = fulfilmentOptions(product.shippingType);
  if (canPickup && !canShip) {
    return product.pickupLocations?.length
      ? `Pickup only · ${product.pickupLocations[0]}`
      : "Pickup only";
  }
  const cost = effectiveShippingCost(product.shippingType, product.shippingCost);
  if (cost === null) return "Shipping calculated at checkout";
  const base = cost === 0 ? "Free shipping" : `Shipping · ${formatSats(cost)}`;
  return canPickup ? `${base} · or pickup` : base;
}

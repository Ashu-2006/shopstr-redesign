/**
 * Fixed exchange rates for the design phase.
 *
 * Upstream a seller may quote a listing in a fiat currency and the app converts
 * to sats AT CHECKOUT against a live rate (components/product-invoice-card),
 * with an explicit failure state when the lookup fails. These rates stand in for
 * that lookup so the UI can show a real dual price and a real rate-lock.
 *
 * Rates are "sats per 1 unit of currency". BTC is special-cased upstream as
 * x100_000_000; here it falls out of the same table.
 */
export const SATS_PER_UNIT: Record<string, number> = {
  sats: 1,
  BTC: 100_000_000,
  USD: 950, // ~ $1 at 105k/BTC
  EUR: 1030,
};

/** Currencies a seller may quote in. */
export const QUOTE_CURRENCIES = ["sats", "USD", "EUR"] as const;

/**
 * Simulates the rate lookup, including its failure mode. `unavailable` is what
 * the design has to account for: mid-checkout, with the buyer waiting.
 */
export function ratePerUnit(currency: string): number | null {
  return SATS_PER_UNIT[currency] ?? null;
}

/** How long a converted price is honoured before it must be re-quoted. */
export const RATE_LOCK_SECONDS = 600;

/** Display helpers. No data access here — pure formatting only. */

/** Group an integer with commas, e.g. 18000 -> "18,000". */
export function groupInt(n: number): string {
  return n.toLocaleString("en-US");
}

/** Format integer sats with the unit, e.g. 18000 -> "18,000 sats". */
export function formatSats(sats: number): string {
  return `${groupInt(sats)} sats`;
}

/** Compact sats for tight spots, e.g. 412000 -> "412k", 1850000 -> "1.85M". */
export function compactSats(n: number): string {
  if (n >= 1_000_000) return `${parseFloat((n / 1_000_000).toFixed(2))}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

/** Average of a score array rounded to 1 decimal, e.g. [5,4,5] -> "4.7". */
export function formatRating(avg: number): string {
  return avg.toFixed(1);
}

/** Coarse relative time from a unix-seconds timestamp, e.g. "3d ago". */
export function timeAgo(unixSeconds: number, nowMs: number): string {
  const secs = Math.max(0, Math.floor(nowMs / 1000 - unixSeconds));
  const mins = Math.floor(secs / 60);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 30) return `${Math.floor(days / 30)}mo ago`;
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

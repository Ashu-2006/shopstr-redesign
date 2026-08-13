import Link from "next/link";
import type { Profile } from "@/data/types";
import { compactSats } from "@/lib/format";
import { toneBg, type Tone } from "@/lib/catalog";
import { Sticker, type StickerName } from "@/components/ui/Sticker";
import { Star, SealCheck, ArrowUpRight } from "@phosphor-icons/react";

/* Non-listing cards. Listing cards live in ListingCard.tsx (browse) and
   FeatureCard.tsx (editorial); confirmation rows in LineItem.tsx. These two
   answer different questions: SolidTile is category nav (no product, no
   price), SellerCard is a seller entity. Pure presentation. */

/* ---- Solid compact: category tile ---------------------------------------- */
export function SolidTile({
  label,
  href,
  tone,
  sticker,
}: {
  label: string;
  href: string;
  tone: Tone;
  sticker?: StickerName;
}) {
  return (
    <Link
      href={href}
      className={`lift relative flex min-h-[120px] flex-col justify-between overflow-hidden rounded-lg border-2 border-ink p-4 ${toneBg(tone)}`}
    >
      <span className="font-mono text-[0.62rem] uppercase tracking-[0.1em] opacity-75">Shop</span>
      <span className="ds-display text-xl leading-[0.95]">{label}</span>
      {sticker && <Sticker name={sticker} className="pointer-events-none absolute -bottom-2 -right-2 h-[58px] w-[58px]" />}
    </Link>
  );
}

/* ---- Seller card: top-seller home rail ------------------------------------ */
export function SellerCard({
  profile,
  avg,
  count,
  tone,
}: {
  profile: Profile;
  avg: number;
  count: number;
  tone: Tone;
}) {
  const onDark = tone === "purple";
  return (
    <Link
      href={`/shop/${profile.handle}`}
      className={`lift flex w-[212px] shrink-0 snap-start flex-col gap-3.5 rounded-xl border-2 border-ink p-4 ${toneBg(tone)}`}
    >
      <div className="flex items-start justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={profile.picture} alt="" className="h-14 w-14 rounded-[8px] border-2 border-ink object-cover" />
        <span className="inline-flex items-center gap-1 rounded-pill bg-ink px-2.5 py-1.5 font-mono text-[0.74rem] font-bold text-white tabular-nums">
          <Star weight="fill" size={13} aria-hidden />
          {avg.toFixed(1)}
        </span>
      </div>
      <div className="min-w-0">
        <div className="ds-display flex items-center gap-1 truncate text-lg leading-none">
          @{profile.handle}
          {profile.nip05 && (
            <SealCheck size={13} className="shrink-0" aria-label="verified" />
          )}
        </div>
        <div className="mt-1.5 truncate font-mono text-[0.66rem] opacity-70">
          {count} review{count === 1 ? "" : "s"}
        </div>
      </div>
      <div className={`mt-auto flex items-center justify-between border-t-2 pt-3 font-mono text-[0.72rem] font-bold ${onDark ? "border-white/25" : "border-ink/20"}`}>
        <span className="tabular-nums">{compactSats(profile.totalSales ?? 0)} sold</span>
        <span className="inline-flex items-center gap-1">Visit
          <ArrowUpRight size={13} />
        </span>
      </div>
    </Link>
  );
}

import Link from "next/link";
import { SealCheck } from "@phosphor-icons/react";
import type { Profile } from "@/data/types";
import { Stars } from "@/components/ui/Stars";

/** Ink-card seller strip: avatar + handle + rating + view-shop link. */
export function SellerStrip({
  profile,
  avg,
  count,
}: {
  profile: Profile;
  avg: number;
  count: number;
}) {
  const initial = profile.handle.charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-3 rounded-lg border-2 border-ink bg-ink p-3 text-text-on-dark">
      {profile.picture ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.picture}
          alt=""
          className="h-11 w-11 shrink-0 rounded-[11px] object-cover"
          style={{ outline: "1px solid rgba(255,255,255,0.1)", outlineOffset: "-1px" }}
        />
      ) : (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[11px] bg-yellow text-ink ds-display">
          {initial}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 font-bold">
          @{profile.handle}
          {profile.nip05 && (
            <SealCheck size={14} color="#25c26e" aria-label="verified" className="shrink-0" />
          )}
        </div>
        <div className="font-mono text-[0.72rem] text-text-on-dark-muted">
          <Stars avg={avg} count={count} />
        </div>
      </div>
      <Link
        href={`/shop/${profile.handle}`}
        className="ds-press shrink-0 rounded-pill bg-paper-pure px-4 py-2 text-sm font-bold text-ink"
      >
        View →
      </Link>
    </div>
  );
}

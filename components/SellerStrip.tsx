import Link from "next/link";
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-label="verified">
              <path d="M12 2l2.4 1.8 3 .2.2 3L19.4 9.6l-1.8 2.4 1.8 2.4-1.8 2.6-.2 3-3 .2L12 22l-2.4-1.8-3-.2-.2-3L4.6 14.4l1.8-2.4-1.8-2.4 1.8-2.6.2-3 3-.2L12 2z" fill="#25c26e" />
              <path d="M9 12l2 2 4-4" stroke="#121212" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div className="font-mono text-[0.72rem] text-[#bdbcb4]">
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

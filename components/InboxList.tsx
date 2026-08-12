import Link from "next/link";
import type { ChatThread } from "@/data/types";
import { timeAgo } from "@/lib/format";

/**
 * Inbox thread list. Pure presentation: rows link to /messages/[handle].
 * `activeHandle` highlights the open thread when the list is a split-view rail.
 * Each row carries the listing being discussed as a thumbnail docked on the
 * avatar, so the inbox reads as conversations-about-items, not a socials DM list.
 */
export function InboxList({
  chats,
  now,
  activeHandle,
}: {
  chats: ChatThread[];
  now: number;
  activeHandle?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {chats.map((t) => {
        const active = t.counterpartyHandle === activeHandle;
        const unread = t.unread > 0;
        return (
          <Link
            key={t.id}
            href={`/messages/${t.counterpartyHandle}`}
            aria-current={active ? "page" : undefined}
            className={`ds-press flex items-center gap-3 rounded-xl border-2 px-3 py-3 transition-colors duration-(--ds-dur-instant) ${
              active
                ? "border-ink bg-purple-soft"
                : unread
                  ? "border-ink bg-paper-pure"
                  : "border-transparent hover:bg-paper-2"
            }`}
          >
            <span className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.counterpartyPicture} alt="" className="h-12 w-12 rounded-[13px] border-2 border-ink object-cover" />
              {t.productImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.productImage}
                  alt=""
                  className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-md border-2 border-ink object-cover"
                />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-bold">@{t.counterpartyHandle}</span>
                <span
                  className={`rounded-pill px-1.5 py-px font-mono text-[0.55rem] uppercase tracking-[0.08em] ${
                    t.kind === "selling" ? "bg-green" : "bg-yellow"
                  }`}
                >
                  {t.kind}
                </span>
              </div>
              <div className={`truncate text-sm ${unread ? "font-semibold text-text" : "text-text-muted"}`}>
                {t.lastMessage}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="font-mono text-[0.64rem] text-text-subtle">{timeAgo(t.lastMessageAt, now)}</span>
              {unread && (
                <span className="grid min-w-5 place-items-center rounded-[9px] bg-purple px-1.5 py-0.5 font-mono text-[0.6rem] font-bold text-on-purple tabular-nums">
                  {t.unread}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

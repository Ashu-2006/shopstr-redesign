import Link from "next/link";
import type { ChatThread } from "@/data/types";
import { timeAgo } from "@/lib/format";

/**
 * Inbox thread list. Pure presentation: rows link to /messages/[handle].
 * `activeHandle` highlights the open thread when the list is a split-view rail.
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
    <div className="flex flex-col">
      {chats.map((t) => {
        const active = t.counterpartyHandle === activeHandle;
        return (
          <Link
            key={t.id}
            href={`/messages/${t.counterpartyHandle}`}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 border-b-2 border-ink px-2 py-3.5 transition-colors duration-(--ds-dur-instant) ${
              active ? "bg-purple-soft" : "hover:bg-paper-2"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.counterpartyPicture} alt="" className="h-12 w-12 shrink-0 rounded-[13px] border-2 border-ink object-cover" />
            <div className="min-w-0 flex-1">
              <div className="font-bold">@{t.counterpartyHandle}</div>
              <div className="truncate text-sm text-text-muted">{t.lastMessage}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-[0.64rem] text-text-subtle">{timeAgo(t.lastMessageAt, now)}</div>
              {t.unread > 0 && (
                <span className="mt-1.5 inline-block min-w-5 rounded-[9px] bg-purple px-1.5 py-0.5 text-center font-mono text-[0.6rem] font-bold text-on-purple tabular-nums">
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

import Head from "next/head";
import Link from "next/link";
import { useChats } from "@/data/hooks";
import { timeAgo } from "@/lib/format";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";

// Fixed reference time so relative stamps are stable (no SSR/CSR mismatch).
const NOW = 1717372800000;

export default function Messages() {
  const { data: chats } = useChats();
  return (
    <>
      <Head><title>Inbox · Shopstr</title></Head>
      <SheetHeader title="Inbox" backTo="/marketplace" />
      <main className="mx-auto max-w-[760px] px-4 pb-28 pt-1 md:pb-12">
        {chats.map((t) => (
          <Link
            key={t.id}
            href={`/messages/${t.counterpartyHandle}`}
            className="flex items-center gap-3 border-b-2 border-ink py-3.5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.counterpartyPicture} alt="" className="h-12 w-12 shrink-0 rounded-[13px] border-2 border-ink object-cover" />
            <div className="min-w-0 flex-1">
              <div className="font-bold">@{t.counterpartyHandle}</div>
              <div className="truncate text-sm text-text-muted">{t.lastMessage}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-[0.64rem] text-text-subtle">{timeAgo(t.lastMessageAt, NOW)}</div>
              {t.unread > 0 && (
                <span className="mt-1.5 inline-block min-w-5 rounded-[9px] bg-purple px-1.5 py-0.5 text-center font-mono text-[0.6rem] font-bold text-on-purple tabular-nums">
                  {t.unread}
                </span>
              )}
            </div>
          </Link>
        ))}
      </main>
      <BottomNav active="/messages" />
    </>
  );
}

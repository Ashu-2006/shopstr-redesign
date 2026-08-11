import Head from "next/head";
import Link from "next/link";
import { useChats } from "@/data/hooks";
import { ChatCircle } from "@phosphor-icons/react";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { RowSkeleton } from "@/components/skeletons";
import { InboxList } from "@/components/InboxList";

// Fixed reference time so relative stamps are stable (no SSR/CSR mismatch).
const NOW = 1717372800000;

export default function Messages() {
  const { data: chats, isLoading } = useChats();
  return (
    <>
      <Head><title>Inbox · Shopstr</title></Head>
      <SheetHeader title="Inbox" backTo="/marketplace" />
      <main className="mx-auto max-w-[760px] px-4 pb-28 pt-1 md:pb-12 lg:grid lg:max-w-[1200px] lg:grid-cols-[400px_1fr] lg:gap-8 lg:px-6">
        {isLoading ? (
          <div className="flex flex-col" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <RowSkeleton key={i} frame="divider" avatar="square" avatarSize={48} />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <EmptyState
            sticker="badge-new-speech"
            headline="Inbox is quiet"
            body="Chats with sellers land here. Ask about a listing to start one."
            cta={
              <Link href="/marketplace">
                <Button variant="secondary">Browse the market</Button>
              </Link>
            }
          />
        ) : (
          <InboxList chats={chats} now={NOW} />
        )}
        {/* Desktop split view: the right pane waits for a thread. */}
        <div className="hidden min-h-[70vh] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-ink bg-paper-pure lg:flex">
          <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-ink bg-green">
            <ChatCircle size={30} />
          </span>
          <p className="ds-display text-2xl">Pick a conversation</p>
          <p className="max-w-[300px] text-center text-sm text-text-muted">
            Encrypted DMs over Nostr. Choose a thread on the left to keep talking.
          </p>
        </div>
      </main>
      <BottomNav active="/messages" />
    </>
  );
}

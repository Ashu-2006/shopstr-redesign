import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useChats } from "@/data/hooks";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sticker } from "@/components/ui/Sticker";
import { RowSkeleton } from "@/components/skeletons";
import { InboxList } from "@/components/InboxList";

// Fixed reference time so relative stamps are stable (no SSR/CSR mismatch).
const NOW = 1717372800000;

type Filter = "all" | "buying" | "selling";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "buying", label: "Buying" },
  { key: "selling", label: "Selling" },
];

export default function Messages() {
  const { data: chats, isLoading } = useChats();
  const [filter, setFilter] = useState<Filter>("all");

  const unreadTotal = chats.reduce((n, t) => n + t.unread, 0);
  const visible = filter === "all" ? chats : chats.filter((t) => t.kind === filter);

  return (
    <>
      <Head><title>Inbox · Shopstr</title></Head>
      <SheetHeader title="Inbox" backTo="/marketplace" contentMax="max-w-[760px] lg:max-w-[1200px]" />
      <main className="mx-auto max-w-[760px] px-4 pb-28 pt-1 md:pb-12 lg:grid lg:max-w-[1200px] lg:grid-cols-[400px_1fr] lg:items-start lg:gap-8 lg:px-6">
        <div>
          {/* Rail header: unread pulse + buying/selling lens. */}
          <div className="mb-3 flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  aria-pressed={filter === f.key}
                  className={`ds-press rounded-pill border-2 border-ink px-3.5 py-1.5 text-sm font-bold transition-colors duration-(--ds-dur-instant) ${
                    filter === f.key ? "bg-ink text-text-on-dark" : "bg-paper-pure"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {unreadTotal > 0 && (
              <span className="rounded-pill bg-purple px-2.5 py-1 font-mono text-[0.66rem] font-bold text-on-purple tabular-nums">
                {unreadTotal} new
              </span>
            )}
          </div>

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
          ) : visible.length === 0 ? (
            <EmptyState
              variant="inline"
              headline={filter === "selling" ? "No selling chats" : "No buying chats"}
              body={
                filter === "selling"
                  ? "When a buyer messages you about a listing, it lands here."
                  : "Ask a seller about a listing and the thread lands here."
              }
              cta={
                <button onClick={() => setFilter("all")} className="font-bold text-purple underline">
                  Show all chats
                </button>
              }
            />
          ) : (
            <InboxList chats={visible} now={NOW} />
          )}
        </div>

        {/* Desktop split view: the right pane waits for a thread. */}
        <div className="hidden min-h-[70vh] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-ink bg-paper-pure lg:flex">
          <Sticker name="shape-smiley" className="h-24 w-24 -rotate-6" />
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

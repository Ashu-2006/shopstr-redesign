import { useState } from "react";
import Link from "next/link";
import type { PostKind } from "@/data/mock/extras";
import { Camera, Question, Tag, PaperPlaneTilt, LockKey, type Icon } from "@phosphor-icons/react";

const KINDS: { key: PostKind; label: string; bg: string; icon: Icon }[] = [
  { key: "show", label: "Show", bg: "bg-green", icon: Camera },
  { key: "ask", label: "Ask", bg: "bg-blue", icon: Question },
  { key: "sale", label: "For sale", bg: "bg-yellow", icon: Tag },
];

const PLACEHOLDER: Record<PostKind, string> = {
  show: "Show what you made or found…",
  ask: "Ask the room a question…",
  sale: "What are you selling, and for how many sats?",
};

/**
 * The community composer. Three commerce-anchored post kinds, and one line of
 * truth about the approval gate: a member's post is a REQUEST until a moderator
 * approves it, so the UI says so before they write rather than after they send.
 *
 * Non-members get the disabled shell with a Join affordance: the gate is
 * visible, not hidden, so the value of joining is legible.
 */
export function CommunityComposer({
  joined,
  moderators,
  isModerator,
  onJoin,
  onSubmit,
}: {
  joined: boolean;
  moderators: string[];
  isModerator: boolean;
  onJoin: () => void;
  onSubmit: (kind: PostKind, text: string) => void;
}) {
  const [kind, setKind] = useState<PostKind>("show");
  const [text, setText] = useState("");

  if (!joined) {
    return (
      <div className="rounded-xl border-2 border-dashed border-text-subtle bg-paper-2 p-4 text-center">
        <p className="font-bold">Join to post here</p>
        <p className="mx-auto mt-1 max-w-[42ch] text-sm text-text-muted">
          Members can show work, ask questions, and list items to the room.
        </p>
        <button
          onClick={onJoin}
          className="ds-press mt-3 rounded-pill border-2 border-purple bg-purple px-5 py-2.5 font-bold text-on-purple"
        >
          Join community
        </button>
      </div>
    );
  }

  const submit = () => {
    if (!text.trim()) return;
    onSubmit(kind, text.trim());
    setText("");
  };

  return (
    <div className="rounded-xl border-2 border-ink bg-paper-pure p-3.5">
      <div className="flex gap-2">
        {KINDS.map((k) => {
          const KIcon = k.icon;
          const active = kind === k.key;
          return (
            <button
              key={k.key}
              onClick={() => setKind(k.key)}
              aria-pressed={active}
              className={`ds-press inline-flex items-center gap-1.5 rounded-pill border-2 border-ink px-3 py-1.5 text-xs font-bold transition-colors duration-(--ds-dur-instant) ${
                active ? k.bg : "bg-paper-2"
              }`}
            >
              <KIcon size={13} weight="bold" /> {k.label}
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          placeholder={PLACEHOLDER[kind]}
          className="min-h-[52px] flex-1 resize-none rounded-lg border-2 border-ink bg-paper px-3 py-2.5 outline-none focus:border-purple"
        />
        <button
          onClick={submit}
          aria-label="Post"
          className="ds-press grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-purple bg-purple text-white"
        >
          <PaperPlaneTilt size={18} />
        </button>
      </div>

      {/* The gate, stated up front. */}
      <p className="mt-2 flex items-center gap-1.5 font-mono text-[0.62rem] leading-tight text-text-subtle">
        <LockKey size={12} className="shrink-0" />
        {isModerator ? (
          <>You moderate here, so your posts appear immediately.</>
        ) : (
          <>
            Reviewed by{" "}
            {moderators.slice(0, 2).map((m, i) => (
              <span key={m}>
                {i > 0 && " or "}
                <Link href={`/shop/${m}`} className="font-bold text-purple">@{m}</Link>
              </span>
            ))}{" "}
            before it appears.
          </>
        )}
      </p>
    </div>
  );
}

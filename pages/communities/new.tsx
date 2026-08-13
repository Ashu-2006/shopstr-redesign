import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { ME } from "@/data/hooks";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Sticker } from "@/components/ui/Sticker";
import {
  Palette, Coffee, Camera, Cube, Sphere, Check, ShieldCheck, type Icon,
} from "@phosphor-icons/react";

const ICONS: { key: string; Comp: Icon }[] = [
  { key: "Palette", Comp: Palette },
  { key: "Coffee", Comp: Coffee },
  { key: "Camera", Comp: Camera },
  { key: "Cube", Comp: Cube },
  { key: "Sphere", Comp: Sphere },
];

const TONES = ["purple", "pink", "yellow", "green", "blue"] as const;
const TONE_BG: Record<string, string> = {
  purple: "bg-purple", pink: "bg-pink", yellow: "bg-yellow", green: "bg-green", blue: "bg-blue",
};

/**
 * Create a community. Fixes the old dead link (Start a community pointed at the
 * page you were already on). Mirrors the upstream create form's real fields:
 * name, description, identifier, image/icon. Mock only: nothing is published.
 */
export default function NewCommunity() {
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [icon, setIcon] = useState("Palette");
  const [tone, setTone] = useState<(typeof TONES)[number]>("purple");
  const [done, setDone] = useState(false);

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const valid = name.trim().length > 2 && about.trim().length > 8;
  const ActiveIcon = ICONS.find((i) => i.key === icon)?.Comp;

  if (done) {
    return (
      <>
        <Head><title>Community created · Shopstr</title></Head>
        <SheetHeader title="Created" backTo="/communities" />
        <main className="mx-auto max-w-[560px] px-4 py-14 text-center">
          <Sticker name="shape-starburst" className="mx-auto h-24 w-24 spin-slow" />
          <h1 className="ds-display mt-4 text-3xl">{name} is live</h1>
          <p className="mx-auto mt-2 max-w-[40ch] text-text-muted">
            You are the owner and first moderator. Every post from a member lands in your
            queue until you approve it.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href={`/communities/${slug}`}
              className="ds-press rounded-pill border-2 border-purple bg-purple py-3.5 font-bold text-on-purple"
            >
              Open {name}
            </Link>
            <Link
              href="/communities"
              className="ds-press rounded-pill border-2 border-ink bg-paper-pure py-3.5 font-bold"
            >
              Back to your communities
            </Link>
          </div>
        </main>
        <BottomNav active="/communities" />
      </>
    );
  }

  return (
    <>
      <Head><title>Start a community · Shopstr</title></Head>
      <SheetHeader title="Start a community" backTo="/communities/discover" contentMax="max-w-[560px]" />
      <main className="mx-auto max-w-[560px] px-4 pb-28 pt-3 md:pb-12">
        {/* Live preview: the tile they are about to make. */}
        <div className={`flex items-center gap-3.5 rounded-xl border-2 border-ink p-4 ${TONE_BG[tone]} ${tone === "purple" ? "text-on-purple" : "text-ink"}`}>
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[6px] border-2 border-ink bg-paper-pure text-ink">
            {ActiveIcon && <ActiveIcon size={28} />}
          </span>
          <div className="min-w-0">
            <div className="ds-display text-xl leading-none">
              {name.trim() || "Your community"}
            </div>
            <div className="mt-1.5 text-[0.82rem] leading-snug opacity-90">
              {about.trim() || "What it is for, in one line."}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.1em] text-text-muted">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Riso & Print Club"
              className="rounded-lg border-2 border-ink bg-paper-pure px-3.5 py-3 outline-none focus:border-purple"
            />
            {slug && (
              <span className="font-mono text-[0.62rem] text-text-subtle">
                shopstr.store/communities/{slug}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.1em] text-text-muted">
              What is it for
            </span>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={3}
              placeholder="Who belongs here and what they post."
              className="resize-none rounded-lg border-2 border-ink bg-paper-pure px-3.5 py-3 outline-none focus:border-purple"
            />
          </label>

          <div>
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.1em] text-text-muted">Icon</span>
            <div className="mt-2 flex gap-2">
              {ICONS.map(({ key, Comp }) => (
                <button
                  key={key}
                  onClick={() => setIcon(key)}
                  aria-label={key}
                  aria-pressed={icon === key}
                  className={`ds-press grid h-12 w-12 place-items-center rounded-[8px] border-2 ${
                    icon === key ? "border-purple bg-purple-soft" : "border-ink bg-paper-pure"
                  }`}
                >
                  <Comp size={22} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.1em] text-text-muted">Colour</span>
            <div className="mt-2 flex gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  aria-label={t}
                  aria-pressed={tone === t}
                  className={`ds-press grid h-12 w-12 place-items-center rounded-full border-2 border-ink ${TONE_BG[t]}`}
                >
                  {tone === t && <Check size={18} weight="bold" className={t === "purple" ? "text-on-purple" : "text-ink"} />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border-2 border-ink bg-paper-2 p-3.5">
            <ShieldCheck size={20} weight="bold" className="mt-0.5 shrink-0" />
            <p className="text-sm leading-snug text-text-muted">
              You become the owner and first moderator as <b>@{ME}</b>. Members&apos; posts wait in
              your queue until you approve them. You can add moderators later.
            </p>
          </div>

          <button
            onClick={() => setDone(true)}
            disabled={!valid}
            className="ds-press rounded-pill border-2 border-purple bg-purple py-3.5 font-bold text-on-purple disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create community
          </button>
        </div>
      </main>
      <BottomNav active="/communities" />
    </>
  );
}

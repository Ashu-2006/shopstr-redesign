import { useState } from "react";
import Head from "next/head";
import { Check, WarningCircle } from "@phosphor-icons/react";
import { useSession } from "@/data/hooks";
import type { ProfileDraft } from "@/data/store";
import { SettingsShell, Field, settingsInput } from "@/components/ui/SettingsShell";

/* Profile and identity: the editable half of a kind-0 metadata event. Saving
   writes to session state, so the change shows up wherever the handle renders. */

export default function ProfileSettings() {
  const { profile, saveProfile } = useSession();
  const [draft, setDraft] = useState<ProfileDraft>(profile);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileDraft, string>>>({});
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof ProfileDraft>(k: K, v: ProfileDraft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
    if (saved) setSaved(false);
  };

  const submit = () => {
    const next: Partial<Record<keyof ProfileDraft, string>> = {};
    if (!draft.displayName.trim()) next.displayName = "A display name is how buyers recognise you.";
    if (!draft.handle.trim()) next.handle = "Pick a handle.";
    else if (!/^[a-z0-9_.]+$/i.test(draft.handle.trim()))
      next.handle = "Handles use letters, numbers, dots and underscores only.";
    // NIP-05 is optional, but a malformed one is worse than none: it fails
    // verification silently and the badge never appears.
    if (draft.nip05.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.nip05.trim()))
      next.nip05 = "A NIP-05 looks like name@domain.com.";

    setErrors(next);
    if (Object.keys(next).length) return;

    saveProfile({
      ...draft,
      displayName: draft.displayName.trim(),
      handle: draft.handle.trim(),
      about: draft.about.trim(),
      nip05: draft.nip05.trim(),
    });
    setSaved(true);
  };

  return (
    <>
      <Head><title>Profile &amp; identity · Shopstr</title></Head>
      <SettingsShell
        title="Profile & identity"
        lead="What buyers see on your listings and in chat. Published as your nostr profile."
      >
        <div className="flex flex-col gap-3 rounded-lg border-2 border-ink bg-paper-pure p-4">
          <Field label="Display name" error={errors.displayName}>
            <input
              value={draft.displayName}
              onChange={(e) => set("displayName", e.target.value)}
              placeholder="Ekko"
              aria-invalid={errors.displayName ? true : undefined}
              className={`${settingsInput} ${errors.displayName ? "border-red" : ""}`}
            />
          </Field>

          <Field label="Handle" error={errors.handle} hint="Your @name across the market.">
            <input
              value={draft.handle}
              onChange={(e) => set("handle", e.target.value)}
              placeholder="ekko"
              aria-invalid={errors.handle ? true : undefined}
              className={`${settingsInput} font-mono ${errors.handle ? "border-red" : ""}`}
            />
          </Field>

          <Field label="About" hint="One or two lines. What you make, where you ship from.">
            <textarea
              rows={3}
              value={draft.about}
              onChange={(e) => set("about", e.target.value)}
              placeholder="Riso prints and small-run zines from Berlin."
              className={`${settingsInput} resize-none`}
            />
          </Field>

          <Field
            label="NIP-05 (optional)"
            error={errors.nip05}
            hint="A verified address puts a check next to your name."
          >
            <input
              value={draft.nip05}
              onChange={(e) => set("nip05", e.target.value)}
              placeholder="you@example.com"
              aria-invalid={errors.nip05 ? true : undefined}
              className={`${settingsInput} font-mono ${errors.nip05 ? "border-red" : ""}`}
            />
          </Field>
        </div>

        <button
          onClick={submit}
          className="ds-press mt-4 inline-flex w-full items-center justify-center gap-2 rounded-pill border-2 border-ink bg-ink px-6 py-3.5 font-bold text-text-on-dark"
        >
          {saved ? <><Check size={18} weight="bold" /> Saved</> : "Save profile"}
        </button>
        {saved && (
          <p className="mt-2 text-center font-mono text-[0.66rem] uppercase tracking-[0.1em] text-text-subtle">
            Published to your relays
          </p>
        )}
        {Object.values(errors).some(Boolean) && (
          <p role="alert" className="mt-2 inline-flex items-start justify-center gap-1.5 text-[0.8rem] font-semibold text-red">
            <WarningCircle size={16} weight="bold" className="mt-px shrink-0" />
            Fix the fields above to save.
          </p>
        )}
      </SettingsShell>
    </>
  );
}

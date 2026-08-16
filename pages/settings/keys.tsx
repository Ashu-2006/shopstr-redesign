import { useState } from "react";
import Head from "next/head";
import { Eye, EyeSlash, Copy, Check, Warning } from "@phosphor-icons/react";
import { useSession } from "@/data/hooks";
import { SettingsShell, SettingsSection } from "@/components/ui/SettingsShell";

/* Keys and backup. Identity is mock in this prototype, so these are stand-in
   values shaped like the real thing (npub1…/nsec1…, bech32 length). Everything
   the user can DO here is real: reveal is gated behind an explicit confirm,
   copy actually copies, and the nsec is never on screen by default. */

const NPUB = "npub1ekk0q9wz3m4x7vh2ptyu6jr8slc0dnfa5hg2ztqy4mv6r8xk3ldsq7w2ny";
const NSEC = "nsec1x4v9pqg7mt2erj5czk8yn3wd6flah0su9b2vtxq6ymk4dz7cprnsl8gv3e";

function KeyRow({
  label,
  value,
  masked,
  mono = true,
}: {
  label: string;
  value: string;
  masked?: boolean;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard can be blocked; the state below still tells the truth
      // because we only flip it on success.
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="rounded-lg border-2 border-ink bg-paper-pure p-3.5">
      <div className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">{label}</div>
      <div className={`mt-1.5 break-all text-[0.82rem] ${mono ? "font-mono" : ""}`}>
        {masked ? "•".repeat(48) : value}
      </div>
      {!masked && (
        <button
          onClick={copy}
          className="ds-press mt-2.5 inline-flex items-center gap-1.5 rounded-pill border-2 border-ink bg-paper-pure px-3.5 py-1.5 text-[0.74rem] font-bold"
        >
          {copied ? <><Check size={14} weight="bold" /> Copied</> : <><Copy size={14} /> Copy</>}
        </button>
      )}
    </div>
  );
}

export default function Keys() {
  const { profile } = useSession();
  const [revealed, setRevealed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Head><title>Keys &amp; backup · Shopstr</title></Head>
      <SettingsShell
        title="Keys & backup"
        lead="Your nostr keypair is your account. There is no password reset: whoever holds the secret key is you."
      >
        <SettingsSection title="Public key" note="Safe to share">
          <KeyRow label={`npub · @${profile.handle}`} value={NPUB} />
        </SettingsSection>

        <SettingsSection title="Secret key" note="Never share">
          {!revealed && (
            <div className="rounded-lg border-2 border-red bg-paper-pure p-3.5">
              <p className="inline-flex items-start gap-2 text-[0.88rem] font-semibold">
                <Warning size={18} weight="bold" className="mt-px shrink-0 text-red" />
                <span>
                  Anyone with this key controls your account, your listings, and your sats. Only reveal it
                  somewhere private.
                </span>
              </p>
              {confirming ? (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => { setRevealed(true); setConfirming(false); }}
                    className="ds-press inline-flex flex-1 items-center justify-center gap-1.5 rounded-pill border-2 border-ink bg-ink px-4 py-2.5 font-bold text-text-on-dark"
                  >
                    <Eye size={16} /> Yes, show it
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="ds-press rounded-pill border-2 border-ink bg-paper-pure px-4 py-2.5 font-bold"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(true)}
                  className="ds-press mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-pill border-2 border-ink bg-paper-pure px-4 py-2.5 font-bold"
                >
                  <Eye size={16} /> Reveal secret key
                </button>
              )}
            </div>
          )}

          {revealed && (
            <>
              <KeyRow label="nsec" value={NSEC} />
              <button
                onClick={() => setRevealed(false)}
                className="ds-press mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-pill border-2 border-ink bg-paper-pure px-4 py-2.5 font-bold"
              >
                <EyeSlash size={16} /> Hide again
              </button>
            </>
          )}
        </SettingsSection>

        <SettingsSection title="Back it up">
          <div className="rounded-lg border-2 border-ink bg-paper-pure p-3.5">
            <p className="text-[0.88rem] text-text-muted">
              Store your secret key in a password manager. If you lose it, nobody can recover this account for
              you: not Shopstr, not a relay.
            </p>
          </div>
        </SettingsSection>
      </SettingsShell>
    </>
  );
}

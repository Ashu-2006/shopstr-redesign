import { useState } from "react";
import Head from "next/head";
import { Plus, Trash, WarningCircle, Check } from "@phosphor-icons/react";
import { useSession } from "@/data/hooks";
import type { RelayMode, SavedAddress } from "@/data/store";
import { SettingsShell, SettingsSection, Field, settingsInput } from "@/components/ui/SettingsShell";
import { EmptyState } from "@/components/ui/EmptyState";

/* Preferences hosts the three managers upstream keeps here: relays (NIP-65
   read/write split), Cashu mints, and saved shipping addresses. Each one is a
   real add/remove list against session state. */

const MODES: { key: RelayMode; label: string }[] = [
  { key: "both", label: "Read + write" },
  { key: "read", label: "Read" },
  { key: "write", label: "Write" },
];

/** Upstream proves a relay by opening it. We can't dial a socket in a mock, so
    we validate the shape a relay URL must have and say so honestly. */
function validateRelay(url: string, existing: string[]): string | null {
  const s = url.trim();
  if (!s) return "Enter a relay URL.";
  if (!/^wss?:\/\//i.test(s)) return "A relay URL starts with wss:// (or ws:// for local).";
  try {
    new URL(s);
  } catch {
    return "That isn't a valid URL.";
  }
  if (existing.includes(s)) return "That relay is already in your list.";
  return null;
}

function validateMint(url: string, existing: string[]): string | null {
  const s = url.trim().replace(/^https?:\/\//, "");
  if (!s) return "Enter a mint URL.";
  if (!/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(s)) return "That doesn't look like a mint hostname.";
  if (existing.includes(s)) return "That mint is already in your list.";
  return null;
}

const EMPTY_ADDRESS: Omit<SavedAddress, "id"> = {
  label: "",
  name: "",
  line1: "",
  city: "",
  zip: "",
  country: "",
};

export default function Preferences() {
  const {
    relays, addRelay, removeRelay,
    mints, addMint, removeMint,
    addresses, saveAddress, removeAddress,
  } = useSession();

  const [relayUrl, setRelayUrl] = useState("");
  const [relayMode, setRelayMode] = useState<RelayMode>("both");
  const [relayError, setRelayError] = useState<string | null>(null);

  const [mintUrl, setMintUrl] = useState("");
  const [mintError, setMintError] = useState<string | null>(null);

  const [editing, setEditing] = useState<(Omit<SavedAddress, "id"> & { id?: string }) | null>(null);
  const [addrError, setAddrError] = useState<string | null>(null);

  const submitRelay = () => {
    const err = validateRelay(relayUrl, relays.map((r) => r.url));
    setRelayError(err);
    if (err) return;
    addRelay(relayUrl.trim(), relayMode);
    setRelayUrl("");
  };

  const submitMint = () => {
    const err = validateMint(mintUrl, mints);
    setMintError(err);
    if (err) return;
    addMint(mintUrl);
    setMintUrl("");
  };

  const submitAddress = () => {
    if (!editing) return;
    // Everything a parcel needs; a half-filled address is worse than none.
    const missing = (["label", "name", "line1", "city", "zip", "country"] as const).filter(
      (k) => !String(editing[k] ?? "").trim()
    );
    if (missing.length) {
      setAddrError("Fill in every field so the parcel can actually arrive.");
      return;
    }
    saveAddress(editing);
    setEditing(null);
    setAddrError(null);
  };

  return (
    <>
      <Head><title>Preferences · Shopstr</title></Head>
      <SettingsShell
        title="Preferences"
        lead="Where your notes are published, which mints hold your ecash, and where your orders ship."
      >
        {/* ------------------------------------------------------- RELAYS -- */}
        <SettingsSection title="Relays" note="NIP-65 outbox">
          <div className="flex flex-col gap-2">
            {relays.map((r) => (
              <div key={r.url} className="flex items-center gap-3 rounded-lg border-2 border-ink bg-paper-pure p-3">
                <span className="min-w-0 flex-1 leading-snug">
                  <span className="block truncate font-mono text-[0.82rem] font-bold">{r.url}</span>
                  <span className="mt-0.5 block font-mono text-[0.68rem] uppercase tracking-[0.06em] text-text-muted">
                    {MODES.find((m) => m.key === r.mode)?.label}
                  </span>
                </span>
                <button
                  onClick={() => removeRelay(r.url)}
                  aria-label={`Remove ${r.url}`}
                  className="ds-press grid h-9 w-9 shrink-0 place-items-center rounded-[8px] border-2 border-ink bg-paper-pure text-red"
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}
            {relays.length === 0 && (
              <EmptyState
                variant="inline"
                headline="No relays"
                body="Without a relay your listings and messages have nowhere to go."
                className="!py-8"
              />
            )}
          </div>

          <div className="mt-3 rounded-lg border-2 border-ink bg-paper-pure p-3.5">
            <Field label="Add a relay" error={relayError ?? undefined}>
              <input
                value={relayUrl}
                onChange={(e) => { setRelayUrl(e.target.value); if (relayError) setRelayError(null); }}
                onKeyDown={(e) => e.key === "Enter" && submitRelay()}
                placeholder="wss://relay.example.com"
                aria-invalid={relayError ? true : undefined}
                className={`${settingsInput} font-mono text-[0.86rem] ${relayError ? "border-red" : ""}`}
              />
            </Field>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setRelayMode(m.key)}
                  aria-pressed={relayMode === m.key}
                  className={`ds-press rounded-pill border-2 border-ink px-3.5 py-1.5 text-[0.78rem] font-bold ${
                    relayMode === m.key ? "bg-ink text-text-on-dark" : "bg-paper-pure"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button
              onClick={submitRelay}
              className="ds-press mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-pill border-2 border-ink bg-ink px-5 py-2.5 font-bold text-text-on-dark"
            >
              <Plus size={16} weight="bold" /> Add relay
            </button>
          </div>
        </SettingsSection>

        {/* -------------------------------------------------------- MINTS -- */}
        <SettingsSection title="Mints" note="Cashu · NIP-60">
          <div className="flex flex-col gap-2">
            {mints.map((m, i) => (
              <div key={m} className="flex items-center gap-3 rounded-lg border-2 border-ink bg-paper-pure p-3">
                <span className="min-w-0 flex-1 truncate font-mono text-[0.82rem] font-bold">{m}</span>
                {i === 0 && (
                  <span className="shrink-0 rounded-pill bg-green px-2.5 py-0.5 text-[0.6rem] font-bold text-ink">
                    Active
                  </span>
                )}
                <button
                  onClick={() => removeMint(m)}
                  aria-label={`Remove ${m}`}
                  className="ds-press grid h-9 w-9 shrink-0 place-items-center rounded-[8px] border-2 border-ink bg-paper-pure text-red"
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}
            {mints.length === 0 && (
              <EmptyState
                variant="inline"
                headline="No mints"
                body="Add a mint to hold ecash in the built-in wallet."
                className="!py-8"
              />
            )}
          </div>

          <div className="mt-3 rounded-lg border-2 border-ink bg-paper-pure p-3.5">
            <Field label="Add a mint" error={mintError ?? undefined}>
              <input
                value={mintUrl}
                onChange={(e) => { setMintUrl(e.target.value); if (mintError) setMintError(null); }}
                onKeyDown={(e) => e.key === "Enter" && submitMint()}
                placeholder="mint.example.com"
                aria-invalid={mintError ? true : undefined}
                className={`${settingsInput} font-mono text-[0.86rem] ${mintError ? "border-red" : ""}`}
              />
            </Field>
            <button
              onClick={submitMint}
              className="ds-press mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-pill border-2 border-ink bg-ink px-5 py-2.5 font-bold text-text-on-dark"
            >
              <Plus size={16} weight="bold" /> Add mint
            </button>
          </div>
        </SettingsSection>

        {/* ---------------------------------------------------- ADDRESSES -- */}
        <SettingsSection title="Saved addresses" note="Shipping">
          <div className="flex flex-col gap-2">
            {addresses.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg border-2 border-ink bg-paper-pure p-3">
                <span className="min-w-0 flex-1 leading-snug">
                  <span className="block font-bold">{a.label}</span>
                  <span className="mt-0.5 block text-[0.84rem] text-text-muted">
                    {a.name} · {a.line1}, {a.city} {a.zip}, {a.country}
                  </span>
                </span>
                <button
                  onClick={() => { setEditing(a); setAddrError(null); }}
                  className="ds-press shrink-0 rounded-pill border-2 border-ink bg-paper-pure px-3 py-1.5 text-[0.74rem] font-bold"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeAddress(a.id)}
                  aria-label={`Remove ${a.label}`}
                  className="ds-press grid h-9 w-9 shrink-0 place-items-center rounded-[8px] border-2 border-ink bg-paper-pure text-red"
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}
            {addresses.length === 0 && !editing && (
              <EmptyState
                variant="inline"
                headline="No addresses yet"
                body="Save one and checkout fills itself in."
                className="!py-8"
              />
            )}
          </div>

          {editing ? (
            <div className="mt-3 rounded-lg border-2 border-ink bg-paper-pure p-3.5">
              <div className="flex flex-col gap-3">
                <Field label="Label">
                  <input
                    value={editing.label}
                    onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                    placeholder="Home"
                    className={settingsInput}
                  />
                </Field>
                <Field label="Full name">
                  <input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="Ekko R."
                    className={settingsInput}
                  />
                </Field>
                <Field label="Street">
                  <input
                    value={editing.line1}
                    onChange={(e) => setEditing({ ...editing, line1: e.target.value })}
                    placeholder="Skalitzer Str. 12"
                    className={settingsInput}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City">
                    <input
                      value={editing.city}
                      onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                      placeholder="Berlin"
                      className={settingsInput}
                    />
                  </Field>
                  <Field label="Postcode">
                    <input
                      value={editing.zip}
                      onChange={(e) => setEditing({ ...editing, zip: e.target.value })}
                      placeholder="10997"
                      className={settingsInput}
                    />
                  </Field>
                </div>
                <Field label="Country">
                  <input
                    value={editing.country}
                    onChange={(e) => setEditing({ ...editing, country: e.target.value })}
                    placeholder="Germany"
                    className={settingsInput}
                  />
                </Field>
              </div>
              {addrError && (
                <p role="alert" className="mt-2 inline-flex items-start gap-1.5 text-[0.78rem] font-semibold text-red">
                  <WarningCircle size={15} weight="bold" className="mt-px shrink-0" /> {addrError}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={submitAddress}
                  className="ds-press inline-flex flex-1 items-center justify-center gap-1.5 rounded-pill border-2 border-ink bg-ink px-5 py-2.5 font-bold text-text-on-dark"
                >
                  <Check size={16} weight="bold" /> Save address
                </button>
                <button
                  onClick={() => { setEditing(null); setAddrError(null); }}
                  className="ds-press rounded-pill border-2 border-ink bg-paper-pure px-5 py-2.5 font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setEditing({ ...EMPTY_ADDRESS }); setAddrError(null); }}
              className="ds-press mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-pill border-2 border-ink bg-paper-pure px-5 py-2.5 font-bold"
            >
              <Plus size={16} weight="bold" /> Add an address
            </button>
          )}
        </SettingsSection>
      </SettingsShell>
    </>
  );
}

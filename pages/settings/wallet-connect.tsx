import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { CheckCircle, WarningCircle, Lightning } from "@phosphor-icons/react";
import { useSession } from "@/data/hooks";
import { groupInt } from "@/lib/format";
import { SettingsShell, Field, settingsInput } from "@/components/ui/SettingsShell";

/* Nostr Wallet Connect. Mirrors upstream's settings page: paste a connection
   string, validate it, connect, then show the live connection with its balance
   and a disconnect. Validation rules are upstream's, so the errors are real. */

function validateNwc(raw: string): string | null {
  const s = raw.trim();
  if (!s) return "Paste the connection string from your wallet.";
  if (!s.startsWith("nostr+walletconnect://"))
    return "That isn't a Nostr Wallet Connect string. It should start with nostr+walletconnect://";
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return "That string isn't a valid URL.";
  }
  const secret = url.searchParams.get("secret");
  if (!secret) return "The string is missing its secret parameter.";
  if (!/^[0-9a-f]{64}$/i.test(secret)) return "The secret must be 64 hexadecimal characters.";
  if (!url.searchParams.get("relay")) return "The string is missing its relay parameter.";
  return null;
}

export default function WalletConnect() {
  const { wallet, setupWallet, walletBalance } = useSession();
  const connected = wallet?.type === "nwc" ? wallet : null;

  const [nwc, setNwc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connect = () => {
    const problem = validateNwc(nwc);
    setError(problem);
    if (problem) return;
    setConnecting(true);
    setTimeout(() => {
      const relay = (() => {
        try {
          return new URL(nwc.trim()).searchParams.get("relay") ?? "external wallet";
        } catch {
          return "external wallet";
        }
      })();
      setupWallet({
        type: "nwc",
        connection: nwc.trim(),
        walletName: relay.replace(/^wss?:\/\//, ""),
      });
      setConnecting(false);
      setNwc("");
    }, 700);
  };

  return (
    <>
      <Head><title>Nostr Wallet Connect · Shopstr</title></Head>
      <SettingsShell
        title="Nostr Wallet Connect"
        lead="Pay from your own Lightning wallet instead of the built-in one. NIP-47."
      >
        {connected ? (
          <div className="rounded-lg border-2 border-ink bg-paper-pure p-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green text-ink">
                <CheckCircle size={20} weight="fill" />
              </span>
              <span className="min-w-0 flex-1 leading-snug">
                <span className="block font-bold">Connected</span>
                <span className="mt-0.5 block truncate font-mono text-[0.72rem] text-text-muted">
                  {connected.walletName}
                </span>
              </span>
            </div>
            <dl className="mt-3.5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border-2 border-ink bg-ink text-sm">
              <div className="bg-paper-pure p-3">
                <dt className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">Balance</dt>
                <dd className="mt-0.5 font-mono font-bold tabular-nums">{groupInt(walletBalance)} sats</dd>
              </div>
              <div className="bg-paper-pure p-3">
                <dt className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">Protocol</dt>
                <dd className="mt-0.5 font-medium">NIP-47</dd>
              </div>
            </dl>
            {/* Disconnecting drops back to the built-in wallet rather than
                leaving the user with no wallet at all. */}
            <button
              onClick={() => setupWallet({ type: "cashu", mint: "mint.minibits.cash" })}
              className="ds-press mt-3.5 w-full rounded-pill border-2 border-ink bg-paper-pure px-5 py-2.5 font-bold text-red"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="rounded-lg border-2 border-ink bg-paper-pure p-4">
            <Field
              label="Connection string"
              error={error ?? undefined}
              hint="In your wallet, create a new Nostr Wallet Connect connection and paste it here."
            >
              <textarea
                rows={3}
                value={nwc}
                onChange={(e) => { setNwc(e.target.value); if (error) setError(null); }}
                placeholder="nostr+walletconnect://..."
                aria-invalid={error ? true : undefined}
                className={`${settingsInput} resize-none break-all font-mono text-[0.78rem] ${error ? "border-red" : ""}`}
              />
            </Field>
            <button
              onClick={connect}
              disabled={connecting}
              className="ds-press mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-pill border-2 border-ink bg-ink px-5 py-3 font-bold text-text-on-dark disabled:opacity-50"
            >
              <Lightning size={17} weight="bold" /> {connecting ? "Connecting…" : "Connect wallet"}
            </button>
            <p className="mt-3 text-[0.8rem] text-text-muted">
              Prefer to keep it simple?{" "}
              <Link href="/wallet/setup" className="font-bold text-purple underline">
                Use the built-in wallet
              </Link>{" "}
              instead.
            </p>
          </div>
        )}
      </SettingsShell>
    </>
  );
}

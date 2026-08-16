import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { Lightning, Wallet as WalletIcon, Check, WarningCircle, ArrowLeft } from "@phosphor-icons/react";
import { useSession } from "@/data/hooks";
import { tEnter, tExit } from "@/lib/motion";
import { OneWayFrame, FlowLead } from "@/components/ui/OneWayFrame";

/* Wallet setup. Mirrors upstream's onboarding "Connect Wallet" step, which
   offers an NWC connection with an explicit skip, and extends it with the
   built-in NIP-60 Cashu path (upstream configures mints under Preferences).

   Three steps in one route so the flow is a single decision with a back door,
   rather than three URLs the user can land in halfway. */

type Step = "choose" | "cashu" | "nwc";

/** Mints offered for the built-in wallet. Same defaults upstream ships. */
const MINTS = [
  { url: "mint.minibits.cash", note: "Popular · fast" },
  { url: "mint.coinos.io", note: "Community run" },
  { url: "stablenut.umint.cash", note: "Stable" },
];

const inputCls =
  "w-full rounded-md border-2 border-ink bg-paper-pure px-3.5 py-3 text-[0.92rem] outline-none focus:border-purple";

/** Upstream validates the NWC string before trusting it: the scheme, a 64-hex
    secret, and a relay. Same rules here so the errors a user hits are real. */
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
  if (!/^[0-9a-f]{64}$/i.test(secret))
    return "The secret must be 64 hexadecimal characters.";
  if (!url.searchParams.get("relay"))
    return "The string is missing its relay parameter.";
  return null;
}

export default function WalletSetup() {
  const router = useRouter();
  const { setupWallet } = useSession();
  const [step, setStep] = useState<Step>("choose");

  const [mint, setMint] = useState(MINTS[0].url);
  const [nwc, setNwc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const finishCashu = () => {
    setupWallet({ type: "cashu", mint });
    router.push("/wallet");
  };

  const finishNwc = () => {
    const problem = validateNwc(nwc);
    setError(problem);
    if (problem) return;
    // Mock the round-trip upstream makes (enable + getInfo) so the button has
    // an honest pending state instead of resolving impossibly fast.
    setConnecting(true);
    setTimeout(() => {
      const host = (() => {
        try {
          return new URL(nwc.trim()).searchParams.get("relay") ?? "external wallet";
        } catch {
          return "external wallet";
        }
      })();
      setupWallet({ type: "nwc", connection: nwc.trim(), walletName: host.replace(/^wss?:\/\//, "") });
      router.push("/wallet");
    }, 700);
  };

  const stepMotion = {
    initial: { opacity: 0, transform: "translateY(8px)" },
    animate: { opacity: 1, transform: "translateY(0px)", transition: tEnter },
    exit: { opacity: 0, transform: "translateY(-6px)", transition: tExit },
  };

  return (
    <>
      <Head><title>Set up your wallet · Shopstr</title></Head>
      <OneWayFrame tone="purple" step="Wallet setup" sticker="shape-sunstar-yellow" closeTo="/wallet">
        <AnimatePresence mode="wait" initial={false}>
          {step === "choose" && (
            <motion.div key="choose" {...stepMotion}>
              <FlowLead>One-time setup</FlowLead>
              <h3 className="ds-display mt-2 text-2xl leading-[0.95]">How do you<br />want to hold sats?</h3>
              <div className="mt-4 flex flex-col gap-2.5">
                <button
                  onClick={() => { setStep("cashu"); setError(null); }}
                  className="ds-press flex items-center gap-3 rounded-lg border-2 border-ink bg-paper-pure p-3.5 text-left"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-green text-ink"><WalletIcon size={20} /></span>
                  <span className="min-w-0 flex-1 leading-snug">
                    <span className="block font-bold">
                      Built-in Shopstr wallet
                      <span className="ml-2 rounded-pill bg-purple px-2 py-0.5 align-middle text-[0.58rem] font-bold text-on-purple">Recommended</span>
                    </span>
                    <span className="mt-0.5 block font-mono text-[0.76rem] leading-snug opacity-70">
                      Ecash held in the app. Pay in one tap, no external app.
                    </span>
                  </span>
                </button>

                <button
                  onClick={() => { setStep("nwc"); setError(null); }}
                  className="ds-press flex items-center gap-3 rounded-lg border-2 border-ink bg-paper-pure p-3.5 text-left"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] border-2 border-current"><Lightning size={20} /></span>
                  <span className="min-w-0 flex-1 leading-snug">
                    <span className="block font-bold">Connect an existing wallet</span>
                    <span className="mt-0.5 block font-mono text-[0.76rem] leading-snug opacity-70">
                      Use your own Lightning wallet over Nostr Wallet Connect.
                    </span>
                  </span>
                </button>
              </div>
              {/* Upstream always offers a skip; browsing shouldn't require a wallet. */}
              <button
                onClick={() => router.push("/marketplace")}
                className="ds-press mt-4 w-full py-2 font-bold text-text-muted underline"
              >
                Skip for now
              </button>
            </motion.div>
          )}

          {step === "cashu" && (
            <motion.div key="cashu" {...stepMotion}>
              <FlowLead>Built-in wallet</FlowLead>
              <h3 className="ds-display mt-2 text-2xl leading-[0.95]">Pick a mint</h3>
              <p className="mt-2 text-[0.92rem] text-text-muted">
                A mint issues the ecash you hold. You can add or switch mints later in Preferences.
              </p>
              <div className="mt-4 flex flex-col gap-2.5">
                {MINTS.map((m) => (
                  <button
                    key={m.url}
                    onClick={() => setMint(m.url)}
                    aria-pressed={mint === m.url}
                    className={`ds-press flex items-center gap-3 rounded-lg border-2 border-ink p-3.5 text-left ${
                      mint === m.url ? "bg-ink text-text-on-dark" : "bg-paper-pure"
                    }`}
                  >
                    <span className="min-w-0 flex-1 leading-snug">
                      <span className="block font-mono text-[0.86rem] font-bold">{m.url}</span>
                      <span className="mt-0.5 block font-mono text-[0.72rem] leading-snug opacity-70">{m.note}</span>
                    </span>
                    {mint === m.url && <Check size={18} weight="bold" className="shrink-0" />}
                  </button>
                ))}
              </div>
              <button
                onClick={finishCashu}
                className="ds-press mt-4 w-full rounded-pill border-2 border-ink bg-ink px-6 py-3.5 font-bold text-text-on-dark"
              >
                Create wallet
              </button>
              <button
                onClick={() => setStep("choose")}
                className="ds-press mt-2 inline-flex w-full items-center justify-center gap-1.5 py-2 font-bold text-text-muted"
              >
                <ArrowLeft size={15} /> Back
              </button>
            </motion.div>
          )}

          {step === "nwc" && (
            <motion.div key="nwc" {...stepMotion}>
              <FlowLead>External wallet</FlowLead>
              <h3 className="ds-display mt-2 text-2xl leading-[0.95]">Connect over<br />NWC</h3>
              <p className="mt-2 text-[0.92rem] text-text-muted">
                In your Lightning wallet, create a Nostr Wallet Connect connection and paste the string here.
              </p>
              <label className="mt-4 flex flex-col gap-1.5">
                <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">
                  Connection string
                </span>
                <textarea
                  rows={3}
                  value={nwc}
                  onChange={(e) => { setNwc(e.target.value); if (error) setError(null); }}
                  placeholder="nostr+walletconnect://..."
                  aria-invalid={error ? true : undefined}
                  className={`${inputCls} resize-none break-all font-mono text-[0.78rem] ${error ? "border-red" : ""}`}
                />
              </label>
              {error && (
                <p role="alert" className="mt-2 inline-flex items-start gap-1.5 text-[0.8rem] font-semibold text-red">
                  <WarningCircle size={16} weight="bold" className="mt-px shrink-0" />
                  <span>{error}</span>
                </p>
              )}
              <button
                onClick={finishNwc}
                disabled={connecting}
                className="ds-press mt-4 w-full rounded-pill border-2 border-ink bg-ink px-6 py-3.5 font-bold text-text-on-dark disabled:opacity-50"
              >
                {connecting ? "Connecting…" : "Connect wallet"}
              </button>
              <button
                onClick={() => setStep("choose")}
                className="ds-press mt-2 inline-flex w-full items-center justify-center gap-1.5 py-2 font-bold text-text-muted"
              >
                <ArrowLeft size={15} /> Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </OneWayFrame>
    </>
  );
}

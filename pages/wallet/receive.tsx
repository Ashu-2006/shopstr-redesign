import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Lightning, WarningCircle, Check } from "@phosphor-icons/react";
import { useSession } from "@/data/hooks";
import { groupInt } from "@/lib/format";
import { OneWayFrame, FlowLead } from "@/components/ui/OneWayFrame";

const inputCls =
  "w-full rounded-md border-2 border-ink bg-paper-pure px-3.5 py-3 text-[0.92rem] outline-none focus:border-purple";

export default function Receive() {
  const router = useRouter();
  const { walletReceive } = useSession();

  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const amountNum = Number(amount.replace(/[,\s]/g, ""));
  const hasAmount = amount.trim().length > 0;

  /** Copy is the real action for a zero-amount invoice; with an amount we also
      credit the ledger, which is how a paid invoice would land. */
  const submit = () => {
    if (hasAmount) {
      if (!Number.isFinite(amountNum) || amountNum <= 0) {
        setError("Enter an amount in whole sats.");
        return;
      }
      if (!Number.isInteger(amountNum)) {
        setError("Sats can't be fractional.");
        return;
      }
      walletReceive(amountNum, { kind: "mint", title: "Invoice paid", sub: "Lightning · Cashu mint" });
      router.push("/wallet");
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <>
      <Head><title>Receive sats · Shopstr</title></Head>
      <OneWayFrame tone="green" step="Receive sats" closeTo="/wallet">
        <FlowLead>Show this to the sender</FlowLead>
        <h3 className="ds-display mt-2 text-2xl leading-[0.95]">Receive</h3>
        <div
          className="mx-auto mt-4 grid h-[200px] w-[200px] place-items-center rounded-lg border-2 border-ink"
          style={{
            background:
              "conic-gradient(from 0deg,#121212 0 25%,#fff 0 50%,#121212 0 75%,#fff 0),repeating-conic-gradient(#121212 0 12.5%,#fff 0 25%)",
            backgroundSize: "24px 24px",
          }}
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-ink bg-white text-purple"><Lightning size={24} /></span>
        </div>
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">Or request an amount</span>
          <input
            value={amount}
            onChange={(e) => { setAmount(e.target.value); if (error) setError(null); }}
            inputMode="numeric"
            placeholder="Amount in sats"
            aria-invalid={error ? true : undefined}
            className={`${inputCls} font-mono tabular-nums ${error ? "border-red" : ""}`}
          />
          {error && (
            <span role="alert" className="inline-flex items-start gap-1.5 text-[0.78rem] font-semibold text-red">
              <WarningCircle size={15} weight="bold" className="mt-px shrink-0" />
              {error}
            </span>
          )}
        </label>
        <button
          onClick={submit}
          className="ds-press mt-4 inline-flex w-full items-center justify-center gap-2 rounded-pill border-2 border-ink bg-ink px-6 py-3.5 font-bold text-text-on-dark"
        >
          {hasAmount ? (
            `Request ${groupInt(Number.isFinite(amountNum) ? amountNum : 0)} sats`
          ) : copied ? (
            <><Check size={18} weight="bold" /> Copied</>
          ) : (
            "Copy invoice"
          )}
        </button>
      </OneWayFrame>
    </>
  );
}

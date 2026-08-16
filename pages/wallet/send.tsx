import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { WarningCircle } from "@phosphor-icons/react";
import { useSession } from "@/data/hooks";
import { groupInt } from "@/lib/format";
import { OneWayFrame, FlowLead } from "@/components/ui/OneWayFrame";

const inputCls =
  "w-full rounded-md border-2 border-ink bg-paper-pure px-3.5 py-3 text-[0.92rem] outline-none focus:border-purple";

/** A Lightning destination is either an address (user@host) or an invoice
    (lnbc…). Shape-checked only: we can't resolve either in a mock. */
function validateDest(raw: string): string | null {
  const s = raw.trim();
  if (!s) return "Enter a Lightning address or invoice.";
  const isAddress = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  const isInvoice = /^ln(bc|tb)[0-9a-z]+$/i.test(s);
  if (!isAddress && !isInvoice)
    return "That doesn't look like a Lightning address (you@wallet.com) or an invoice (lnbc…).";
  return null;
}

export default function Send() {
  const router = useRouter();
  const { walletBalance, walletSend } = useSession();

  const [dest, setDest] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<{ dest?: string; amount?: string }>({});
  const [sending, setSending] = useState(false);

  const amountNum = Number(amount.replace(/[,\s]/g, ""));

  const submit = () => {
    const destError = validateDest(dest);
    // Specific amount errors: a user who overspends should be told by how much,
    // not handed a generic "invalid".
    let amountError: string | undefined;
    if (!amount.trim()) amountError = "Enter an amount.";
    else if (!Number.isFinite(amountNum) || amountNum <= 0) amountError = "Enter an amount in whole sats.";
    else if (!Number.isInteger(amountNum)) amountError = "Sats can't be fractional.";
    else if (amountNum > walletBalance)
      amountError = `Not enough sats. You have ${groupInt(walletBalance)}.`;

    setErrors({ dest: destError ?? undefined, amount: amountError });
    if (destError || amountError) return;

    setSending(true);
    const ok = walletSend(amountNum, {
      kind: "melt",
      title: "Sent to Lightning",
      sub: `To ${dest.trim()}`,
    });
    if (!ok) {
      // Belt and braces: the ledger refused (balance moved under us).
      setSending(false);
      setErrors({ amount: `Not enough sats. You have ${groupInt(walletBalance)}.` });
      return;
    }
    router.push("/wallet/withdraw");
  };

  return (
    <>
      <Head><title>Send sats · Shopstr</title></Head>
      <OneWayFrame tone="purple" step="Send sats" closeTo="/wallet">
        <FlowLead>From your Cashu balance · {groupInt(walletBalance)} sats</FlowLead>
        <h3 className="ds-display mt-2 text-2xl leading-[0.95]">Send</h3>
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">
              Lightning address or invoice
            </span>
            <input
              value={dest}
              onChange={(e) => { setDest(e.target.value); if (errors.dest) setErrors((p) => ({ ...p, dest: undefined })); }}
              placeholder="name@walletofsatoshi.com"
              aria-invalid={errors.dest ? true : undefined}
              className={`${inputCls} ${errors.dest ? "border-red" : ""}`}
            />
            {errors.dest && (
              <span role="alert" className="inline-flex items-start gap-1.5 text-[0.78rem] font-semibold text-red">
                <WarningCircle size={15} weight="bold" className="mt-px shrink-0" />
                {errors.dest}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">Amount (sats)</span>
            <input
              value={amount}
              onChange={(e) => { setAmount(e.target.value); if (errors.amount) setErrors((p) => ({ ...p, amount: undefined })); }}
              inputMode="numeric"
              placeholder="0"
              aria-invalid={errors.amount ? true : undefined}
              className={`${inputCls} font-mono text-xl font-bold tabular-nums ${errors.amount ? "border-red" : ""}`}
            />
            {errors.amount ? (
              <span role="alert" className="inline-flex items-start gap-1.5 text-[0.78rem] font-semibold text-red">
                <WarningCircle size={15} weight="bold" className="mt-px shrink-0" />
                {errors.amount}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setAmount(String(walletBalance))}
                className="self-start font-mono text-[0.7rem] font-bold text-purple underline"
              >
                Send max · {groupInt(walletBalance)}
              </button>
            )}
          </label>
        </div>
        <button
          onClick={submit}
          disabled={sending}
          className="ds-press mt-4 w-full rounded-pill border-2 border-ink bg-ink px-6 py-3.5 font-bold text-text-on-dark disabled:opacity-50"
        >
          {sending ? "Sending…" : "Withdraw to Lightning ↗"}
        </button>
      </OneWayFrame>
    </>
  );
}

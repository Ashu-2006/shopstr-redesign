import { useEffect, useRef, useState, type ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useCartStore, useCheckout } from "@/data/hooks";
import { groupInt } from "@/lib/format";
import { OneWayFrame, FlowLead } from "@/components/ui/OneWayFrame";

const SHIPPING = 4000;
type Step = "type" | "ship" | "pickup" | "account" | "pay" | "review";
const INDEX: Record<Step, number> = { type: 0, ship: 1, pickup: 1, account: 2, pay: 3, review: 4 };

const goStep = (router: ReturnType<typeof useRouter>, step: Step) =>
  router.push(`/checkout?step=${step}`, undefined, { shallow: true });

/* ------------------------------------------------------------------ icons -- */
const ic = "shrink-0";
const Box = () => (<svg className={ic} width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M4 7.5l8 4.5 8-4.5M12 12v9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>);
const Pin = () => (<svg className={ic} width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="2" /></svg>);
const Lock = () => (<svg className={ic} width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="2" /></svg>);
const Bolt = () => (<svg className={ic} width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M13 3L5 13h5l-1 8 8-11h-5l1-7z" fill="currentColor" /></svg>);
const Key = () => (<svg className={ic} width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="8" r="4" stroke="currentColor" strokeWidth="2" /><path d="M11 11l8 8M16 16l2-2M18 18l2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>);
const Spark = () => (<svg className={ic} width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2 2-8z" fill="currentColor" /></svg>);

/* ------------------------------------------------------------- primitives -- */
const inputBase = "rounded-md border-2 px-3.5 py-3 text-[0.92rem] outline-none w-full bg-paper-pure";
function Field({ label, invalid, children }: { label: string; invalid?: boolean; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">{label}</span>
      {children}
      {invalid && <span className="font-mono text-[0.66rem] text-red">Required</span>}
    </label>
  );
}
function WideBtn({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="ds-press w-full rounded-pill border-2 border-ink bg-ink px-6 py-3.5 font-bold text-text-on-dark disabled:opacity-40">
      {children}
    </button>
  );
}
function Nav({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <span className="font-mono text-sm text-text-muted">{label}</span>
      {children}
    </div>
  );
}
function OptCard({ selected, onClick, icon, title, sub }: { selected: boolean; onClick: () => void; icon: ReactNode; title: string; sub: string }) {
  return (
    <button onClick={onClick} className={`ds-press flex items-center gap-3 rounded-lg border-2 border-ink p-3.5 text-left ${selected ? "bg-ink text-text-on-dark" : "bg-paper-pure"}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] border-2 border-current">{icon}</span>
      <span className="leading-tight">
        <span className="font-bold">{title}</span>
        <br />
        <span className="font-mono text-[0.76rem] opacity-70">{sub}</span>
      </span>
    </button>
  );
}
function NextCircle({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Continue" className="ds-press grid h-[54px] w-[54px] place-items-center rounded-full bg-ink text-text-on-dark">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 12h13M12 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );
}

const slide = {
  enter: (d: number) => ({ x: d > 0 ? 26 : -26, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -26 : 26, opacity: 0 }),
};

export default function Checkout() {
  const router = useRouter();
  const step = (typeof router.query.step === "string" ? router.query.step : "type") as Step;
  const cart = useCartStore();
  const { draft, set } = useCheckout();
  const total = cart.subtotal + SHIPPING;

  // Direction for the slide: compare this step's index with the previous render's.
  const prevIdx = useRef(0);
  const idx = INDEX[step] ?? 0;
  const dir = idx >= prevIdx.current ? 1 : -1;
  prevIdx.current = idx;

  // Edge case: nothing to check out.
  if (cart.count === 0) {
    return (
      <>
        <Head><title>Checkout · Shopstr</title></Head>
        <OneWayFrame tone="purple" step="Checkout" closeTo="/marketplace">
          <FlowLead>Nothing to pay for</FlowLead>
          <h3 className="ds-display mt-2 text-2xl leading-[0.95]">Your cart<br />is empty</h3>
          <p className="mt-2 text-[0.92rem] text-text-muted">Add something worth keeping, then come back to check out in sats.</p>
          <Link href="/marketplace" className="ds-press mt-4 block w-full rounded-pill border-2 border-ink bg-ink py-3.5 text-center font-bold text-text-on-dark">
            Browse the market
          </Link>
        </OneWayFrame>
      </>
    );
  }

  const prevHref: Record<Step, string> = {
    type: "/cart",
    ship: "/checkout?step=type",
    pickup: "/checkout?step=type",
    account: `/checkout?step=${draft.fulfilment === "pickup" ? "pickup" : "ship"}`,
    pay: "/checkout?step=account",
    review: "/checkout?step=pay",
  };

  return (
    <>
      <Head><title>Checkout · Shopstr</title></Head>
      <OneWayFrame tone="purple" step="Checkout" current={idx + 1} total={5} closeTo={prevHref[step]}>
        <AnimatePresence mode="popLayout" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
          >
            {step === "type" && (
              <>
                <FlowLead>Step 1 of 5 · how do you want it</FlowLead>
                <h3 className="ds-display mt-2 text-2xl leading-[0.95]">Ship it or<br />pick it up?</h3>
                <div className="mt-4 flex flex-col gap-2.5">
                  <OptCard selected={draft.fulfilment === "ship"} onClick={() => set("fulfilment", "ship")} icon={<Box />} title="Ship to me" sub="Enter an address · tracked delivery" />
                  <OptCard selected={draft.fulfilment === "pickup"} onClick={() => set("fulfilment", "pickup")} icon={<Pin />} title="Local pickup" sub="Arrange a spot over DM" />
                </div>
                <Nav label="01 / 05">
                  <NextCircle onClick={() => goStep(router, draft.fulfilment === "pickup" ? "pickup" : "ship")} />
                </Nav>
              </>
            )}

            {step === "ship" && <ShipStep />}

            {step === "pickup" && (
              <>
                <FlowLead>Step 2 of 5 · pickup details</FlowLead>
                <h3 className="ds-display mt-2 text-2xl leading-[0.95]">How to<br />reach you</h3>
                <div className="mt-4 flex flex-col gap-3">
                  <Field label="Display name"><input className={`${inputBase} border-ink focus:border-purple`} value={draft.name} onChange={(e) => set("name", e.target.value)} /></Field>
                  <Field label="Note to seller (optional)"><textarea rows={3} className={`${inputBase} border-ink focus:border-purple`} value={draft.note} onChange={(e) => set("note", e.target.value)} placeholder="Can pick up evenings near Görlitzer Park." /></Field>
                  <div className="flex items-start gap-2.5 rounded-md border-2 border-ink bg-yellow-soft p-2.5 text-[0.8rem]"><span className="mt-0.5"><Spark /></span><span>You&apos;ll agree a time and place with the seller in an encrypted DM after payment.</span></div>
                </div>
                <Nav label="02 / 05"><NextCircle onClick={() => goStep(router, "account")} /></Nav>
              </>
            )}

            {step === "account" && (
              <>
                <FlowLead>Step 3 of 5 · secure your account</FlowLead>
                <h3 className="ds-display mt-2 text-2xl leading-[0.95]">Save your<br />account</h3>
                <p className="mt-2 text-[0.92rem] text-text-muted">A key was created for you in the background. Set a passphrase so you can get back to your orders and sats on any device.</p>
                <div className="mt-4 flex flex-col gap-3">
                  <Field label="Passphrase"><input type="password" defaultValue="············" className={`${inputBase} border-ink focus:border-purple`} /></Field>
                  <WideBtn onClick={() => goStep(router, "pay")}>Save &amp; continue →</WideBtn>
                </div>
                <div className="mt-3 flex items-center justify-between font-mono text-sm text-text-muted">
                  <span>03 / 05</span>
                  <span className="inline-flex items-center gap-1.5"><Key /> npub1ekko…q8r7</span>
                </div>
              </>
            )}

            {step === "pay" && (
              <>
                <FlowLead>Step 4 of 5 · pay {groupInt(total)} sats</FlowLead>
                <PayStep pay={draft.pay} onPay={(p) => set("pay", p)} onPaid={() => goStep(router, "review")} />
                <div className="mt-3 flex items-center justify-between font-mono text-sm text-text-muted">
                  <span>04 / 05</span>
                  <span className="tabular-nums">{groupInt(total)} sats</span>
                </div>
              </>
            )}

            {step === "review" && (
              <>
                <FlowLead>Step 5 of 5 · confirm</FlowLead>
                <h3 className="ds-display mt-2 text-2xl leading-[0.95]">Review &amp;<br />confirm</h3>
                <div className="mt-4">
                  {[
                    ["Seller", `@${cart.items[0]?.product.pubkey.replace("pk_", "") ?? "ekko"}`],
                    ["Items", String(cart.count)],
                    ["Fulfilment", draft.fulfilment === "pickup" ? "Local pickup" : "Shipping"],
                    ["Payment", draft.pay === "cashu" ? "Cashu" : "Lightning"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b-2 border-paper-2 py-2.5 text-[0.92rem]"><span className="text-text-muted">{k}</span><span>{v}</span></div>
                  ))}
                  <div className="flex justify-between py-2.5 text-[0.92rem]"><span className="text-text-muted">Total</span><span className="font-mono font-bold tabular-nums">{groupInt(total)} sats</span></div>
                </div>
                <div className="mt-3">
                  <WideBtn onClick={() => router.push("/paid")}><span className="inline-flex items-center gap-2">Place order <Spark /></span></WideBtn>
                </div>
                <span className="mt-4 block font-mono text-sm text-text-muted">05 / 05</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </OneWayFrame>
    </>
  );
}

/* Shipping step with field validation + a shake on invalid submit (edge case). */
function ShipStep() {
  const router = useRouter();
  const { draft, set } = useCheckout();
  const controls = useAnimationControls();
  const [errs, setErrs] = useState<Record<string, boolean>>({});

  const fieldCls = (k: string) => `${inputBase} ${errs[k] ? "border-red" : "border-ink focus:border-purple"}`;

  const submit = () => {
    const e: Record<string, boolean> = {};
    if (!draft.name.trim()) e.name = true;
    if (!draft.address.trim()) e.address = true;
    if (!draft.city.trim()) e.city = true;
    if (!draft.zip.trim()) e.zip = true;
    if (Object.keys(e).length) {
      setErrs(e);
      controls.start({ x: [0, -8, 8, -6, 6, 0], transition: { duration: 0.4 } });
      return;
    }
    setErrs({});
    goStep(router, "account");
  };

  return (
    <motion.div animate={controls}>
      <FlowLead>Step 2 of 5 · where to</FlowLead>
      <h3 className="ds-display mt-2 text-2xl leading-[0.95]">Shipping<br />address</h3>
      <div className="mt-4 flex flex-col gap-3">
        <Field label="Full name" invalid={errs.name}><input className={fieldCls("name")} value={draft.name} onChange={(e) => { set("name", e.target.value); setErrs((p) => ({ ...p, name: false })); }} /></Field>
        <Field label="Address" invalid={errs.address}><input className={fieldCls("address")} value={draft.address} onChange={(e) => { set("address", e.target.value); setErrs((p) => ({ ...p, address: false })); }} /></Field>
        <div className="flex gap-2.5">
          <div className="flex-1"><Field label="City" invalid={errs.city}><input className={fieldCls("city")} value={draft.city} onChange={(e) => { set("city", e.target.value); setErrs((p) => ({ ...p, city: false })); }} /></Field></div>
          <div className="w-28"><Field label="Postcode" invalid={errs.zip}><input className={fieldCls("zip")} value={draft.zip} onChange={(e) => { set("zip", e.target.value); setErrs((p) => ({ ...p, zip: false })); }} /></Field></div>
        </div>
        <div className="flex items-start gap-2.5 rounded-md border-2 border-ink bg-yellow-soft p-2.5 text-[0.8rem]"><span className="mt-0.5"><Lock /></span><span>Your address is end-to-end encrypted and sent to the seller as a one-time DM. Shopstr never stores it.</span></div>
      </div>
      <Nav label="02 / 05"><NextCircle onClick={submit} /></Nav>
    </motion.div>
  );
}

/* Lightning QR with a live countdown, an explicit EXPIRED state + regenerate
   (edge case), and a brief "confirming payment" transient after "I've paid". */
function PayStep({ pay, onPay, onPaid }: { pay: "lightning" | "cashu"; onPay: (p: "lightning" | "cashu") => void; onPaid: () => void }) {
  const [secs, setSecs] = useState(298);
  const [expired, setExpired] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (pay !== "lightning" || expired || confirming) return;
    const id = window.setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [pay, expired, confirming]);

  useEffect(() => {
    if (secs === 0 && !expired) setExpired(true);
  }, [secs, expired]);

  // Auto-regenerate a fresh invoice a moment after it lapses.
  useEffect(() => {
    if (!expired) return;
    const t = window.setTimeout(() => { setSecs(298); setExpired(false); }, 2800);
    return () => window.clearTimeout(t);
  }, [expired]);

  const regen = () => { setSecs(298); setExpired(false); };
  const pay_ = () => { setConfirming(true); window.setTimeout(onPaid, 1100); };
  const mm = Math.floor(secs / 60);
  const ss = String(secs % 60).padStart(2, "0");

  if (confirming) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 0.9 }} className="grid h-12 w-12 place-items-center rounded-full border-[3px] border-ink border-t-transparent" />
        <div className="font-bold">Confirming payment…</div>
        <p className="text-center text-[0.84rem] text-text-muted">Waiting for the network to confirm. This is usually instant.</p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex overflow-hidden rounded-pill border-2 border-ink">
        {(["lightning", "cashu"] as const).map((p) => (
          <button key={p} onClick={() => onPay(p)} className={`flex-1 py-3 font-bold ${pay === p ? "bg-ink text-text-on-dark" : "bg-paper-pure"}`}>
            {p === "lightning" ? "Lightning ⚡" : "Cashu token"}
          </button>
        ))}
      </div>

      {pay === "lightning" ? (
        <div className="mt-4">
          <div className="relative mx-auto h-[200px] w-[200px]">
            <div
              className={`grid h-full w-full place-items-center rounded-lg border-2 border-ink transition-[filter,opacity] duration-300 ${expired ? "opacity-30 blur-[2px]" : ""}`}
              style={{ background: "conic-gradient(from 0deg,#121212 0 25%,#fff 0 50%,#121212 0 75%,#fff 0),repeating-conic-gradient(#121212 0 12.5%,#fff 0 25%)", backgroundSize: "24px 24px" }}
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-ink bg-white text-purple"><Bolt /></span>
            </div>
            {expired && (
              <div className="absolute inset-0 grid place-items-center">
                <span className="rounded-pill border-2 border-ink bg-red px-3 py-1.5 font-mono text-[0.7rem] font-bold uppercase tracking-wide">Expired</span>
              </div>
            )}
          </div>

          {expired ? (
            <div className="mt-3 text-center">
              <div className="font-mono font-bold text-red">Invoice expired</div>
              <p className="mt-1 text-[0.82rem] text-text-muted">Refreshing automatically — or generate one now.</p>
              <button onClick={regen} className="ds-press mt-2.5 inline-flex items-center gap-2 rounded-pill border-2 border-ink bg-paper-pure px-4 py-2.5 font-bold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 11a8 8 0 10-2.3 5.7M20 5v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Generate fresh invoice
              </button>
            </div>
          ) : (
            <>
              <div className="mt-2.5 text-center font-mono font-bold tabular-nums">Invoice expires in {`0${mm}:${ss}`}</div>
              <p className="mt-1.5 text-center text-[0.84rem] text-text-muted">Scan with any Lightning wallet. Auto-confirms on payment.</p>
            </>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <textarea rows={4} placeholder="Paste your Cashu token (cashuA…)" className="w-full resize-none rounded-lg border-2 border-dashed border-ink bg-paper-pure p-3.5 font-mono text-[0.8rem] text-text-muted outline-none" />
          <p className="mt-2 text-[0.84rem] text-text-muted">We&apos;ll redeem the token at the seller&apos;s mint and confirm instantly.</p>
        </div>
      )}

      <button onClick={pay_} disabled={pay === "lightning" && expired} className="ds-press mt-4 w-full rounded-pill border-2 border-ink bg-ink px-6 py-3.5 font-bold text-text-on-dark disabled:opacity-40">
        I&apos;ve paid →
      </button>
    </div>
  );
}

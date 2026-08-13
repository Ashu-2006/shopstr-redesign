import { useEffect, useRef, useState, type ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { shake, tEnter, tExit } from "@/lib/motion";
import { Package, MapPin, Lock, Lightning, Key, Sparkle, ArrowsClockwise } from "@phosphor-icons/react";
import { useCartStore, useCheckout } from "@/data/hooks";
import type { CartItem } from "@/data/types";
import { cartFulfilmentOptions, effectiveShippingCost } from "@/lib/fulfilment";
import { satsFor } from "@/lib/money";
import { groupInt } from "@/lib/format";
import { OneWayFrame, FlowLead } from "@/components/ui/OneWayFrame";
import { CheckoutSummary } from "@/components/CheckoutSummary";

/* Order of the flow. Review comes BEFORE pay: in a sats checkout the payment
   IS the order placement, so everything must be confirmable first, and the
   pay step is terminal (it resolves straight into /paid). */
type Step = "type" | "ship" | "pickup" | "account" | "review" | "pay";
const INDEX: Record<Step, number> = { type: 0, ship: 1, pickup: 1, account: 2, review: 3, pay: 4 };

const goStep = (router: ReturnType<typeof useRouter>, step: Step) =>
  router.push(`/checkout?step=${step}`, undefined, { shallow: true });

/* ------------------------------------------------------------------ icons -- */
const ic = "shrink-0";
const Box = () => <Package className={ic} size={20} />;
const Pin = () => <MapPin className={ic} size={20} />;
const LockIcon = () => <Lock className={ic} size={14} />;
const Bolt = () => <Lightning className={ic} size={18} />;
const KeyIcon = () => <Key className={ic} size={14} />;
const Spark = () => <Sparkle className={ic} size={16} />;

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
/** The one CTA shape in this flow. Lives in the panel's docked footer. */
function WideBtn({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="ds-press w-full rounded-pill border-2 border-ink bg-ink px-6 py-3.5 font-bold text-text-on-dark disabled:opacity-40">
      {children}
    </button>
  );
}
/** Fine print under a footer CTA. Tight leading: it is a caption, not prose. */
function FootNote({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <p className="mt-2.5 flex items-start gap-1.5 font-mono text-[0.62rem] leading-[1.35] text-text-subtle">
      <span className="mt-px shrink-0">{icon}</span>
      <span>{children}</span>
    </p>
  );
}
function OptCard({ selected, onClick, icon, title, sub }: { selected: boolean; onClick: () => void; icon: ReactNode; title: string; sub: string }) {
  return (
    <button onClick={onClick} className={`ds-press flex items-center gap-3 rounded-lg border-2 border-ink p-3.5 text-left ${selected ? "bg-ink text-text-on-dark" : "bg-paper-pure"}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border-2 border-current">{icon}</span>
      <span className="leading-tight">
        <span className="font-bold">{title}</span>
        <br />
        <span className="font-mono text-[0.76rem] opacity-70">{sub}</span>
      </span>
    </button>
  );
}
/** Review row: a labeled fact with an Edit link back into its step. */
function ReviewRow({ label, onEdit, children }: { label: string; onEdit?: () => void; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b-2 border-paper-2 py-3 text-[0.9rem]">
      <div className="min-w-0">
        <div className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">{label}</div>
        <div className="mt-0.5 leading-snug">{children}</div>
      </div>
      {onEdit && (
        <button onClick={onEdit} className="ds-press shrink-0 font-mono text-[0.7rem] font-bold text-purple underline">
          Edit
        </button>
      )}
    </div>
  );
}

/* Step change = a content crossfade with a short rise, per the motion system
   (tEnter in, tExit out). Deliberately NOT a horizontal slide with popLayout:
   that fought the panel's own layout animation and read as a lurch. The panel
   is now fixed-height, so only the content inside it moves. */
const stepMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: tEnter },
  exit: { opacity: 0, y: -6, transition: tExit },
};

export default function Checkout() {
  const router = useRouter();
  const step = (typeof router.query.step === "string" ? router.query.step : "type") as Step;
  const cart = useCartStore();
  const { draft, set } = useCheckout();

  // What this cart is actually allowed to do: only the options EVERY item
  // supports. A "Pickup" listing can never be shipped, so offering the choice
  // would be a lie the seller can't honour.
  const options = cartFulfilmentOptions(cart.items.map((i) => i.product));
  // Keep the draft honest if the cart changed under it.
  const fulfilment: "ship" | "pickup" =
    !options.canShip ? "pickup" : !options.canPickup ? "ship" : draft.fulfilment;

  // Real money math: per-line shipping from the listings themselves, through
  // the same zero-cost rules upstream enforces (only "Added Cost" ever charges).
  const shipping =
    fulfilment === "pickup"
      ? 0
      : cart.items.reduce(
          (s, i) => s + (effectiveShippingCost(i.product.shippingType, i.product.shippingCost) ?? 0),
          0
        );
  const total = cart.subtotal + shipping;

  // Collection points the seller actually declared, deduped across the cart.
  const pickupChoices = Array.from(
    new Set(cart.items.flatMap((i) => i.product.pickupLocations ?? []))
  );

  const idx = INDEX[step] ?? 0;

  // Each step change scrolls the panel's scroll region back to the top.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const region = scrollRef.current?.closest(".overflow-y-auto");
    if (region) region.scrollTop = 0;
  }, [step]);

  // Edge case: nothing to check out. No context header, so the plain card layout.
  if (cart.count === 0) {
    return (
      <>
        <Head><title>Checkout · Shopstr</title></Head>
        <OneWayFrame tone="purple" step="Checkout" closeTo="/marketplace">
          <FlowLead>Nothing to pay for</FlowLead>
          <h3 className="ds-display mt-2 text-2xl leading-[0.95] lg:text-3xl">Your cart<br />is empty</h3>
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
    review: "/checkout?step=account",
    pay: "/checkout?step=review",
  };

  /* ---- Step content and its docked footer, chosen together. ---- */

  let body: ReactNode = null;
  let footer: ReactNode = null;

  if (step === "type") {
    body = (
      <>
        <FlowLead>Step 1 of 5 · fulfilment</FlowLead>
        <h3 className="ds-display mt-2 text-2xl leading-[0.95] lg:text-3xl">Ship it or<br />pick it up?</h3>
        <div className="mt-4 flex flex-col gap-2.5">
          {options.canShip && (
            <OptCard selected={fulfilment === "ship"} onClick={() => set("fulfilment", "ship")} icon={<Box />} title="Ship to me" sub="Enter an address · tracked delivery" />
          )}
          {options.canPickup && (
            <OptCard selected={fulfilment === "pickup"} onClick={() => set("fulfilment", "pickup")} icon={<Pin />} title="Collect in person" sub="Arrange a spot over DM · no shipping cost" />
          )}
        </div>
        {/* When the cart leaves no choice, say why instead of showing one lonely
            option with no explanation. */}
        {(!options.canShip || !options.canPickup) && (
          <p className="mt-3 font-mono text-[0.7rem] leading-snug text-text-muted">
            {!options.canShip
              ? "Everything in your basket is collection only, so there is nothing to post."
              : "These items are posted by the seller and cannot be collected."}
          </p>
        )}
      </>
    );
    footer = <WideBtn onClick={() => goStep(router, fulfilment === "pickup" ? "pickup" : "ship")}>Continue →</WideBtn>;
  }

  if (step === "ship") {
    return (
      <>
        <Head><title>Checkout · Shopstr</title></Head>
        <ShipStep
          idx={idx}
          closeTo={prevHref.ship}
          summary={<CheckoutSummary items={cart.items} shipping={shipping} fulfilment={draft.fulfilment} />}
        />
      </>
    );
  }

  if (step === "pickup") {
    body = (
      <>
        <FlowLead>Step 2 of 5 · pickup details</FlowLead>
        <h3 className="ds-display mt-2 text-2xl leading-[0.95] lg:text-3xl">How to<br />reach you</h3>
        <div className="mt-4 flex flex-col gap-3">
          {/* The seller declares where collection happens; the buyer picks one.
              Upstream requires this whenever the type allows pickup. */}
          {pickupChoices.length > 0 && (
            <Field label="Collection point">
              <div className="flex flex-col gap-2">
                {pickupChoices.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => set("pickupLocation", loc)}
                    aria-pressed={draft.pickupLocation === loc}
                    className={`ds-press flex items-center gap-2.5 rounded-md border-2 px-3 py-2.5 text-left text-[0.9rem] font-semibold ${
                      draft.pickupLocation === loc ? "border-purple bg-purple-soft" : "border-ink bg-paper-pure"
                    }`}
                  >
                    <Pin /> {loc}
                  </button>
                ))}
              </div>
            </Field>
          )}
          <Field label="Contact name"><input className={`${inputBase} border-ink focus:border-purple`} value={draft.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="How should they reach you?">
            {/* min-w-0 on the flex child: without it the input's intrinsic width
                pushes past the panel and clips. */}
            <div className="flex gap-2">
              <select
                aria-label="Contact type"
                className={`${inputBase} !w-[7.5rem] shrink-0 border-ink focus:border-purple`}
                value={draft.contactType}
                onChange={(e) => set("contactType", e.target.value as typeof draft.contactType)}
              >
                <option value="nostr">Nostr DM</option>
                <option value="phone">Phone</option>
                <option value="signal">Signal</option>
              </select>
              <input
                aria-label="Contact"
                className={`${inputBase} !w-auto min-w-0 flex-1 border-ink focus:border-purple`}
                value={draft.contact}
                onChange={(e) => set("contact", e.target.value)}
                placeholder={draft.contactType === "nostr" ? "npub1… or leave blank" : "+351 …"}
              />
            </div>
          </Field>
          <Field label="Instructions for the seller"><textarea rows={3} className={`${inputBase} border-ink focus:border-purple`} value={draft.note} onChange={(e) => set("note", e.target.value)} placeholder="Evenings work best, I can come by after 6pm." /></Field>
          <div className="flex items-start gap-2.5 rounded-md border-2 border-ink bg-yellow-soft p-2.5 text-[0.8rem] leading-snug"><span className="mt-0.5"><Spark /></span><span>You&apos;ll agree a time and place with the seller in an encrypted DM after payment.</span></div>
        </div>
      </>
    );
    footer = <WideBtn onClick={() => goStep(router, "account")}>Continue →</WideBtn>;
  }

  if (step === "account") {
    body = (
      <>
        <FlowLead>Step 3 of 5 · secure your account</FlowLead>
        <h3 className="ds-display mt-2 text-2xl leading-[0.95] lg:text-3xl">Save your<br />account</h3>
        <p className="mt-2 text-[0.92rem] leading-snug text-text-muted">A key was created for you in the background. Set a passphrase so you can get back to your orders and sats on any device.</p>
        <div className="mt-4 flex flex-col gap-3">
          <Field label="Passphrase"><input type="password" defaultValue="············" className={`${inputBase} border-ink focus:border-purple`} /></Field>
          <div className="flex items-center gap-1.5 font-mono text-[0.72rem] text-text-muted"><KeyIcon /> npub1ekko…q8r7</div>
        </div>
      </>
    );
    footer = (
      <>
        <WideBtn onClick={() => goStep(router, "review")}>Save &amp; continue →</WideBtn>
        <button onClick={() => goStep(router, "review")} className="ds-press mx-auto mt-2.5 block font-mono text-[0.72rem] font-bold text-text-muted underline">
          Skip for now
        </button>
      </>
    );
  }

  if (step === "review") {
    body = (
      <>
        <FlowLead>Step 4 of 5 · check everything</FlowLead>
        <h3 className="ds-display mt-2 text-2xl leading-[0.95] lg:text-3xl">One last<br />look</h3>
        <div className="mt-3">
          {draft.fulfilment === "pickup" ? (
            <ReviewRow label="Local pickup" onEdit={() => goStep(router, "pickup")}>
              <span className="font-bold">{draft.name || "No name yet"}</span>
              {draft.note && <span className="block text-[0.82rem] text-text-muted">&ldquo;{draft.note}&rdquo;</span>}
            </ReviewRow>
          ) : (
            <ReviewRow label="Ships to" onEdit={() => goStep(router, "ship")}>
              <span className="font-bold">{draft.name || "No name yet"}</span>
              <span className="block text-[0.82rem] text-text-muted">
                {[draft.address, draft.city, draft.zip].filter(Boolean).join(", ") || "No address yet"}
              </span>
            </ReviewRow>
          )}
          <ReviewRow label="Account" onEdit={() => goStep(router, "account")}>
            <span className="inline-flex items-center gap-1.5 font-mono text-[0.84rem]"><KeyIcon /> npub1ekko…q8r7</span>
          </ReviewRow>
          <ReviewRow label="Payment">
            <span className="font-bold">{draft.pay === "cashu" ? "Cashu token" : "Lightning"}</span>
            <span className="block text-[0.82rem] text-text-muted">Chosen on the next step</span>
          </ReviewRow>

          {/* The items again, in full. This is the last look before money moves,
              so the goods are stated outright rather than left in the collapsed
              header. Doubles as the content that fills the fixed-height panel. */}
          <div className="border-b-2 border-paper-2 py-3">
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">
              {cart.count} item{cart.count === 1 ? "" : "s"}
            </div>
            <ul className="mt-2 flex flex-col gap-2.5">
              {cart.items.map((i) => (
                <li key={i.product.id + (i.size ?? "")} className="flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.product.images[0]} alt="" className="h-10 w-10 shrink-0 rounded-lg border-2 border-ink object-cover" />
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-[0.86rem] font-bold">{i.product.title}</div>
                    <div className="font-mono text-[0.64rem] text-text-subtle">
                      @{i.product.pubkey.replace("pk_", "")} · ×{i.quantity}
                      {i.size ? ` · ${i.size}` : ""}
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[0.82rem] tabular-nums">{groupInt((satsFor(i.product) ?? 0) * i.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-between py-2 text-[0.86rem]">
            <span className="text-text-muted">Subtotal</span>
            <span className="font-mono tabular-nums">{groupInt(cart.subtotal)} sats</span>
          </div>
          <div className="flex justify-between pb-2 text-[0.86rem]">
            <span className="text-text-muted">{draft.fulfilment === "pickup" ? "Local pickup" : "Shipping"}</span>
            <span className="font-mono tabular-nums">{shipping === 0 ? "free" : `${groupInt(shipping)} sats`}</span>
          </div>
          <div className="flex items-baseline justify-between border-t-2 border-ink pt-3">
            <span className="font-bold">Total</span>
            <span className="font-mono text-lg font-bold tabular-nums">
              {groupInt(total)} <span className="text-xs font-normal text-text-muted">sats</span>
            </span>
          </div>
        </div>
      </>
    );
    footer = (
      <>
        <WideBtn onClick={() => goStep(router, "pay")}>
          <span className="inline-flex items-center gap-2">Pay {groupInt(total)} sats <Bolt /></span>
        </WideBtn>
        <FootNote icon={<LockIcon />}>Paying places the order. Your details go to the seller as an encrypted DM.</FootNote>
      </>
    );
  }

  if (step === "pay") {
    return (
      <>
        <Head><title>Checkout · Shopstr</title></Head>
        <PayStep
          idx={idx}
          closeTo={prevHref.pay}
          total={total}
          items={cart.items}
          pay={draft.pay}
          onPay={(p) => set("pay", p)}
          onPaid={() => router.push("/paid")}
          summary={<CheckoutSummary items={cart.items} shipping={shipping} fulfilment={draft.fulfilment} />}
        />
      </>
    );
  }

  return (
    <>
      <Head><title>Checkout · Shopstr</title></Head>
      <OneWayFrame
        tone="purple"
        step="Checkout"
        current={idx + 1}
        total={5}
        closeTo={prevHref[step]}
        header={<CheckoutSummary items={cart.items} shipping={shipping} fulfilment={draft.fulfilment} />}
        footer={footer}
      >
        <div ref={scrollRef}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} variants={stepMotion} initial="initial" animate="animate" exit="exit">
              {body}
            </motion.div>
          </AnimatePresence>
        </div>
      </OneWayFrame>
    </>
  );
}

/* Shipping step with field validation + a shake on invalid submit (edge case).
   Owns its own frame so the shake can move the panel and the CTA can live in
   the docked footer while `submit` stays local. */
function ShipStep({ idx, closeTo, summary }: { idx: number; closeTo: string; summary: ReactNode }) {
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
    // Upstream requires both of these on a shipping address; a parcel without
    // a state/province or country is not deliverable.
    if (!draft.state.trim()) e.state = true;
    if (!draft.country.trim()) e.country = true;
    if (Object.keys(e).length) {
      setErrs(e);
      controls.start(shake);
      return;
    }
    setErrs({});
    goStep(router, "account");
  };

  return (
    <OneWayFrame
      tone="purple"
      step="Checkout"
      current={idx + 1}
      total={5}
      closeTo={closeTo}
      header={summary}
      footer={<WideBtn onClick={submit}>Continue →</WideBtn>}
    >
      <motion.div animate={controls}>
        <FlowLead>Step 2 of 5 · where to</FlowLead>
        <h3 className="ds-display mt-2 text-2xl leading-[0.95] lg:text-3xl">Shipping<br />address</h3>
        <div className="mt-4 flex flex-col gap-3">
          <Field label="Full name" invalid={errs.name}><input className={fieldCls("name")} value={draft.name} onChange={(e) => { set("name", e.target.value); setErrs((p) => ({ ...p, name: false })); }} /></Field>
          <Field label="Address" invalid={errs.address}><input className={fieldCls("address")} value={draft.address} onChange={(e) => { set("address", e.target.value); setErrs((p) => ({ ...p, address: false })); }} /></Field>
          <div className="flex gap-2.5">
            <div className="flex-1"><Field label="City" invalid={errs.city}><input className={fieldCls("city")} value={draft.city} onChange={(e) => { set("city", e.target.value); setErrs((p) => ({ ...p, city: false })); }} /></Field></div>
            <div className="w-28"><Field label="Postcode" invalid={errs.zip}><input className={fieldCls("zip")} value={draft.zip} onChange={(e) => { set("zip", e.target.value); setErrs((p) => ({ ...p, zip: false })); }} /></Field></div>
          </div>
          <div className="flex gap-2.5">
            <div className="flex-1"><Field label="State / province" invalid={errs.state}><input className={fieldCls("state")} value={draft.state} onChange={(e) => { set("state", e.target.value); setErrs((p) => ({ ...p, state: false })); }} /></Field></div>
            <div className="flex-1"><Field label="Country" invalid={errs.country}><input className={fieldCls("country")} value={draft.country} onChange={(e) => { set("country", e.target.value); setErrs((p) => ({ ...p, country: false })); }} /></Field></div>
          </div>
          <div className="flex items-start gap-2.5 rounded-md border-2 border-ink bg-yellow-soft p-2.5 text-[0.8rem] leading-snug"><span className="mt-0.5"><LockIcon /></span><span>Your address is end-to-end encrypted and sent to the seller as a one-time DM. Shopstr never stores it.</span></div>
        </div>
      </motion.div>
    </OneWayFrame>
  );
}

/* Lightning QR with a live countdown, an explicit EXPIRED state + regenerate
   (edge case), and a brief "confirming payment" transient after "I've paid".
   Terminal: confirming resolves into /paid via onPaid. Owns its frame so the
   confirming state can replace the whole panel body and footer. */
function PayStep({
  idx,
  closeTo,
  total,
  items,
  pay,
  onPay,
  onPaid,
  summary,
}: {
  idx: number;
  closeTo: string;
  total: number;
  items: CartItem[];
  pay: "lightning" | "cashu";
  onPay: (p: "lightning" | "cashu") => void;
  onPaid: () => void;
  summary: ReactNode;
}) {
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

  // Items the seller quoted in a currency other than sats.
  const quotedItems = items.filter((i) => (i.product.currency || "sats") !== "sats");
  const rateUnavailable = quotedItems.some((i) => satsFor(i.product) === null);

  if (confirming) {
    return (
      <OneWayFrame tone="purple" step="Checkout" current={idx + 1} total={5} header={summary}>
        <div className="flex flex-col items-center gap-3 py-10">
          <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 0.9 }} className="grid h-12 w-12 place-items-center rounded-full border-[3px] border-ink border-t-transparent" />
          <div className="font-bold">Confirming payment…</div>
          <p className="text-center text-[0.84rem] leading-snug text-text-muted">Waiting for the network to confirm. This is usually instant.</p>
        </div>
      </OneWayFrame>
    );
  }

  return (
    <OneWayFrame
      tone="purple"
      step="Checkout"
      current={idx + 1}
      total={5}
      closeTo={closeTo}
      header={summary}
      footer={
        <>
          <WideBtn onClick={pay_} disabled={pay === "lightning" && expired}>I&apos;ve paid →</WideBtn>
          <FootNote icon={<LockIcon />}>Paid peer-to-peer in sats. Nothing is held by Shopstr.</FootNote>
        </>
      }
    >
      <FlowLead>Step 5 of 5 · payment</FlowLead>
      <h3 className="ds-display mt-2 text-2xl leading-[0.95] lg:text-3xl">Pay<br />in sats</h3>

      <div className="mt-4 flex overflow-hidden rounded-pill border-2 border-ink">
        {(["lightning", "cashu"] as const).map((p) => (
          <button key={p} onClick={() => onPay(p)} className={`flex-1 py-3 font-bold ${pay === p ? "bg-ink text-text-on-dark" : "bg-paper-pure"}`}>
            {p === "lightning" ? (
              <span className="inline-flex items-center justify-center gap-1.5"><Lightning size={16} /> Lightning</span>
            ) : (
              "Cashu token"
            )}
          </button>
        ))}
      </div>

      <div className="mt-3 text-center font-mono text-2xl font-bold tabular-nums">
        {groupInt(total)} <span className="text-sm font-normal text-text-muted">sats</span>
      </div>

      {/* Fiat-quoted items settle in sats at a rate that does not hold forever.
          The countdown is therefore a RATE LOCK, not just an invoice timer, and
          a failed lookup has to be sayable mid-checkout. */}
      {quotedItems.length > 0 && (
        <div className={`mt-2.5 rounded-md border-2 p-2.5 text-center font-mono text-[0.68rem] leading-snug ${
          rateUnavailable ? "border-red bg-pink-soft" : "border-purple bg-purple-soft text-purple-press"
        }`}>
          {rateUnavailable ? (
            <>Could not look up the {quotedItems[0].product.currency} → sats rate. The seller&apos;s price stands; try again in a moment.</>
          ) : (
            <>
              {quotedItems.map((i) => `${i.product.currency} ${i.product.price}`).join(" + ")}
              {" converted at today's rate · locked for "}
              {mm}:{ss}
            </>
          )}
        </div>
      )}

      {pay === "lightning" ? (
        <div className="mt-3">
          <div className="relative mx-auto h-[190px] w-[190px]">
            <div
              className={`grid h-full w-full place-items-center rounded-lg border-2 border-ink transition-[filter,opacity] duration-(--ds-dur-moderate) ${expired ? "opacity-30 blur-[2px]" : ""}`}
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
              <p className="mt-1 text-[0.82rem] leading-snug text-text-muted">Refreshing automatically, or generate one now.</p>
              <button onClick={regen} className="ds-press mt-2.5 inline-flex items-center gap-2 rounded-pill border-2 border-ink bg-paper-pure px-4 py-2.5 font-bold">
                <ArrowsClockwise size={16} />
                Generate fresh invoice
              </button>
            </div>
          ) : (
            <>
              <div className="mt-2.5 text-center font-mono font-bold tabular-nums">Invoice expires in {`0${mm}:${ss}`}</div>
              <p className="mt-1.5 text-center text-[0.84rem] leading-snug text-text-muted">Scan with any Lightning wallet. Auto-confirms on payment.</p>
            </>
          )}
        </div>
      ) : (
        <div className="mt-3">
          <textarea rows={4} placeholder="Paste your Cashu token (cashuA…)" className="w-full resize-none rounded-lg border-2 border-dashed border-ink bg-paper-pure p-3.5 font-mono text-[0.8rem] text-text-muted outline-none" />
          <p className="mt-2 text-[0.84rem] leading-snug text-text-muted">We&apos;ll redeem the token at the seller&apos;s mint and confirm instantly.</p>
        </div>
      )}
    </OneWayFrame>
  );
}

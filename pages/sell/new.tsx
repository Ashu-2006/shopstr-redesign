import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { AnimatePresence } from "framer-motion";
import { CaretDown, ImageSquare, X, Lightning } from "@phosphor-icons/react";
import {
  useSession,
  ME_PUBKEY,
  type ListingDraft,
} from "@/data/hooks";
import type { ProductData } from "@/data/types";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Toast } from "@/components/ui/Toast";
import { ListingCard } from "@/components/ListingCard";

/* The listing composer.
   ONE screen, not a wizard: upstream's own v2 research note (pages/v2/sell.tsx)
   cites Poshmark/Mercari — listing TIME is the metric, steps cost time. The
   step machine stays in checkout, where the buyer commits money under anxiety;
   here the seller is motivated to finish. Progressive disclosure applies to
   the OPTIONAL fields only ("More details"), never to the required path.

   Every change autosaves as a draft (the upstream failure this fixes: a
   1,761-line form with zero draft support — close the tab, lose the listing).
   ?draft=<id> resumes one. */

const CATEGORIES = ["Ceramics", "Art & Print", "Apparel", "Coffee", "Photography", "Electronics", "Home", "Kitchen", "Music"];
const CONDITIONS = ["New", "Like new", "Used", "Refurbished"];

/* An honest "no photo yet" stand-in for the preview card: a flat paper-3
   rectangle, unmistakably not a product photo. Inline SVG so it needs no
   asset and can never 404. */
const NO_PHOTO =
  "data:image/svg+xml," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="10"><rect width="8" height="10" fill="#d4d4d4"/></svg>');

/* Mock stand-in for the photo picker: the design phase has no upload pipe, so
   "Add photo" pulls the next of these. The interaction (add/remove/cover) is
   the real design; the source is not. */
const STOCK_PHOTOS = [
  "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800",
  "https://images.unsplash.com/photo-1495121605193-b116b5b9de5e?w=800",
  "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800",
];

const inputCls =
  "w-full rounded-md border-2 border-ink bg-paper-pure px-3.5 py-3 text-[0.92rem] outline-none focus:border-purple";
const labelCls = "mb-1.5 block font-mono text-[0.66rem] uppercase tracking-[0.1em] text-text-muted";

let draftSeq = 0;

const EMPTY: Omit<ListingDraft, "id" | "updatedAt"> = {
  title: "",
  summary: "",
  price: "",
  category: CATEGORIES[0],
  condition: CONDITIONS[0],
  quantity: "1",
  location: "",
  shippingCost: "",
  sizes: "",
  images: [],
};

export default function SellNew() {
  const router = useRouter();
  const { drafts, saveDraft, deleteDraft, publishListing, profile } = useSession();

  // Resume a draft when linked from the Drafts lane; otherwise a fresh id.
  const draftParam = typeof router.query.draft === "string" ? router.query.draft : "";
  const [draftId, setDraftId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [publishedToast, setPublishedToast] = useState(false);
  const restored = useRef(false);

  useEffect(() => {
    if (!router.isReady || restored.current) return;
    restored.current = true;
    if (draftParam) {
      const d = drafts.find((x) => x.id === draftParam);
      if (d) {
        const { id: _id, updatedAt: _at, ...fields } = d;
        setForm(fields);
        setDraftId(d.id);
        return;
      }
    }
    draftSeq += 1;
    setDraftId(`draft_${Date.now()}_${draftSeq}`);
    // drafts deliberately omitted: restore happens once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, draftParam]);

  /* Autosave: debounced against the session store. Only once the draft has
     any content worth returning to — an empty form saved as a draft would
     litter the Drafts lane with blanks. */
  const dirty = form.title || form.summary || form.price || form.images.length > 0;
  useEffect(() => {
    if (!draftId || !dirty) return;
    const t = setTimeout(() => {
      saveDraft({ ...form, id: draftId, updatedAt: Date.now() });
    }, 600);
    return () => clearTimeout(t);
  }, [form, draftId, dirty, saveDraft]);

  const set = useCallback(
    <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
      setForm((f) => ({ ...f, [key]: value })),
    []
  );
  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const priceNum = Number(form.price.replace(/[,\s]/g, ""));
  const qtyNum = Number(form.quantity.replace(/[,\s]/g, ""));
  const shipNum = form.shippingCost ? Number(form.shippingCost.replace(/[,\s]/g, "")) : 0;

  const errors = {
    images: form.images.length === 0 ? "Add at least one photo — listings without one don't sell." : undefined,
    title: !form.title.trim()
      ? "Give the listing a title buyers can search for."
      : form.title.trim().length < 3
        ? "That's a bit short to be findable."
        : undefined,
    price: !form.price.trim()
      ? "Set a price in sats."
      : !Number.isInteger(priceNum) || priceNum <= 0
        ? "Whole sats, above zero."
        : undefined,
    quantity:
      form.quantity && (!Number.isInteger(qtyNum) || qtyNum <= 0)
        ? "A whole number above zero."
        : undefined,
    shippingCost:
      form.shippingCost && (!Number.isInteger(shipNum) || shipNum < 0)
        ? "Whole sats, or leave empty for free shipping."
        : undefined,
  };
  const blocking = errors.images || errors.title || errors.price || errors.quantity || errors.shippingCost;

  /* The live preview: EXACTLY the tile a buyer sees in browse/search, fed by
     the form. Placeholder copy where fields are still empty, so the card
     always has geometry to show. */
  const preview: ProductData = useMemo(
    () => ({
      id: "preview",
      pubkey: ME_PUBKEY,
      title: form.title.trim() || "Your title here",
      summary: form.summary.trim(),
      images: form.images.length > 0 ? form.images : [NO_PHOTO],
      price: Number.isInteger(priceNum) && priceNum > 0 ? priceNum : 0,
      currency: "SATS",
      totalCost: (Number.isInteger(priceNum) && priceNum > 0 ? priceNum : 0) + (shipNum > 0 ? shipNum : 0),
      location: form.location.trim() || "—",
      categories: ["Physical", form.category],
      shippingType: shipNum > 0 ? "Added Cost" : "Free",
      shippingCost: shipNum > 0 ? shipNum : 0,
      condition: form.condition,
      quantity: Number.isInteger(qtyNum) && qtyNum > 0 ? qtyNum : 1,
      sizes: form.sizes ? form.sizes.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    }),
    [form, priceNum, qtyNum, shipNum]
  );

  const publish = () => {
    setTouched({ images: true, title: true, price: true, quantity: true, shippingCost: true });
    if (blocking || !draftId) return;
    publishListing({
      id: `own_${draftId}`,
      pubkey: ME_PUBKEY,
      title: form.title.trim(),
      summary: form.summary.trim(),
      images: form.images,
      price: priceNum,
      currency: "SATS",
      totalCost: priceNum + shipNum,
      location: form.location.trim() || "Berlin, DE",
      categories: ["Physical", form.category],
      shippingCost: shipNum > 0 ? shipNum : undefined,
      condition: form.condition,
      quantity: qtyNum > 0 ? qtyNum : 1,
      sizes: preview.sizes,
    });
    deleteDraft(draftId);
    setPublishedToast(true);
    // Let the toast register, then land on the dashboard where the listing is.
    setTimeout(() => router.push("/sell/mine"), 900);
  };

  const addPhoto = () => {
    const next = STOCK_PHOTOS.find((s) => !form.images.includes(s));
    if (next) set("images", [...form.images, next]);
  };

  return (
    <>
      <Head><title>New listing · Shopstr</title></Head>
      <SheetHeader title="New listing" backTo="/sell/mine" contentMax="max-w-(--ds-measure)" />

      <main className="mx-auto max-w-(--ds-measure) px-4 pb-28 pt-4 md:pb-12 lg:grid lg:grid-cols-[1fr_300px] lg:items-start lg:gap-10">
        <div>
          {/* Autosave is a fact, not a promise: say it once the first save exists. */}
          {dirty && (
            <p className="mb-3 font-mono text-[0.64rem] uppercase tracking-[0.1em] text-text-subtle">
              Draft saves as you type · find it under Sell → Drafts
            </p>
          )}

          {/* ---- Photos ---- */}
          <span className={labelCls}>Photos</span>
          <div className="flex flex-wrap gap-2.5">
            {form.images.map((src, i) => (
              <div key={src} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Photo ${i + 1}`} className="h-20 w-20 rounded-lg border-2 border-ink object-cover" />
                {i === 0 && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-pill border-2 border-ink bg-yellow px-1.5 font-mono text-[0.56rem] font-bold uppercase">
                    Cover
                  </span>
                )}
                <button
                  onClick={() => set("images", form.images.filter((s) => s !== src))}
                  aria-label={`Remove photo ${i + 1}`}
                  className="ds-press absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border-2 border-ink bg-paper-pure"
                >
                  <X size={11} weight="bold" />
                </button>
              </div>
            ))}
            {form.images.length < STOCK_PHOTOS.length && (
              <button
                onClick={addPhoto}
                onBlur={() => touch("images")}
                className="ds-press grid h-20 w-20 place-items-center rounded-lg border-2 border-dashed border-ink/40 bg-paper-2 text-text-muted"
                aria-label="Add photo"
              >
                <ImageSquare size={24} />
              </button>
            )}
          </div>
          {touched.images && errors.images && <FieldError msg={errors.images} />}

          {/* ---- Title ---- */}
          <label className="mt-5 block">
            <span className={labelCls}>Title</span>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              onBlur={() => touch("title")}
              placeholder="Hand-thrown stoneware mug"
              className={inputCls}
            />
          </label>
          {touched.title && errors.title && <FieldError msg={errors.title} />}

          {/* ---- Price: sats only, no converter. Locked principle. ---- */}
          <label className="mt-4 block">
            <span className={labelCls}>Price · sats</span>
            <div className="relative">
              <Lightning size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle" />
              <input
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                onBlur={() => touch("price")}
                inputMode="numeric"
                placeholder="18,000"
                className={`${inputCls} pl-9 font-mono font-bold tabular-nums`}
              />
            </div>
          </label>
          {touched.price && errors.price && <FieldError msg={errors.price} />}

          {/* ---- Category + condition: chips, not dropdowns. ---- */}
          <span className={`${labelCls} mt-4`}>Category</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Pill key={c} interactive active={form.category === c} onClick={() => set("category", c)}>
                {c}
              </Pill>
            ))}
          </div>
          <span className={`${labelCls} mt-4`}>Condition</span>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <Pill key={c} interactive active={form.condition === c} onClick={() => set("condition", c)}>
                {c}
              </Pill>
            ))}
          </div>

          {/* ---- Summary ---- */}
          <label className="mt-4 block">
            <span className={labelCls}>Description</span>
            <textarea
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
              rows={3}
              placeholder="What is it, what condition is it in, why should someone want it?"
              className={`${inputCls} resize-none`}
            />
          </label>

          {/* ---- More details: the optional tail, collapsed. ---- */}
          <MoreDetails>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className={labelCls}>Quantity</span>
                <input
                  value={form.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                  onBlur={() => touch("quantity")}
                  inputMode="numeric"
                  className={`${inputCls} font-mono tabular-nums`}
                />
              </label>
              <label>
                <span className={labelCls}>Shipping · sats</span>
                <input
                  value={form.shippingCost}
                  onChange={(e) => set("shippingCost", e.target.value)}
                  onBlur={() => touch("shippingCost")}
                  inputMode="numeric"
                  placeholder="0 = free"
                  className={`${inputCls} font-mono tabular-nums`}
                />
              </label>
            </div>
            {touched.quantity && errors.quantity && <FieldError msg={errors.quantity} />}
            {touched.shippingCost && errors.shippingCost && <FieldError msg={errors.shippingCost} />}
            <label className="mt-3 block">
              <span className={labelCls}>Ships from</span>
              <input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Berlin, DE"
                className={inputCls}
              />
            </label>
            <label className="mt-3 block">
              <span className={labelCls}>Sizes · comma separated</span>
              <input
                value={form.sizes}
                onChange={(e) => set("sizes", e.target.value)}
                placeholder="S, M, L"
                className={inputCls}
              />
            </label>
          </MoreDetails>

          {/* ---- Publish. Framed honestly: an event the seller owns. ---- */}
          <Button variant="secondary" full className="mt-6" onClick={publish}>
            Publish listing
          </Button>
          <p className="mt-2 text-center font-mono text-[0.62rem] uppercase tracking-[0.1em] text-text-subtle">
            Signed with @{profile.handle || "your key"} · you can edit or delete it any time
          </p>
        </div>

        {/* ---- Live preview: what a buyer will actually see, updating as the
             seller types. Desktop: sticky beside the form. Mobile: below it. ---- */}
        <aside className="mt-8 lg:sticky lg:top-24 lg:mt-0">
          <span className={labelCls}>Buyers will see</span>
          <div className={form.images.length === 0 ? "opacity-60" : ""}>
            <ListingCard product={preview} density="tile" />
          </div>
        </aside>
      </main>

      <AnimatePresence>{publishedToast && <Toast>Listing published</Toast>}</AnimatePresence>
      <BottomNav active="/profile" />
    </>
  );
}

function FieldError({ msg }: { msg: string }) {
  return <p className="mt-1.5 text-sm font-bold text-red">{msg}</p>;
}

/** The optional-fields disclosure. Native details/summary keeps it keyboard
    accessible for free; the chevron rides the open state. */
function MoreDetails({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-5 rounded-xl border-2 border-ink/20 bg-paper-2/50">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="ds-press flex w-full items-center justify-between px-4 py-3.5 font-bold"
      >
        More details
        <CaretDown
          size={16}
          weight="bold"
          className={`transition-transform duration-(--ds-dur-fast) ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Plus, WarningCircle } from "@phosphor-icons/react";
import { groupInt } from "@/lib/format";
import { OneWayFrame, FlowLead } from "@/components/ui/OneWayFrame";

const inputCls =
  "rounded-md border-2 border-ink bg-paper-pure px-3.5 py-3 text-[0.92rem] outline-none focus:border-purple w-full";

const CATEGORIES = ["Ceramics", "Art & Print", "Apparel", "Coffee", "Design", "Electronics"];

type Errors = Partial<Record<"title" | "price" | "quantity", string>>;

export default function SellNew() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("18000");
  const [quantity, setQuantity] = useState("6");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [errors, setErrors] = useState<Errors>({});

  const priceNum = Number(price.replace(/[,\s]/g, ""));
  const qtyNum = Number(quantity.replace(/[,\s]/g, ""));

  const submit = () => {
    const next: Errors = {};
    if (!title.trim()) next.title = "Give the listing a title buyers can search for.";
    else if (title.trim().length < 3) next.title = "That's a bit short to be findable.";

    if (!price.trim()) next.price = "Set a price.";
    else if (!Number.isFinite(priceNum) || priceNum <= 0) next.price = "Price must be a positive number of sats.";
    else if (!Number.isInteger(priceNum)) next.price = "Sats can't be fractional.";

    if (!quantity.trim()) next.quantity = "How many?";
    else if (!Number.isInteger(qtyNum) || qtyNum <= 0) next.quantity = "Quantity must be a whole number above zero.";

    setErrors(next);
    if (Object.keys(next).length) return;
    router.push("/sell/mine");
  };

  const err = (m?: string) =>
    m ? (
      <span role="alert" className="inline-flex items-start gap-1.5 text-[0.78rem] font-semibold text-red">
        <WarningCircle size={15} weight="bold" className="mt-px shrink-0" />
        {m}
      </span>
    ) : null;

  return (
    <>
      <Head><title>New listing · Shopstr</title></Head>
      <OneWayFrame tone="yellow" step="New listing" current={1} total={3} sticker="shape-sunstar-purple" closeTo="/sell/mine">
        <FlowLead>Step 1 of 3 · the basics</FlowLead>
        <h3 className="ds-display mt-2 text-2xl leading-[0.95]">List an<br />item</h3>
        <div className="mt-4 flex flex-col gap-3">
          <button
            type="button"
            className="ds-press cursor-pointer rounded-lg border-2 border-dashed border-ink p-6 text-center"
          >
            <span className="grid place-items-center"><Plus size={22} /></span>
            <span className="mt-1.5 block font-mono text-[0.66rem] uppercase tracking-[0.1em] text-text-muted">
              Add photos
            </span>
          </button>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">Title</span>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors((p) => ({ ...p, title: undefined })); }}
              placeholder="e.g. Hand-thrown stoneware mug"
              aria-invalid={errors.title ? true : undefined}
              className={`${inputCls} ${errors.title ? "border-red" : ""}`}
            />
            {err(errors.title)}
          </label>

          <div className="flex gap-2.5">
            <div className="flex-1">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">Price (sats)</span>
                <input
                  value={price}
                  onChange={(e) => { setPrice(e.target.value); if (errors.price) setErrors((p) => ({ ...p, price: undefined })); }}
                  inputMode="numeric"
                  aria-invalid={errors.price ? true : undefined}
                  className={`${inputCls} font-mono tabular-nums ${errors.price ? "border-red" : ""}`}
                />
                {err(errors.price)}
              </label>
            </div>
            <div className="w-32">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">Quantity</span>
                <input
                  value={quantity}
                  onChange={(e) => { setQuantity(e.target.value); if (errors.quantity) setErrors((p) => ({ ...p, quantity: undefined })); }}
                  inputMode="numeric"
                  aria-invalid={errors.quantity ? true : undefined}
                  className={`${inputCls} font-mono tabular-nums ${errors.quantity ? "border-red" : ""}`}
                />
              </label>
            </div>
          </div>
          {err(errors.quantity)}

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">Category</span>
            {/* A fixed set, so a picker beats free text: it can't be misspelled
                into a category nobody browses. */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={`ds-press rounded-pill border-2 border-ink px-3.5 py-1.5 text-[0.78rem] font-bold ${
                    category === c ? "bg-ink text-text-on-dark" : "bg-paper-pure"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </label>
        </div>

        {/* Live echo of what the buyer will see, so the numbers aren't abstract. */}
        {Number.isFinite(priceNum) && priceNum > 0 && (
          <p className="mt-3 font-mono text-[0.72rem] text-text-subtle">
            Buyers see {groupInt(priceNum)} sats
            {Number.isInteger(qtyNum) && qtyNum > 0 ? ` · ${groupInt(qtyNum)} available` : ""}
          </p>
        )}

        <button
          onClick={submit}
          className="ds-press mt-4 w-full rounded-pill border-2 border-ink bg-ink px-6 py-3.5 font-bold text-text-on-dark"
        >
          Continue →
        </button>
      </OneWayFrame>
    </>
  );
}

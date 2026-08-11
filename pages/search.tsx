import { useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { MagnifyingGlass, X, Faders, Heart } from "@phosphor-icons/react";
import { useListings, useSession } from "@/data/hooks";
import { primaryType, tintFor, priceLabel } from "@/lib/catalog";
import type { ProductData } from "@/data/types";

type Sort = "featured" | "newest" | "high" | "low";
const SORTS: { key: Sort; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest" },
  { key: "high", label: "Price: High to Low" },
  { key: "low", label: "Price: Low to High" },
];
const SIZES = ["S", "M", "L", "XL"];

export default function Search() {
  const router = useRouter();
  const { data: listings } = useListings();

  const PMIN = useMemo(() => Math.min(...listings.map((l) => l.price)), [listings]);
  const PMAX = useMemo(() => Math.max(...listings.map((l) => l.price)), [listings]);

  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // filters
  const [sort, setSort] = useState<Sort>("featured");
  const [sizes, setSizes] = useState<Set<string>>(new Set());
  const [lo, setLo] = useState(PMIN);
  const [hi, setHi] = useState(PMAX);
  const [sheet, setSheet] = useState(false);

  const commit = (term: string) => {
    setQuery(term);
    setCommitted(term);
    inputRef.current?.blur();
  };
  const clear = () => {
    setQuery("");
    setCommitted(null);
    inputRef.current?.focus();
  };

  // suggestion terms (categories + types), matched against the query
  const allTerms = useMemo(() => {
    const s = new Set<string>();
    listings.forEach((l) => l.categories.forEach((c) => s.add(c)));
    return Array.from(s).sort();
  }, [listings]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allTerms.slice(0, 8);
    const hits = allTerms.filter((t) => t.toLowerCase().includes(q));
    return [query.trim(), ...hits.filter((t) => t.toLowerCase() !== q)].slice(0, 8);
  }, [query, allTerms]);

  const results = useMemo(() => {
    if (!committed) return [];
    const q = committed.toLowerCase();
    let out = listings.filter((l) => {
      const hay = `${l.title} ${l.summary} ${l.categories.join(" ")} ${l.location}`.toLowerCase();
      if (!hay.includes(q)) return false;
      if (l.price < lo || l.price > hi) return false;
      if (sizes.size && !(l.sizes ?? []).some((s) => sizes.has(s))) return false;
      return true;
    });
    if (sort === "newest") out = out.slice().reverse();
    else if (sort === "high") out = out.slice().sort((a, b) => b.price - a.price);
    else if (sort === "low") out = out.slice().sort((a, b) => a.price - b.price);
    return out;
  }, [committed, listings, lo, hi, sizes, sort]);

  const filterCount = (sizes.size ? 1 : 0) + (sort !== "featured" ? 1 : 0) + (lo !== PMIN || hi !== PMAX ? 1 : 0);

  return (
    <>
      <Head><title>Search · Shopstr</title></Head>

      {/* ---- Brutalist search bar ---- */}
      <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper px-4 py-3">
        <div className="mx-auto flex max-w-[1240px] items-center gap-3">
          <div className="relative flex flex-1 items-center gap-2 rounded-pill border-2 border-ink bg-paper-pure px-4 py-2.5">
            <MagnifyingGlass size={18} className="shrink-0 text-text-subtle" />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => { setQuery(e.target.value); setCommitted(null); }}
              onKeyDown={(e) => { if (e.key === "Enter" && query.trim()) commit(query.trim()); }}
              placeholder="Search by name, price, or seller"
              className="w-full bg-transparent text-[0.95rem] font-medium outline-none placeholder:text-text-subtle"
            />
            {query && (
              <button onClick={clear} aria-label="Clear" className="ds-press grid h-6 w-6 shrink-0 place-items-center rounded-full bg-paper-2">
                <X size={13} />
              </button>
            )}
          </div>
          <Link href="/marketplace" className="ds-display ds-press shrink-0 text-sm">Cancel</Link>
        </div>
      </header>

      {!committed ? (
        /* ---- Suggestions ---- */
        <main className="mx-auto max-w-[1240px] px-4 pb-28 pt-5 md:pb-12">
          <div className="mb-3 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-text-subtle">
            {query.trim() ? "Top suggestions" : "Popular"}
          </div>
          <ul className="stagger flex flex-col">
            {suggestions.map((term, i) => (
              <li key={term + i} style={{ animationDelay: `${i * 40}ms` }}>
                <button onClick={() => commit(term)} className="flex w-full items-center gap-3 border-b-2 border-paper-2 py-3.5 text-left ds-press">
                  <MagnifyingGlass size={16} className="shrink-0 text-text-subtle" />
                  <Suggestion term={term} query={query.trim()} />
                </button>
              </li>
            ))}
          </ul>
        </main>
      ) : (
        /* ---- Results ---- */
        <>
          <div className="mx-auto max-w-[1240px] px-4">
            <h1 className="ds-display mt-5 text-3xl">{committed}</h1>
            <div className="mt-3 flex items-center justify-between border-t-2 border-ink py-3">
              <span className="font-mono text-sm tabular-nums">{results.length} result{results.length === 1 ? "" : "s"}</span>
              <button onClick={() => setSheet(true)} className="ds-press inline-flex items-center gap-2 rounded-pill border-2 border-ink bg-paper-pure px-4 py-2 font-bold">
                Filter
                <Faders size={16} />
                {filterCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-purple px-1 font-mono text-[0.6rem] font-bold text-on-purple tabular-nums">{filterCount}</span>}
              </button>
            </div>
          </div>

          <main className="mx-auto max-w-[1240px] px-4 pb-28 pt-3 md:pb-12">
            {results.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-ink/30 px-6 py-16 text-center">
                <p className="ds-display text-2xl">Nothing matches</p>
                <p className="mt-2 text-text-muted">Try a different term or clear the filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <AnimatePresence mode="popLayout" initial={false}>
                  {results.map((p) => (
                    <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}>
                      <ResultCard p={p} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </main>
        </>
      )}

      {/* ---- Filter sheet ---- */}
      <AnimatePresence>
        {sheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)} className="fixed inset-0 z-40 bg-ink/50" />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88vh] max-w-[560px] flex-col rounded-t-2xl border-2 border-ink bg-paper"
            >
              <div className="flex items-center justify-between border-b-2 border-ink px-5 py-4">
                <h2 className="ds-display text-2xl">Filter</h2>
                <button onClick={() => setSheet(false)} aria-label="Close" className="ds-press grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-paper-pure">
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                {/* Sort By */}
                <h3 className="ds-display text-lg">Sort by</h3>
                <div className="mt-3 flex flex-col gap-2.5">
                  {SORTS.map((s) => (
                    <button key={s.key} onClick={() => setSort(s.key)} className="ds-press flex items-center gap-3 text-left">
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-ink ${sort === s.key ? "bg-ink" : "bg-paper-pure"}`}>
                        {sort === s.key && <span className="h-2.5 w-2.5 rounded-full bg-paper-pure" />}
                      </span>
                      <span className="font-semibold">{s.label}</span>
                    </button>
                  ))}
                </div>

                <div className="my-5 h-0.5 bg-ink/15" />

                {/* Size */}
                <h3 className="ds-display text-lg">Size</h3>
                <div className="mt-3 grid grid-cols-4 gap-2.5">
                  {SIZES.map((s) => {
                    const on = sizes.has(s);
                    return (
                      <button key={s} onClick={() => setSizes((prev) => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; })}
                        className={`ds-press rounded-lg border-2 border-ink py-3 font-bold ${on ? "bg-ink text-text-on-dark" : "bg-paper-pure"}`}>
                        {s}
                      </button>
                    );
                  })}
                </div>

                <div className="my-5 h-0.5 bg-ink/15" />

                {/* Shop By Price */}
                <h3 className="ds-display text-lg">Shop by price</h3>
                <div className="mt-3 flex gap-3">
                  <label className="flex-1">
                    <span className="font-mono text-[0.62rem] uppercase tracking-[0.08em] text-text-muted">Min · sats</span>
                    <input type="number" value={lo} min={PMIN} max={hi}
                      onChange={(e) => setLo(Math.min(Number(e.target.value) || PMIN, hi))}
                      className="mt-1 w-full rounded-md border-2 border-ink bg-paper-pure px-3 py-2.5 font-mono font-bold tabular-nums outline-none focus:border-purple" />
                  </label>
                  <label className="flex-1">
                    <span className="font-mono text-[0.62rem] uppercase tracking-[0.08em] text-text-muted">Max · sats</span>
                    <input type="number" value={hi} min={lo} max={PMAX}
                      onChange={(e) => setHi(Math.max(Number(e.target.value) || PMAX, lo))}
                      className="mt-1 w-full rounded-md border-2 border-ink bg-paper-pure px-3 py-2.5 font-mono font-bold tabular-nums outline-none focus:border-purple" />
                  </label>
                </div>
                <PriceRange min={PMIN} max={PMAX} lo={lo} hi={hi} setLo={setLo} setHi={setHi} />
              </div>

              <div className="flex items-center gap-3 border-t-2 border-ink px-5 py-4" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}>
                <button onClick={() => { setSort("featured"); setSizes(new Set()); setLo(PMIN); setHi(PMAX); }} className="ds-press font-bold underline">Clear all</button>
                <button onClick={() => setSheet(false)} className="ds-press ml-auto rounded-pill border-2 border-ink bg-ink px-6 py-3 font-bold text-text-on-dark">
                  Show {results.length} result{results.length === 1 ? "" : "s"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* Highlight the typed portion of a suggestion (ink) vs the completion (muted). */
function Suggestion({ term, query }: { term: string; query: string }) {
  const i = query ? term.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return <span className="ds-display text-xl">{term}</span>;
  return (
    <span className="ds-display text-xl">
      <span className="text-text-muted">{term.slice(0, i)}</span>
      {term.slice(i, i + query.length)}
      <span className="text-text-muted">{term.slice(i + query.length)}</span>
    </span>
  );
}

/* Search result card: image well + fav heart + type tag + title + price. */
function ResultCard({ p }: { p: ProductData }) {
  const { favs, toggleFav } = useSession();
  const fav = favs.has(p.id);
  const type = primaryType(p);
  return (
    <div className="group flex flex-col">
      <div className={`relative aspect-square overflow-hidden rounded-lg border-2 border-ink ${tintFor(p)}`}>
        <Link href={`/listing/${p.id}`} className="absolute inset-0 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.images[0]} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-[600ms] ease-out motion-safe:group-hover:scale-[1.06]" />
        </Link>
        {type && <span className="absolute left-2.5 top-2.5 rounded-pill border-2 border-ink bg-ink px-2.5 py-1 text-xs font-semibold text-white">{type}</span>}
        <button onClick={() => toggleFav(p.id)} aria-label="Save" aria-pressed={fav}
          className={`ds-press absolute right-2.5 top-2.5 z-10 grid h-9 w-9 place-items-center rounded-full border-2 border-ink ${fav ? "bg-pink" : "bg-paper-pure"}`}>
          <Heart size={16} weight={fav ? "fill" : "duotone"} className="text-ink" />
        </button>
      </div>
      <Link href={`/listing/${p.id}`} className="mt-2 block">
        {p.condition === "New" && <div className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.08em] text-red">Just in</div>}
        <h3 className="mt-0.5 line-clamp-2 font-bold leading-tight">{p.title}</h3>
        <div className="mt-1 font-mono text-[0.92rem] font-bold tabular-nums">{priceLabel(p)}</div>
      </Link>
    </div>
  );
}

/* Dual-thumb price slider (two overlaid native ranges). */
function PriceRange({ min, max, lo, hi, setLo, setHi }: { min: number; max: number; lo: number; hi: number; setLo: (n: number) => void; setHi: (n: number) => void }) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const step = Math.max(1000, Math.round((max - min) / 100));
  return (
    <div className="relative mt-5 h-6">
      <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full border-2 border-ink bg-paper-2" />
      <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-purple" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
      <input className="range-dual" type="range" min={min} max={max} step={step} value={lo} onChange={(e) => setLo(Math.min(Number(e.target.value), hi - step))} aria-label="Minimum price" />
      <input className="range-dual" type="range" min={min} max={max} step={step} value={hi} onChange={(e) => setHi(Math.max(Number(e.target.value), lo + step))} aria-label="Maximum price" />
    </div>
  );
}

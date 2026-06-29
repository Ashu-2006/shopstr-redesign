import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Sticker } from "@/components/ui/Sticker";

const TILTS = [
  { label: "@ekko", href: "/shop/ekko", bg: "bg-pink", rot: -4, ml: 0 },
  { label: "My listings", href: "/sell/mine", bg: "bg-green", rot: 2.5, ml: 24 },
  { label: "Reviews", href: "/orders", bg: "bg-paper-pure", rot: -2, ml: 8 },
  { label: "Wallet", href: "/wallet", bg: "bg-blue", rot: 3, ml: 40 },
  { label: "Settings", href: "/settings", bg: "bg-paper-pure", rot: -3, ml: 14 },
];

export default function Profile() {
  const router = useRouter();
  return (
    <>
      <Head><title>You · Shopstr</title></Head>
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-yellow">
        <div className="flex items-center justify-between px-5 py-[18px]">
          <button onClick={() => router.push("/marketplace")} aria-label="Close" className="ds-press grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-paper-pure">✕</button>
          <span className="font-mono text-[0.78rem] uppercase tracking-[0.2em]">Profile</span>
          <Link href="/settings" aria-label="Settings" className="ds-press grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-paper-pure">⚙</Link>
        </div>

        <Sticker name="shape-starburst" className="spin-slow absolute right-6 top-[62px] z-0 h-20 w-20" />

        <div className="z-10 mx-auto flex w-full max-w-[600px] flex-1 flex-col items-start gap-4 px-6 pt-4 md:pt-10">
          {TILTS.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className={`ds-press ds-display rounded-pill border-2 border-ink px-7 py-3.5 text-[1.7rem] ${t.bg}`}
              style={{ transform: `rotate(${t.rot}deg)`, marginLeft: t.ml }}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="z-10 mx-3.5 flex gap-3 rounded-t-2xl border-2 border-b-0 border-ink bg-paper-pure p-4 md:mx-auto md:w-full md:max-w-[600px]">
          <Link href="/marketplace" className="ds-press flex min-h-[118px] flex-1 flex-col justify-between rounded-lg border-2 border-ink bg-pink p-3.5">
            <span className="text-xl">★</span>
            <span className="font-bold leading-tight">Rate Shopstr</span>
          </Link>
          <Link href="/shop/ekko" className="ds-press flex min-h-[118px] flex-1 flex-col justify-between rounded-lg border-2 border-ink bg-purple p-3.5 text-on-purple">
            <span className="text-xl">↗</span>
            <span className="font-bold leading-tight">Share your shop</span>
          </Link>
        </div>
      </div>
    </>
  );
}

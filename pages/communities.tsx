import Head from "next/head";
import Link from "next/link";
import { useCommunities, profileByHandle } from "@/data/hooks";
import { TopBar } from "@/components/ui/TopBar";
import { BottomNav } from "@/components/ui/BottomNav";
import { Sticker } from "@/components/ui/Sticker";
import type { Community } from "@/data/mock/extras";

const TONE: Record<Community["tone"], string> = {
  pink: "bg-pink text-ink",
  yellow: "bg-yellow text-ink",
  green: "bg-green text-ink",
  blue: "bg-blue text-ink",
  purple: "bg-purple text-on-purple",
};

const AVATARS = ["ekko", "alice", "daveshoots"].map((h) => profileByHandle(h)?.picture);

export default function Communities() {
  const { data: comms } = useCommunities();
  const featured = comms.find((c) => c.featured);
  const rest = comms.filter((c) => !c.featured);

  return (
    <>
      <Head><title>Communities · Shopstr</title></Head>
      <TopBar searchHref="/search" />
      <main className="mx-auto max-w-[1100px] pb-28 pt-2 md:pb-12">
        <div className="px-4 pt-4">
          <h1 className="ds-display text-[2.4rem] leading-[0.9]">
            Find your<br />peo
            <Sticker name="shape-smiley" className="inline-block h-[0.74em] w-auto align-[-0.08em] spin-slow" />
            le.
          </h1>
          <p className="mt-2.5 max-w-[40ch] text-text-muted">
            NIP-72 communities — curated corners of the market run by people who care about the craft.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 px-4 md:grid-cols-3">
          {featured && (
            <Link href={`/communities/${featured.slug}`} className={`lift col-span-2 flex min-h-[96px] items-center gap-3.5 overflow-hidden rounded-lg border-2 border-ink p-3.5 md:col-span-3 ${TONE[featured.tone]}`}>
              <span className="text-3xl">{featured.emoji}</span>
              <div className="flex-1">
                <div className="ds-display text-lg leading-none">{featured.name}</div>
                <div className="mt-1.5 font-mono text-[0.66rem] opacity-80">{featured.blurb}</div>
              </div>
              <div className="flex shrink-0">
                {AVATARS.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" className="-ml-3 h-[34px] w-[34px] rounded-full border-2 border-ink object-cover first:ml-0" />
                ))}
              </div>
            </Link>
          )}
          {rest.map((c) => (
            <Link key={c.slug} href={`/communities/${c.slug}`} className={`lift relative flex min-h-[128px] flex-col justify-between overflow-hidden rounded-lg border-2 border-ink p-3.5 ${TONE[c.tone]}`}>
              <span className="text-2xl">{c.emoji}</span>
              <div>
                <div className="ds-display text-[1.15rem] leading-[0.95]">{c.name}</div>
                <div className="mt-1.5 font-mono text-[0.66rem] opacity-80">{c.members} members</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="px-4 pt-4">
          <Link href="/communities" className="ds-press flex w-full items-center justify-center gap-2 rounded-pill border-2 border-ink bg-paper-pure py-3.5 font-bold">
            + Start a community
          </Link>
        </div>
      </main>
      <BottomNav active="/communities" />
    </>
  );
}

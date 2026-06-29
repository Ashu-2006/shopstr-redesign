import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useSellerListings } from "@/data/hooks";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Pill } from "@/components/ui/Pill";
import { ProductCard } from "@/components/ProductCard";

export default function MyListings() {
  const { data: mine } = useSellerListings("pk_ekko");
  const [filter, setFilter] = useState("Active");
  return (
    <>
      <Head><title>My listings · Shopstr</title></Head>
      <SheetHeader title="My listings" backTo="/profile" />
      <main className="mx-auto max-w-[1100px] px-4 pb-28 pt-4 md:pb-12">
        <Link href="/sell/new" className="ds-press mb-3.5 flex w-full items-center justify-center gap-2 rounded-pill border-2 border-purple bg-purple py-3.5 font-bold text-on-purple">
          ＋ New listing
        </Link>
        <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
          {["Active", "Sold", "Drafts"].map((f) => (
            <Pill key={f} interactive active={filter === f} onClick={() => setFilter(f)}>
              {f === "Active" ? `Active ${mine.length}` : f}
            </Pill>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {mine.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </main>
      <BottomNav active="/profile" />
    </>
  );
}

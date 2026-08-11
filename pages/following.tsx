import Link from "next/link";
import { useListings } from "@/data/hooks";
import { FeedScreen } from "@/components/FeedScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

const FOLLOWED = ["pk_ekko", "pk_mara", "pk_alice"];

export default function FollowingFeed() {
  const { data: listings, isLoading } = useListings();
  const list = listings.filter((l) => FOLLOWED.includes(l.pubkey));
  return (
    <FeedScreen
      title="Following"
      sub="From sellers you follow"
      listings={list}
      loading={isLoading}
      empty={
        <EmptyState
          sticker="badge-love-heart"
          headline="Follow some sellers"
          body="Their new drops will land here first."
          cta={
            <Link href="/marketplace">
              <Button variant="secondary">Find sellers</Button>
            </Link>
          }
        />
      }
    />
  );
}

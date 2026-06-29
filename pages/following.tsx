import { useListings } from "@/data/hooks";
import { FeedScreen } from "@/components/FeedScreen";

const FOLLOWED = ["pk_ekko", "pk_mara", "pk_alice"];

export default function FollowingFeed() {
  const { data: listings } = useListings();
  const list = listings.filter((l) => FOLLOWED.includes(l.pubkey));
  return <FeedScreen title="Following" sub="From sellers you follow" listings={list} />;
}

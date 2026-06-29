import { useListings } from "@/data/hooks";
import { FeedScreen } from "@/components/FeedScreen";

export default function NearFeed() {
  const { data: listings } = useListings();
  const near = listings.filter((l) => l.location.includes("Berlin")).concat(listings.slice(0, 4));
  return <FeedScreen title="Near me" sub="Within ~5km of Berlin" listings={near} />;
}

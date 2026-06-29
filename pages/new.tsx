import { useListings } from "@/data/hooks";
import { FeedScreen } from "@/components/FeedScreen";

export default function NewFeed() {
  const { data: listings } = useListings();
  return <FeedScreen title="New this week" sub="Freshest first" listings={listings.slice().reverse()} />;
}

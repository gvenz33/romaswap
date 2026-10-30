import type { Metadata } from "next";
import { ExploreScreen } from "@/components/explore-screen";

export const metadata: Metadata = { title: "Auctions" };

export default function ExploreAuctionsPage() {
  return <ExploreScreen tab="auctions" />;
}

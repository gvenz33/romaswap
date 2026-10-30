import type { Metadata } from "next";
import { ExploreScreen } from "@/components/explore-screen";

export const metadata: Metadata = { title: "Explore" };

export default function ExplorePage() {
  return <ExploreScreen tab="tokens" />;
}

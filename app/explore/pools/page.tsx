import type { Metadata } from "next";
import { ExploreScreen } from "@/components/explore-screen";

export const metadata: Metadata = { title: "Pools" };

export default function ExplorePoolsPage() {
  return <ExploreScreen tab="pools" />;
}

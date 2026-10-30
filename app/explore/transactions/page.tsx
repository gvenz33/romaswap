import type { Metadata } from "next";
import { ExploreScreen } from "@/components/explore-screen";

export const metadata: Metadata = { title: "Transactions" };

export default function ExploreTransactionsPage() {
  return <ExploreScreen tab="transactions" />;
}

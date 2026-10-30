import type { Metadata } from "next";
import { FiatScreen } from "@/components/simple-screens";

export const metadata: Metadata = { title: "Sell" };

export default function SellPage() {
  return <FiatScreen side="sell" />;
}

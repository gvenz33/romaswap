import type { Metadata } from "next";
import { FiatScreen } from "@/components/simple-screens";

export const metadata: Metadata = { title: "Buy" };

export default function BuyPage() {
  return <FiatScreen side="buy" />;
}

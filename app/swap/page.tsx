import type { Metadata } from "next";
import { SwapScreen } from "@/components/swap-screen";

export const metadata: Metadata = { title: "Swap" };

export default function SwapPage() {
  return <SwapScreen />;
}

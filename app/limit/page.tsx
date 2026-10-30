import type { Metadata } from "next";
import { LimitScreen } from "@/components/simple-screens";

export const metadata: Metadata = { title: "Limit" };

export default function LimitPage() {
  return <LimitScreen />;
}

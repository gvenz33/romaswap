import type { Metadata } from "next";
import { PoolScreen } from "@/components/pool-portfolio";

export const metadata: Metadata = { title: "Pool" };

export default function PoolPage() {
  return <PoolScreen />;
}

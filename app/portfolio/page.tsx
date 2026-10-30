import type { Metadata } from "next";
import { PortfolioScreen } from "@/components/pool-portfolio";

export const metadata: Metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  return <PortfolioScreen />;
}

import type { Metadata } from "next";
import { BankBuyScreen } from "@/components/bank-buy";

export const metadata: Metadata = { title: "Buy" };

export default function BuyPage() {
  return <BankBuyScreen />;
}

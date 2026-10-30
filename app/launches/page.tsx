import type { Metadata } from "next";
import { LaunchesScreen } from "@/components/simple-screens";

export const metadata: Metadata = { title: "Launches" };

export default function LaunchesPage() {
  return <LaunchesScreen />;
}

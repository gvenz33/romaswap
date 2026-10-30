import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppProvider } from "@/components/app-state";
import { Shell } from "@/components/shell";
import { assertPublicConfig } from "@/lib/config";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "RomaSwap",
    template: "%s · RomaSwap",
  },
  description: "Swap tokens on Base with a noncustodial demo interface. Sample prices only. No live trading.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  assertPublicConfig();
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppProvider>
          <Shell>{children}</Shell>
        </AppProvider>
      </body>
    </html>
  );
}

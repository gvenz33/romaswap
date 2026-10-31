import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { cookieToInitialState } from "wagmi";
import { AppProvider } from "@/components/app-state";
import { Shell } from "@/components/shell";
import { Web3Provider } from "@/components/web3-provider";
import { assertPublicConfig } from "@/lib/config";
import { getConfig } from "@/lib/wagmi";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "RomaSwap",
    template: "%s · RomaSwap",
  },
  description: "Swap tokens on Base with your own wallet. Sample prices. No live trading yet.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  assertPublicConfig();
  const cookie = (await headers()).get("cookie");
  const initialState = cookieToInitialState(getConfig(), cookie);
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Web3Provider initialState={initialState}>
          <AppProvider>
            <Shell>{children}</Shell>
          </AppProvider>
        </Web3Provider>
      </body>
    </html>
  );
}

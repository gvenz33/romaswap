import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { cookies } from "next/headers";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const sans = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-cormorant" });

export const metadata: Metadata = {
  title: "RomaSwap",
  description: "Noncustodial token swaps on Base. You keep the keys. A 0.25% fee is shown before you sign.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable} antialiased`}>
        <Providers cookie={cookieStore.toString()}>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}

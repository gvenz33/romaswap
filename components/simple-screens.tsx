"use client";

import Link from "next/link";
import { Mascot } from "@/components/mascot";
import { TradeTabs } from "@/components/swap-screen";

export function LimitScreen() {
  return (
    <div className="mx-auto w-full max-w-[480px] px-3 pt-8 pb-16">
      <TradeTabs current="/limit" />
      <div className="rounded-[22px] border border-[#ffe14a]/45 bg-[#6d28d9] p-5 text-center">
        <Mascot pose="shock" alt="The centurion looking shocked" className="mx-auto h-36 w-36 object-contain" />
        <h1 className="text-xl font-medium">Limit</h1>
        <p className="mt-2 text-sm leading-6 text-[#f3d4ff]">
          Limit orders are not available. RomaSwap covers immediate swaps on Base only.
        </p>
        <Link href="/swap" className="mt-4 inline-flex rounded-full bg-[#ffe14a] px-4 py-2 text-sm font-semibold text-[#1a1408]">
          Go to Swap
        </Link>
      </div>
    </div>
  );
}

export function FiatScreen({ side }: { side: "buy" | "sell" }) {
  const title = side === "buy" ? "Buy" : "Sell";
  return (
    <div className="mx-auto w-full max-w-[480px] px-3 pt-8 pb-16">
      <TradeTabs current={side === "buy" ? "/buy" : "/sell"} />
      <div className="rounded-[22px] border border-[#ffe14a]/45 bg-[#6d28d9] p-5 text-center">
        <Mascot pose="thumbs" alt="The centurion giving a thumbs up" className="mx-auto h-36 w-36 object-contain" />
        <h1 className="text-xl font-medium">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#f3d4ff]">
          RomaSwap does not offer fiat purchases or sales. Token swaps stay on Base, between allowlisted assets, and you keep your own wallet.
        </p>
        <Link href="/swap" className="mt-4 inline-flex rounded-full bg-[#ffe14a] px-4 py-2 text-sm font-semibold text-[#1a1408]">
          Go to Swap
        </Link>
      </div>
    </div>
  );
}

export function LaunchesScreen() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-10 text-center">
      <Mascot pose="cheer" alt="The centurion cheering" className="mx-auto h-44 w-44 object-contain" />
      <p className="text-sm font-semibold text-[#ffe14a]">Soon</p>
      <h1 className="mt-2 text-4xl font-medium">Launches</h1>
      <p className="mt-3 text-[#f3d4ff]">
        RomaSwap does not run a token launchpad and does not issue its own token. The swap interface uses a reviewed Base allowlist.
      </p>
      <Link href="/swap" className="mt-6 inline-flex rounded-full bg-[#ffe14a] px-4 py-2 text-sm font-semibold text-[#1a1408]">
        Open Swap
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Mascot } from "@/components/mascot";
import { Sparkline, TokenIcon } from "@/components/token-icon";
import { formatCompactUsd, formatPct, formatPrice } from "@/lib/format";
import { SAMPLE_POOLS, SAMPLE_TXS } from "@/lib/pools";
import { TOKENS } from "@/lib/tokens";

const TABS = [
  { href: "/explore", label: "Tokens" },
  { href: "/explore/pools", label: "Pools" },
  { href: "/explore/transactions", label: "Transactions" },
  { href: "/explore/auctions", label: "Auctions" },
];

export function ExploreScreen({ tab }: { tab: "tokens" | "pools" | "transactions" | "auctions" }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const tokens = useMemo(
    () => TOKENS.filter((token) => `${token.symbol} ${token.name}`.toLowerCase().includes(needle)),
    [needle],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-16">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="flex gap-5 text-lg">
          {TABS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={tab === item.label.toLowerCase() || (tab === "tokens" && item.href === "/explore") ? "text-white" : "text-[#f3d4ff] hover:text-white"}
              aria-current={
                (tab === "tokens" && item.href === "/explore") || item.href.endsWith(tab) ? "page" : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-[#d7d7d7]">Base</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter tokens"
            aria-label="Filter tokens"
            className="h-9 w-44 rounded-full border border-white/10 bg-transparent px-3 text-sm outline-none"
          />
        </div>
      </div>
      <p className="mb-4 text-sm text-[#f3d4ff]">Sample figures for the draft Base allowlist. These are not live market data.</p>
      {tab === "tokens" ? <TokenTable tokens={tokens} /> : null}
      {tab === "pools" ? <PoolTable query={needle} /> : null}
      {tab === "transactions" ? <TxTable /> : null}
      {tab === "auctions" ? (
        <EmptyPanel
          title="Auctions are not offered"
          body="RomaSwap does not run token auctions or a launch sale. Trading in this demo stays on the draft Base allowlist."
        />
      ) : null}
    </div>
  );
}

function TokenTable({ tokens }: { tokens: typeof TOKENS }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-left text-[#f3d4ff]">
            {["#", "Token", "Price", "1H", "1D", "FDV", "Volume", "1D chart"].map((heading) => (
              <th key={heading} className="bg-[#6d28d9] px-3 py-3 font-medium first:rounded-l-2xl last:rounded-r-2xl">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tokens.map((token, index) => (
            <tr key={token.id} className="border-b border-white/5">
              <td className="px-3 py-4 text-[#f3d4ff]">{index + 1}</td>
              <td className="px-3 py-4">
                <Link href="/swap" className="flex items-center gap-3">
                  <TokenIcon token={token} size={32} />
                  <span>
                    <span className="block font-medium">{token.name}</span>
                    <span className="text-[#f3d4ff]">{token.symbol}</span>
                  </span>
                </Link>
              </td>
              <td className="px-3 py-4 tabular">{formatPrice(token.priceUsd)}</td>
              <td className={`px-3 py-4 tabular ${token.change1h >= 0 ? "text-[#b6ff6a]" : "text-[#ffb3d0]"}`}>{formatPct(token.change1h)}</td>
              <td className={`px-3 py-4 tabular ${token.change1d >= 0 ? "text-[#b6ff6a]" : "text-[#ffb3d0]"}`}>{formatPct(token.change1d)}</td>
              <td className="px-3 py-4 tabular">{formatCompactUsd(token.fdvUsd)}</td>
              <td className="px-3 py-4 tabular">{formatCompactUsd(token.volume1dUsd)}</td>
              <td className="px-3 py-4"><Sparkline seed={token.id} up={token.change1d >= 0} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PoolTable({ query }: { query: string }) {
  const rows = SAMPLE_POOLS.filter((pool) => pool.pair.toLowerCase().includes(query));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="text-left text-[#f3d4ff]">
            {["#", "Route", "TVL", "1D volume", "30D volume", "1D vol/TVL"].map((heading) => (
              <th key={heading} className="bg-[#6d28d9] px-3 py-3 font-medium first:rounded-l-2xl last:rounded-r-2xl">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((pool, index) => (
            <tr key={pool.id}>
              <td className="px-3 py-4 text-[#f3d4ff]">{index + 1}</td>
              <td className="px-3 py-4">
                <span className="block font-medium">{pool.pair}</span>
                <span className="text-xs text-[#f3d4ff]">Base liquidity · sample</span>
              </td>
              <td className="px-3 py-4 tabular">{formatCompactUsd(pool.tvlUsd)}</td>
              <td className="px-3 py-4 tabular">{formatCompactUsd(pool.volume1dUsd)}</td>
              <td className="px-3 py-4 tabular">{formatCompactUsd(pool.volume30dUsd)}</td>
              <td className="px-3 py-4 tabular">{pool.volTvl.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TxTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="text-left text-[#f3d4ff]">
            {["Sample", "Pair", "Side", "Amount", "Value", "When"].map((heading) => (
              <th key={heading} className="bg-[#6d28d9] px-3 py-3 font-medium first:rounded-l-2xl last:rounded-r-2xl">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SAMPLE_TXS.map((tx) => (
            <tr key={tx.id}>
              <td className="px-3 py-4 text-[#f3d4ff]">Sample</td>
              <td className="px-3 py-4">{tx.pair}</td>
              <td className="px-3 py-4">{tx.side}</td>
              <td className="px-3 py-4">{tx.amount}</td>
              <td className="px-3 py-4 tabular">{formatCompactUsd(tx.valueUsd)}</td>
              <td className="px-3 py-4 text-[#f3d4ff]">{tx.when}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-[#ffe14a]/45 bg-[#6d28d9] px-6 py-10 text-center">
      <Mascot pose="shock" alt="" className="mx-auto h-36 w-36 object-contain" />
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#f3d4ff]">{body}</p>
    </div>
  );
}

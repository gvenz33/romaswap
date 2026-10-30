"use client";

import { useApp } from "@/components/app-state";
import { Mascot } from "@/components/mascot";
import { TokenIcon } from "@/components/token-icon";
import { formatCompactUsd, formatToken, formatUsd } from "@/lib/format";
import { SAMPLE_POOLS } from "@/lib/pools";
import { TOKENS } from "@/lib/tokens";

const AGGREGATOR_NOTE =
  "RomaSwap routes swaps through existing Base markets. It does not accept liquidity deposits, custody pool tokens, or deploy its own pools.";

export function PoolScreen() {
  const app = useApp();
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-10 pb-16">
      <Mascot pose="wave" alt="" className="mx-auto h-28 w-28 object-contain" />
      <h1 className="text-center text-4xl font-medium tracking-tight">Routes on Base</h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-[#cfcfcf]">
        Compare sample liquidity for the draft allowlist. RomaSwap does not take custody of positions.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <GoldButton
          label="Create position"
          onClick={() =>
            app.setNotice({
              title: "Positions are not available",
              body: AGGREGATOR_NOTE,
            })
          }
        />
        <GhostButton
          label="+ Create pool"
          onClick={() =>
            app.setNotice({
              title: "Pool creation is not available",
              body: AGGREGATOR_NOTE,
            })
          }
        />
        <GhostButton
          label="+ Launch token"
          onClick={() =>
            app.setNotice({
              title: "Token launches are not available",
              body: "RomaSwap does not issue a token and does not run a launchpad.",
            })
          }
        />
      </div>

      <section className="relative mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#171717] px-6 py-12 text-center">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(240,180,41,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(240,180,41,0.08) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative">
          <h2 className="text-2xl font-medium">{app.wallet ? "No liquidity positions" : "Connect a wallet"}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#f3d4ff]">
            {app.wallet
              ? "This demo wallet has no pool tokens. RomaSwap does not hold liquidity for you."
              : "A demo session can show sample balances. Live positions are not part of this version."}
          </p>
          {app.wallet ? null : (
            <button className="mt-4 rounded-full bg-[#ffe14a] px-4 py-2 text-sm font-semibold text-[#3b1608]" onClick={() => app.openModal("connect")}>
              Connect wallet
            </button>
          )}
        </div>
      </section>

      <h2 className="mt-10 mb-3 text-lg">Sample routes</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-[#f3d4ff]">
              {["#", "Route", "TVL", "1D volume", "30D volume", "1D vol/TVL", "Sample APR"].map((heading) => (
                <th key={heading} className="bg-[#6d28d9] px-3 py-3 font-medium first:rounded-l-2xl last:rounded-r-2xl">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE_POOLS.map((pool, index) => (
              <tr key={pool.id}>
                <td className="px-3 py-4 text-[#f3d4ff]">{index + 1}</td>
                <td className="px-3 py-4 font-medium">{pool.pair}</td>
                <td className="px-3 py-4 tabular">{formatCompactUsd(pool.tvlUsd)}</td>
                <td className="px-3 py-4 tabular">{formatCompactUsd(pool.volume1dUsd)}</td>
                <td className="px-3 py-4 tabular">{formatCompactUsd(pool.volume30dUsd)}</td>
                <td className="px-3 py-4 tabular">{pool.volTvl.toFixed(2)}</td>
                <td className="px-3 py-4 tabular text-[#3dcc7a]">{pool.aprPct.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PortfolioScreen() {
  const app = useApp();
  const rows = TOKENS.map((token) => {
    const balance = app.balances[token.id] ?? 0;
    return { token, balance, value: balance * token.priceUsd };
  });
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  if (!app.wallet) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-4">
        <div className="max-w-md text-center">
          <Mascot pose="wave" alt="" className="mx-auto h-40 w-40 object-contain" />
          <h1 className="text-3xl font-medium">Portfolio</h1>
          <p className="mt-3 text-[#f3d4ff]">Connect a demo wallet to see sample Base balances for the draft allowlist.</p>
          <button className="mt-5 rounded-full bg-[#ffe14a] px-5 py-2.5 font-semibold text-[#1a1408]" onClick={() => app.openModal("connect")}>
            Connect wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-10 pb-16">
      <p className="text-sm text-[#f3d4ff]">{app.wallet.name} · demo session</p>
      <h1 className="mt-2 text-4xl font-medium tabular">{formatUsd(total)}</h1>
      <p className="mt-1 text-sm text-[#f3d4ff]">Sample value on Base. Balances change only inside this demo.</p>
      <div className="mt-8 overflow-hidden rounded-3xl border border-white/10">
        {rows.map((row) => (
          <div key={row.token.id} className="flex items-center gap-3 border-b border-white/5 px-4 py-4 last:border-b-0">
            <TokenIcon token={row.token} size={36} />
            <div className="flex-1">
              <div className="font-medium">{row.token.symbol}</div>
              <div className="text-sm text-[#f3d4ff]">{row.token.name}</div>
            </div>
            <div className="text-right">
              <div className="tabular">{formatToken(row.balance)}</div>
              <div className="text-sm text-[#f3d4ff] tabular">{formatUsd(row.value)}</div>
            </div>
          </div>
        ))}
      </div>
      <h2 className="mt-8 mb-3 text-lg">Activity</h2>
      {app.activity.length === 0 ? (
        <div className="flex items-center gap-3">
          <Mascot pose="shock" alt="" className="h-16 w-16 object-contain" />
          <p className="text-sm text-[#fff4b8]">No demo swaps yet. The centurion is waiting.</p>
        </div>
      ) : (
        <ul className="grid gap-2">
          {app.activity.map((item) => (
            <li key={item.id} className="rounded-2xl bg-[#6d28d9] px-4 py-3 text-sm">
              <span className="font-medium">{item.pair}</span>
              <span className="mt-1 block text-[#f3d4ff]">{item.sellAmount} for {item.buyAmount} · {item.when} · not broadcast</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GoldButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="rounded-full bg-[#ffe14a] px-4 py-2 text-sm font-semibold text-[#1a1408]" onClick={onClick}>
      {label}
    </button>
  );
}

function GhostButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="rounded-full border border-[#ffe14a]/40 px-4 py-2 text-sm text-[#ffe3a3]" onClick={onClick}>
      {label}
    </button>
  );
}

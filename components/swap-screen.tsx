"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp, type Timeframe } from "@/components/app-state";
import { Mascot } from "@/components/mascot";
import { series, TokenIcon } from "@/components/token-icon";
import { formatToken, formatUsd, sanitizeAmount } from "@/lib/format";

const TABS = [
  { href: "/swap", label: "Swap" },
  { href: "/limit", label: "Limit" },
  { href: "/buy", label: "Buy" },
  { href: "/sell", label: "Sell" },
];

const FRAMES: Timeframe[] = ["1H", "1D", "1W", "1M", "1Y"];

export function TradeTabs({ current }: { current: string }) {
  return (
    <div className="mb-3 flex items-center justify-between px-1">
      <div className="flex items-center gap-1">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-3 py-1.5 text-sm ${current === tab.href ? "bg-[#ffe14a] font-semibold text-[#3b1608]" : "text-[#fff4b8] hover:text-white"}`}
            aria-current={current === tab.href ? "page" : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SwapScreen() {
  const app = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customSlippage, setCustomSlippage] = useState("");
  const buy = app.buyToken;
  const amount = app.sellAmountNumber;
  const balance = app.balances[app.sellToken.id] ?? 0;
  const overBalance = Boolean(app.wallet) && amount > balance + 1e-12;
  const quote = app.quote;

  let action = "Connect wallet";
  let disabled = false;
  let onAction = () => app.openModal("connect");
  if (app.wallet && !buy) {
    action = "Select a token";
    onAction = () => app.openModal("token-buy");
  } else if (app.wallet && (!(amount > 0) || !quote)) {
    action = "Enter an amount";
    disabled = true;
    onAction = () => undefined;
  } else if (app.wallet && overBalance) {
    action = `Insufficient ${app.sellToken.symbol} balance`;
    disabled = true;
    onAction = () => undefined;
  } else if (app.wallet && quote) {
    action = "Swap";
    onAction = () => app.openModal("review");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-3 pt-4 pb-16">
      <div className="mb-5 overflow-hidden rounded-[28px] shadow-[0_16px_40px_rgba(255,77,141,0.35)] ring-4 ring-[#ffe14a]">
        <Mascot
          pose="chariot"
          alt="Cartoon Roman centurion racing a coin chariot toward the moon"
          className="h-36 w-full object-cover sm:h-52"
        />
      </div>
      <div className="mx-auto grid items-start justify-center gap-2 lg:grid-cols-[190px_minmax(0,480px)_190px]">
        <figure className="hidden pt-8 text-center lg:block">
          <Mascot pose="wave" alt="" className="mx-auto w-40" />
          <figcaption className="mt-1 text-sm font-semibold text-[#fff4b8]">Ave, trader</figcaption>
        </figure>
        <div className="flex min-w-0 flex-col">
          <div className="mb-3 flex items-center justify-center gap-3 lg:hidden">
            <Mascot pose="wave" alt="" className="h-16 w-16 object-contain" />
            <p className="text-sm font-semibold text-[#fff4b8]">Ave, trader. The legion is in a good mood.</p>
          </div>
      {app.chartOpen && buy ? <PriceChart /> : null}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-full px-3 py-1.5 text-sm ${tab.href === "/swap" ? "bg-[#ffe14a] font-semibold text-[#3b1608]" : "text-[#fff4b8] hover:text-white"}`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <div className="relative flex items-center">
          <button
            className="grid h-9 w-9 place-items-center rounded-full text-[#f3d4ff] hover:bg-white/5 hover:text-white"
            aria-label="Price chart"
            aria-pressed={app.chartOpen}
            onClick={() => app.setChartOpen(!app.chartOpen)}
          >
            <ChartIcon />
          </button>
          <button
            className="grid h-9 w-9 place-items-center rounded-full text-[#f3d4ff] hover:bg-white/5 hover:text-white"
            aria-label="Swap settings"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((open) => !open)}
          >
            <GearIcon />
          </button>
          {settingsOpen ? (
            <div className="absolute top-10 right-0 z-20 w-72 rounded-2xl border border-white/10 bg-[#6d28d9] p-4 shadow-2xl">
              <p className="mb-2 text-sm font-medium">Max slippage</p>
              <div className="flex gap-2">
                <button
                  className={`rounded-full px-3 py-1 text-sm ${app.slippageBps === 50 ? "bg-[#ffe14a] text-[#1a1408]" : "bg-white/10"}`}
                  onClick={() => app.setSlippageBps(50)}
                >
                  Auto · 0.50%
                </button>
                <input
                  value={customSlippage}
                  inputMode="decimal"
                  aria-label="Custom slippage percent"
                  placeholder="Custom"
                  className="w-24 rounded-full bg-white/5 px-3 py-1 text-sm outline-none"
                  onChange={(event) => {
                    const next = sanitizeAmount(event.target.value, 2);
                    setCustomSlippage(next);
                    const bps = Math.round(Number(next) * 100);
                    if (next && Number.isFinite(bps)) app.setSlippageBps(bps);
                  }}
                />
              </div>
              <label className="mt-4 block text-sm font-medium">
                Swap deadline
                <input
                  value={app.deadlineMin}
                  aria-label="Swap deadline in minutes"
                  className="mt-2 w-full rounded-xl bg-white/5 px-3 py-2 outline-none"
                  onChange={(event) => app.setDeadlineMin(Number(event.target.value.replace(/\D/g, "")) || 1)}
                />
                <span className="mt-1 block text-xs font-normal text-[#f3d4ff]">Minutes before a live quote would expire. Stored locally in this demo.</span>
              </label>
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative">
        <TokenField
          label="Sell"
          token={app.sellToken}
          amount={app.sellAmount}
          usd={amount > 0 ? amount * app.sellToken.priceUsd : 0}
          over={overBalance}
          onAmount={(value) => app.setSellAmount(sanitizeAmount(value, app.sellToken.decimals))}
          onPick={() => app.openModal("token-sell")}
          balance={app.wallet ? balance : null}
          onMax={
            app.wallet
              ? () => app.setSellAmount(trimAmount(balance, Math.min(app.sellToken.decimals, 8)))
              : undefined
          }
        />
        <button
          className="absolute top-[46%] left-1/2 z-10 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl border-4 border-[#7c3aed] bg-[#ffe14a] text-[#3b1608] hover:bg-[#fff3a1]"
          aria-label="Flip tokens"
          onClick={app.flip}
        >
          <ArrowDown />
        </button>
        <div className="h-2" />
        <TokenField
          label="Buy"
          token={buy}
          amount={quote ? trimAmount(quote.buyAmount, 6) : ""}
          usd={quote?.buyValueUsd ?? 0}
          readOnly
          onPick={() => app.openModal("token-buy")}
          placeholder={buy ? "0" : "0"}
        />
      </div>

      {quote && buy ? (
        <div className="mt-2 rounded-2xl border border-[#ffe14a]/45 bg-[#6d28d9] px-4 py-3 text-sm">
          <Detail label="Rate" value={`1 ${app.sellToken.symbol} = ${formatToken(quote.rate)} ${buy.symbol}`} />
          <Detail label="Fee · 0.25%" value={`${formatToken(quote.feeAmount)} ${quote.feeToken.symbol}`} />
          <Detail label="Minimum received" value={`${formatToken(quote.minReceived)} ${buy.symbol}`} />
          <Detail label="Network" value="Base" />
          <p className="pt-1 text-xs leading-5 text-[#f3d4ff]">
            {quote.feeToken.id === "usdc"
              ? "Sample fee is taken in native Base USDC because USDC is in the pair."
              : `Sample fee stays in ${quote.feeToken.symbol} because USDC is not in the pair.`}
            {" "}This is not a firm 0x quote.
          </p>
        </div>
      ) : null}

      <button
        className={`mt-2 h-14 w-full rounded-2xl text-base font-semibold ${disabled ? "bg-[#4c1d95] text-[#f3d4ff]" : "bg-[#ffe14a] text-[#3b1608] hover:bg-[#fff3a1]"}`}
        disabled={disabled}
        onClick={onAction}
      >
        {action}
      </button>
      <p className="mt-6 text-center text-xs text-[#fff4b8]">
        <Link className="hover:text-white" href="/terms">Terms of Service</Link>
        <span> · </span>
        <Link className="hover:text-white" href="/privacy">Privacy Policy</Link>
      </p>
        </div>
        <figure className="hidden pt-16 text-center lg:block">
          <Mascot pose="thumbs" alt="" className="mx-auto w-40" />
          <figcaption className="mt-1 text-sm font-semibold text-[#fff4b8]">This quote? Approved.</figcaption>
        </figure>
      </div>
    </div>
  );
}

function TokenField({
  label,
  token,
  amount,
  usd,
  onAmount,
  onPick,
  balance,
  onMax,
  readOnly,
  over,
  placeholder = "0",
}: {
  label: string;
  token: { id: string; symbol: string; accent: string } | null;
  amount: string;
  usd: number;
  onAmount?: (value: string) => void;
  onPick: () => void;
  balance?: number | null;
  onMax?: () => void;
  readOnly?: boolean;
  over?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="rounded-[22px] border border-[#ffe14a]/45 bg-[#6d28d9] px-4 py-4 shadow-[0_12px_32px_rgba(76,29,149,0.28)]">
      <div className="mb-1 flex items-center justify-between text-sm text-[#f3d4ff]">
        <span>{label}</span>
        {balance != null && token ? (
          <span>
            Balance: {formatToken(balance)}
            {onMax ? (
              <button className="ml-2 font-semibold text-[#ffe14a]" onClick={onMax}>Max</button>
            ) : null}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        {readOnly ? (
          <div className={`min-w-0 flex-1 truncate text-[36px] leading-none tabular ${amount ? "text-white" : "text-[#e9d5ff]"}`}>
            {amount || placeholder}
          </div>
        ) : (
          <input
            value={amount}
            inputMode="decimal"
            placeholder={placeholder}
            aria-label={`${label} amount`}
            className={`min-w-0 flex-1 bg-transparent text-[36px] leading-none tabular outline-none placeholder:text-[#e9d5ff] ${over ? "text-[#ff8fb0]" : "text-white"}`}
            onChange={(event) => onAmount?.(event.target.value)}
          />
        )}
        <button
          className={`flex shrink-0 items-center gap-2 rounded-full py-1.5 pr-2 pl-1.5 text-sm font-semibold ${token ? "bg-[#4c1d95] hover:bg-[#5b21b6]" : "bg-[#ffe14a] pl-3 text-[#3b1608] hover:bg-[#fff3a1]"}`}
          onClick={onPick}
        >
          {token ? <TokenIcon token={token} size={24} /> : null}
          {token ? token.symbol : "Select token"}
          <Caret />
        </button>
      </div>
      <div className="mt-2 text-sm text-[#f3d4ff] tabular">{formatUsd(usd)}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <span className="text-[#f3d4ff]">{label}</span>
      <span className="text-right tabular">{value}</span>
    </div>
  );
}

function PriceChart() {
  const app = useApp();
  const buy = app.buyToken;
  if (!buy) return null;
  const points = series(`${app.sellToken.id}-${buy.id}-${app.timeframe}`, 48);
  const width = 440;
  const height = 160;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const coords = points.map((point, index) => {
    const x = (index / (points.length - 1)) * width;
    const y = height - ((point - min) / span) * (height - 16) - 8;
    return [x, y] as const;
  });
  const line = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <section className="mb-4 rounded-[22px] border border-[#ffe14a]/45 bg-[#6d28d9] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[#f3d4ff]">{app.sellToken.symbol} / {buy.symbol}</p>
          <p className="text-2xl font-medium tabular">{formatUsd(app.sellToken.priceUsd)}</p>
          <p className="text-xs text-[#f3d4ff]">Sample {app.timeframe} path · not a live market</p>
        </div>
        <div className="flex gap-1">
          {FRAMES.map((frame) => (
            <button
              key={frame}
              className={`rounded-lg px-2 py-1 text-xs ${app.timeframe === frame ? "bg-white/10 text-white" : "text-[#f3d4ff]"}`}
              onClick={() => app.setTimeframe(frame)}
            >
              {frame}
            </button>
          ))}
        </div>
      </div>
      <svg className="mt-3 w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Sample price chart">
        <path d={area} fill="rgba(255,225,74,0.28)" />
        <path d={line} fill="none" stroke="#ffe14a" strokeWidth="2.5" />
      </svg>
    </section>
  );
}

function trimAmount(value: number, digits: number): string {
  const text = value.toFixed(digits);
  return text.replace(/\.?0+$/, "");
}

function Caret() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path d="M8 3v9M4 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path d="M2 13l4-4 3 2 6-7" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <circle cx="9" cy="9" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 2.5v2M9 13.5v2M2.5 9h2M13.5 9h2M4.2 4.2l1.4 1.4M12.4 12.4l1.4 1.4M13.8 4.2l-1.4 1.4M5.6 12.4l-1.4 1.4" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

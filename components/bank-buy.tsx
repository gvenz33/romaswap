"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/app-state";
import { TradeTabs } from "@/components/swap-screen";
import { TokenIcon } from "@/components/token-icon";
import { bankBuyQuote } from "@/lib/bank";
import { formatToken, formatUsd, sanitizeAmount, shortAddress } from "@/lib/format";
import { assetNetwork, networkLabel } from "@/lib/tokens";

export function BankBuyScreen() {
  const app = useApp();
  const [usdText, setUsdText] = useState("");
  const [saved, setSaved] = useState(false);
  const receive = app.buyToken;

  useEffect(() => {
    if (!app.buyToken) app.setBuyToken("usdc");
  }, [app.buyToken, app.setBuyToken]);

  const usd = Number(usdText);
  const quote = receive ? bankBuyQuote(usd, receive.priceUsd) : null;
  const onBase = receive ? assetNetwork(receive) === "base" : false;
  const walletReady = Boolean(app.wallet && (onBase ? app.wallet.chainOk : false));

  let action = "Connect wallet";
  let disabled = false;
  let onAction = () => app.openModal("connect");
  if (receive && !onBase) {
    action = "Choose a Base token";
    onAction = () => app.openModal("token-buy");
  } else if (app.wallet && !app.wallet.chainOk) {
    action = app.switchingChain ? "Switching to Base" : "Switch to Base";
    disabled = app.switchingChain;
    onAction = () => void app.switchToBase();
  } else if (app.wallet && !receive) {
    action = "Select a token";
    onAction = () => app.openModal("token-buy");
  } else if (app.wallet && usd > 0 && receive && receive.priceUsd <= 0) {
    action = "Waiting for a live price";
    disabled = true;
    onAction = () => undefined;
  } else if (app.wallet && !quote) {
    action = "Enter a dollar amount";
    disabled = true;
    onAction = () => undefined;
  } else if (walletReady && quote && receive) {
    action = saved ? "Preview saved" : "Review bank purchase";
    disabled = saved;
    onAction = () => setSaved(true);
  }

  return (
    <div className="mx-auto w-full max-w-[480px] px-3 pt-8 pb-16">
      <TradeTabs current="/buy" />
      <div className="rounded-[22px] border border-[#ffe14a]/45 bg-[#6d28d9] p-4">
        <p className="text-sm font-medium">From your bank</p>
        <label className="mt-3 block rounded-2xl bg-white/5 px-4 py-3">
          <span className="text-xs text-[#f3d4ff]">You send</span>
          <span className="mt-1 flex items-center gap-3">
            <input
              aria-label="Dollars from your bank"
              inputMode="decimal"
              placeholder="0"
              value={usdText}
              className="w-full bg-transparent text-3xl outline-none placeholder:text-white/30"
              onChange={(event) => {
                setSaved(false);
                setUsdText(sanitizeAmount(event.target.value, 2));
              }}
            />
            <span className="shrink-0 rounded-full bg-[#ffe14a] px-3 py-1 text-sm font-semibold text-[#3b1608]">Bank · USD</span>
          </span>
        </label>
        <div className="mt-2 rounded-2xl bg-white/5 px-4 py-3">
          <span className="text-xs text-[#f3d4ff]">You receive</span>
          <div className="mt-1 flex items-center gap-3">
            <p className="min-w-0 flex-1 truncate text-3xl tabular">{quote && receive ? formatToken(quote.receive) : "0"}</p>
            <button
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold"
              onClick={() => app.openModal("token-buy")}
            >
              {receive ? <TokenIcon token={receive} /> : null}
              {receive ? receive.symbol : "Select token"}
            </button>
          </div>
          <p className="mt-1 text-xs text-[#f3d4ff]">
            {receive ? `${receive.name} · ${networkLabel(receive)}` : "Pick the token for your wallet"}
            {app.wallet ? ` · ${shortAddress(app.wallet.address)}` : ""}
          </p>
        </div>

        {quote && receive ? (
          <div className="mt-3 rounded-2xl border border-[#ffe14a]/45 px-4 py-3 text-sm">
            <p className="flex justify-between gap-3"><span>Bank payment</span><span>{formatUsd(usd)}</span></p>
            <p className="mt-1 flex justify-between gap-3"><span>Fee · 0.25%</span><span>{formatUsd(quote.feeUsd)}</span></p>
            <p className="mt-1 flex justify-between gap-3"><span>You receive</span><span>{formatToken(quote.receive)} {receive.symbol}</span></p>
            <p className="pt-2 text-xs leading-5 text-[#f3d4ff]">
              {onBase
                ? "Live USD conversion into the wallet you connect. Your bank is not charged, and no crypto is sent."
                : `${receive.symbol} lives on ${networkLabel(receive)}. This Base wallet cannot receive it. Choose a Base token such as USDC or cbBTC.`}
            </p>
          </div>
        ) : null}

        <button
          className={`mt-3 h-14 w-full rounded-2xl text-base font-semibold ${disabled ? "bg-[#4c1d95] text-[#f3d4ff]" : "bg-[#ffe14a] text-[#3b1608] hover:bg-[#fff3a1]"}`}
          disabled={disabled}
          onClick={onAction}
        >
          {action}
        </button>

        <ol className="mt-4 grid gap-2 text-sm">
          <li className="flex justify-between gap-3 text-[#f3d4ff]"><span>1. Connect your wallet</span><span>{app.wallet ? shortAddress(app.wallet.address) : "Destination"}</span></li>
          <li className="flex justify-between gap-3 text-[#f3d4ff]"><span>2. Pay from your bank</span><span>Not charged</span></li>
          <li className="flex justify-between gap-3 text-[#f3d4ff]"><span>3. Receive {receive?.symbol ?? "crypto"}</span><span>{receive ? networkLabel(receive) : "Wallet"}</span></li>
        </ol>
        <p className="mt-3 text-xs leading-5 text-[#f3d4ff]">
          RomaSwap does not ask for a bank login, account number, or routing number.
        </p>
        {saved && quote && receive ? (
          <p className="mt-3 rounded-2xl bg-[#3b1608] px-4 py-3 text-sm text-[#ffe14a]" role="status">
            Preview saved in this browser. {formatUsd(usd)} was not taken from a bank, and {formatToken(quote.receive)} {receive.symbol} was not sent.
          </p>
        ) : null}
      </div>
    </div>
  );
}

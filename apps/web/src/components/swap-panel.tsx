"use client";

import {
  ALLOWLIST,
  BASE_CHAIN_ID,
  type AllowlistedToken,
} from "@romaswap/config";
import { formatBaseUnits, parseHumanAmount, type NormalizedQuote } from "@romaswap/swap";
import { useEffect, useMemo, useState } from "react";
import { base } from "wagmi/chains";
import {
  useAccount,
  useBalance,
  usePublicClient,
  useReadContract,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { erc20Abi } from "@/lib/erc20";

type Status = {
  live: boolean;
  quotesEnabled: boolean;
  executionEnabled: boolean;
  feeBps: number;
  reason: string;
};

type Phase =
  | "editing"
  | "priced"
  | "review"
  | "approval"
  | "signing"
  | "pending"
  | "confirmed"
  | "reverted"
  | "rejected";

type ApiError = { error?: { code?: string; message?: string } };

function tokenByAddress(address: string): AllowlistedToken | undefined {
  return ALLOWLIST.find((token) => token.address.toLowerCase() === address.toLowerCase());
}

async function readError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => ({}))) as ApiError;
  return body.error?.message ?? "The request failed.";
}

export function SwapPanel() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: base.id });
  const [sell, setSell] = useState<AllowlistedToken>(ALLOWLIST[0]);
  const [buy, setBuy] = useState<AllowlistedToken>(ALLOWLIST[2]);
  const [amount, setAmount] = useState("0.1");
  const [slippageBps, setSlippageBps] = useState(50);
  const [status, setStatus] = useState<Status | null>(null);
  const [preview, setPreview] = useState<NormalizedQuote | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [firm, setFirm] = useState<NormalizedQuote | null>(null);
  const [phase, setPhase] = useState<Phase>("editing");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const receipt = useWaitForTransactionReceipt({ hash: txHash, chainId: base.id, query: { enabled: Boolean(txHash) } });

  const onBase = !isConnected || chainId === BASE_CHAIN_ID;
  const sellAmount = parseHumanAmount(amount, sell.decimals);
  const nativeBalance = useBalance({
    address,
    chainId: base.id,
    query: { enabled: Boolean(address && onBase) },
  });
  const tokenBalance = useReadContract({
    address: sell.native ? undefined : sell.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: base.id,
    query: { enabled: Boolean(address && onBase && !sell.native) },
  });
  const allowance = useReadContract({
    address: sell.native ? undefined : sell.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && firm?.allowanceSpender ? [address, firm.allowanceSpender] : undefined,
    chainId: base.id,
    query: { enabled: Boolean(address && firm?.allowanceSpender && !sell.native) },
  });

  const balance = sell.native ? nativeBalance.data?.value : tokenBalance.data;
  const insufficient =
    isConnected && onBase && sellAmount !== null && balance !== undefined && balance < sellAmount;
  const gasStarved =
    isConnected &&
    onBase &&
    sellAmount !== null &&
    !sell.native &&
    nativeBalance.data !== undefined &&
    nativeBalance.data.value === 0n;
  const nativeTight =
    isConnected &&
    onBase &&
    sell.native &&
    sellAmount !== null &&
    nativeBalance.data !== undefined &&
    nativeBalance.data.value <= sellAmount;

  useEffect(() => {
    void fetch("/api/status")
      .then((response) => response.json())
      .then((body: Status) => setStatus(body))
      .catch(() => setMessage("RomaSwap could not read its own status."));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setFirm(null);
    setPreview(null);
    setViewId(null);
    setPhase("editing");
    setTxHash(undefined);
  }, [sell.address, buy.address, amount, slippageBps, address, chainId]);

  useEffect(() => {
    if (!onBase || !status?.quotesEnabled || sell.address === buy.address || sellAmount === null || sellAmount === 0n) {
      return;
    }
    const handle = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setMessage(null);
        try {
          const response = await fetch("/api/swap/price", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              sellToken: sell.address,
              buyToken: buy.address,
              sellAmount: sellAmount.toString(),
              slippageBps,
              taker: address,
            }),
          });
          if (!response.ok) {
            setPreview(null);
            setMessage(await readError(response));
            setPhase("editing");
            return;
          }
          const body = (await response.json()) as { quote: NormalizedQuote; viewId: string };
          setPreview(body.quote);
          setViewId(body.viewId);
          setPhase("priced");
        } catch {
          setMessage("The price request timed out. Nothing was sent to your wallet.");
        } finally {
          setLoading(false);
        }
      })();
    }, 400);
    return () => window.clearTimeout(handle);
  }, [address, buy.address, onBase, sell.address, sellAmount, slippageBps, status?.quotesEnabled]);

  useEffect(() => {
    if (!txHash || !receipt.isSuccess || !address) return;
    const reverted = receipt.data.status === "reverted";
    setPhase(reverted ? "reverted" : "confirmed");
    void fetch("/api/swap/history", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        wallet: address,
        state: reverted ? "reverted" : "confirmed",
        txHash,
        pair: `${sell.symbol}/${buy.symbol}`,
        source: "live",
        result: reverted ? "Transaction reverted. No fee was collected." : "Confirmed on Base.",
      }),
    });
  }, [address, buy.symbol, receipt.data?.status, receipt.isSuccess, sell.symbol, txHash]);

  const shown = firm ?? preview;
  const stale = shown ? now > shown.expiresAt : false;
  const needsApproval =
    Boolean(firm && !sell.native && firm.allowanceSpender && (allowance.data ?? 0n) < (sellAmount ?? 0n));

  const buyText = shown ? formatBaseUnits(BigInt(shown.buyAmount), buy.decimals) : null;
  const minText = shown ? formatBaseUnits(BigInt(shown.minBuyAmount), buy.decimals) : null;
  const feeText =
    shown?.integratorFee && tokenByAddress(shown.integratorFee.token)
      ? `${formatBaseUnits(BigInt(shown.integratorFee.amount), tokenByAddress(shown.integratorFee.token)!.decimals)} ${shown.feeSymbol}`
      : null;
  const gasText = useMemo(() => {
    if (!shown?.estimatedGas || !shown.gasPrice) return null;
    try {
      const wei = BigInt(shown.estimatedGas) * BigInt(shown.gasPrice);
      return `${formatBaseUnits(wei, 18, 6)} ETH`;
    } catch {
      return null;
    }
  }, [shown]);

  async function review() {
    if (!address) {
      setMessage("Connect a wallet before reviewing a firm quote.");
      return;
    }
    if (!onBase) {
      setMessage("Switch to Base before reviewing a swap.");
      return;
    }
    if (!viewId || !sellAmount) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/swap/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          viewId,
          sellToken: sell.address,
          buyToken: buy.address,
          sellAmount: sellAmount.toString(),
          slippageBps,
          taker: address,
        }),
      });
      if (!response.ok) {
        setMessage(await readError(response));
        return;
      }
      const body = (await response.json()) as { quote: NormalizedQuote };
      setFirm(body.quote);
      setPhase("review");
    } catch {
      setMessage("The firm quote failed. No transaction was opened.");
    } finally {
      setLoading(false);
    }
  }

  async function approve() {
    if (!address || !firm?.allowanceSpender || !sellAmount || sell.native) return;
    setPhase("approval");
    setMessage(null);
    try {
      const hash = await writeContractAsync({
        address: sell.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [firm.allowanceSpender, sellAmount],
        chainId: base.id,
      });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      setFirm(null);
      setMessage("Approval confirmed. Request a fresh quote before swapping. The previous quote was discarded.");
      setPhase("editing");
    } catch (error) {
      setPhase("rejected");
      setMessage(error instanceof Error ? error.message : "The wallet rejected the approval.");
      void fetch("/api/swap/history", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          state: "rejected",
          pair: `${sell.symbol}/${buy.symbol}`,
          source: firm.source,
          result: "Wallet rejected the approval.",
        }),
      });
    }
  }

  async function execute() {
    if (!address || !firm || stale) return;
    if (firm.simulationOnly || !firm.executable || !firm.transaction) {
      setPhase("confirmed");
      setMessage("Simulated on this machine. No transaction was broadcast and no funds moved.");
      const entry = {
        wallet: address,
        state: "simulated" as const,
        pair: `${sell.symbol}/${buy.symbol}`,
        source: "mock" as const,
        result: "Sample quote. Not sent to Base.",
        at: new Date().toISOString(),
      };
      const prior = JSON.parse(window.localStorage.getItem("romaswap.history") ?? "[]") as unknown[];
      window.localStorage.setItem("romaswap.history", JSON.stringify([entry, ...prior].slice(0, 40)));
      void fetch("/api/swap/history", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(entry),
      });
      return;
    }
    setPhase("signing");
    try {
      const hash = await sendTransactionAsync({
        to: firm.transaction.to,
        data: firm.transaction.data,
        value: BigInt(firm.transaction.value),
        chainId: base.id,
      });
      setTxHash(hash);
      setPhase("pending");
      setMessage("Transaction submitted. Waiting for the Base receipt.");
      void fetch("/api/swap/history", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          state: "submitted",
          txHash: hash,
          pair: `${sell.symbol}/${buy.symbol}`,
          source: "live",
          quoteRef: String(firm.quotedAt),
        }),
      });
    } catch (error) {
      setPhase("rejected");
      setMessage(error instanceof Error ? error.message : "The wallet rejected the swap. Nothing was broadcast.");
      void fetch("/api/swap/history", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          state: "rejected",
          pair: `${sell.symbol}/${buy.symbol}`,
          source: "live",
          result: "Wallet rejected the swap.",
        }),
      });
    }
  }

  function flip() {
    setSell(buy);
    setBuy(sell);
    setAmount("");
  }

  const blockedReason = !status?.quotesEnabled
    ? status?.reason
    : !onBase
      ? "This wallet is not on Base. Quotes and swaps stay blocked."
      : sell.address === buy.address
        ? "Choose two different tokens."
        : insufficient
          ? `This wallet does not hold enough ${sell.symbol}.`
          : gasStarved
            ? "This wallet has no ETH to pay Base gas."
            : nativeTight
              ? "Leave some ETH in the wallet for gas. The sell amount uses the full balance."
              : stale
                ? "This quote expired. Edit the amount or review again for a fresh price."
                : null;

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:px-6 md:py-12">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-gold">Aggregator on Base</p>
        <h1 className="mt-3 font-serif text-5xl leading-none text-cream md:text-7xl">Swap without handing over the keys.</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-mute">
          You sign from your own wallet. RomaSwap routes through 0x on Base and shows a {status?.feeBps ?? 25} bps fee
          before anything is signed. {status?.live ? "Live quotes are on." : "These figures are samples until launch approval."}
        </p>
        <dl className="mt-8 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-2xl border border-line p-3">
            <dt className="text-mute">Network</dt>
            <dd className="mt-1 text-cream">Base</dd>
          </div>
          <div className="rounded-2xl border border-line p-3">
            <dt className="text-mute">Fee</dt>
            <dd className="mt-1 text-cream">0.25%</dd>
          </div>
          <div className="rounded-2xl border border-line p-3">
            <dt className="text-mute">Custody</dt>
            <dd className="mt-1 text-cream">None</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-[2rem] border border-line bg-panel p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)] md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-gold-bright">{shown?.simulationOnly ? "Sample quote" : shown ? "Indicative price" : "Price"}</p>
          <p className="text-xs text-mute" aria-live="polite">
            {loading ? "Requesting a price…" : stale ? "Stale" : shown ? "Fresh" : "Waiting for an amount"}
          </p>
        </div>

        <TokenRow
          label="Sell"
          token={sell}
          onToken={setSell}
          amount={amount}
          onAmount={setAmount}
          balance={balance !== undefined ? formatBaseUnits(balance, sell.decimals) : null}
        />
        <div className="relative z-10 -my-3 flex justify-center">
          <Button type="button" variant="quiet" size="sm" onClick={flip} aria-label="Reverse the pair">
            Reverse
          </Button>
        </div>
        <div className="rounded-2xl border border-line bg-ink/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-mute">Buy</span>
            <label className="text-xs text-mute">
              Token
              <select
                className="ml-2 rounded-full border border-line bg-ink px-2 py-1 text-cream"
                value={buy.address}
                onChange={(event) => {
                  const next = ALLOWLIST.find((token) => token.address === event.target.value);
                  if (next) setBuy(next);
                }}
                aria-label="Buy token"
              >
                {ALLOWLIST.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="mt-3 font-sans text-4xl tabular-nums text-cream">{buyText ?? "—"}</p>
          <p className="text-sm text-mute">{buy.name}</p>
        </div>

        <label className="mt-4 flex items-center justify-between gap-3 text-sm text-mute">
          Slippage
          <span className="flex items-center gap-2">
            <input
              className="w-20 rounded-lg border border-line bg-ink px-2 py-1 text-right text-cream"
              inputMode="numeric"
              aria-label="Slippage in basis points"
              value={slippageBps}
              onChange={(event) => setSlippageBps(Number(event.target.value))}
            />
            <span>bps</span>
          </span>
        </label>

        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Minimum received" value={minText ? `${minText} ${buy.symbol}` : "—"} />
          <Row label="RomaSwap fee" value={feeText ?? "—"} />
          <Row
            label="0x fee"
            value={
              shown?.zeroExFee && shown.zeroExFee.amount !== "0"
                ? `${shown.zeroExFee.amount} base units`
                : "Included in the quoted buy amount"
            }
          />
          <Row label="Estimated gas" value={gasText ?? "—"} />
          <Row
            label="Quoted"
            value={shown ? new Date(shown.quotedAt).toLocaleTimeString() : "—"}
          />
        </dl>

        {blockedReason ? <p className="mt-4 text-sm text-danger" role="status">{blockedReason}</p> : null}
        {message ? <p className="mt-3 text-sm text-cream" role="status">{message}</p> : null}
        {!onBase && isConnected ? (
          <Button className="mt-4 w-full" onClick={() => switchChain({ chainId: BASE_CHAIN_ID })}>
            Switch to Base
          </Button>
        ) : null}

        <div className="mt-4 grid gap-2">
          <Button
            className="w-full"
            variant="quiet"
            disabled={!preview || loading || Boolean(blockedReason) || !address}
            onClick={() => void review()}
          >
            {loading ? "Working…" : "Review firm quote"}
          </Button>
          {needsApproval ? (
            <Button className="w-full" disabled={stale || firm?.simulationOnly} onClick={() => void approve()}>
              {firm?.simulationOnly ? "Approval stays off in sample mode" : `Approve exact ${sell.symbol}`}
            </Button>
          ) : (
            <Button
              className="w-full"
              disabled={!firm || stale || Boolean(blockedReason) || phase === "signing" || phase === "pending"}
              onClick={() => void execute()}
            >
              {firm?.executable ? "Sign swap" : firm ? "Simulate swap" : "Sign swap"}
            </Button>
          )}
        </div>
        {txHash ? (
          <a
            className="mt-3 block text-center text-sm text-gold underline-offset-4 hover:underline"
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            View {phase} transaction on BaseScan
          </a>
        ) : null}
        <p className="mt-4 text-xs leading-5 text-mute">
          {status?.reason} An approval, when one is required, names only the AllowanceHolder spender from that quote.
          After approval, the old quote is thrown away.
        </p>
      </div>
    </section>
  );
}

function TokenRow({
  label,
  token,
  onToken,
  amount,
  onAmount,
  balance,
}: {
  label: string;
  token: AllowlistedToken;
  onToken: (token: AllowlistedToken) => void;
  amount: string;
  onAmount: (amount: string) => void;
  balance: string | null;
}) {
  return (
    <div className="rounded-2xl border border-line bg-ink/40 p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-mute">
        <span>{label}</span>
        <span>{balance ? `Balance ${balance}` : "Balance —"}</span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <input
          className="w-full bg-transparent font-sans text-4xl tabular-nums text-cream outline-none placeholder:text-line"
          inputMode="decimal"
          aria-label={`${label} amount`}
          value={amount}
          placeholder="0"
          onChange={(event) => onAmount(event.target.value)}
        />
        <label className="shrink-0 text-xs text-mute">
          <span className="sr-only">{label} token</span>
          <select
            className="rounded-full border border-line bg-ink px-3 py-2 text-sm text-cream"
            value={token.address}
            onChange={(event) => {
              const next = ALLOWLIST.find((item) => item.address === event.target.value);
              if (next) onToken(next);
            }}
          >
            {ALLOWLIST.map((item) => (
              <option key={item.address} value={item.address}>
                {item.symbol}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-mute">{label}</dt>
      <dd className="text-right text-cream">{value}</dd>
    </div>
  );
}

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { erc20Abi, getAddress, isAddress } from "viem";
import { useAccount, useConnect, useDisconnect, usePublicClient, useSwitchChain } from "wagmi";
import { useBaseBalances } from "@/lib/balances";
import { BASE_CHAIN_ID } from "@/lib/config";
import { formatToken } from "@/lib/format";
import { cleanLabel, readImportedTokens, tokenFromImport, writeImportedTokens } from "@/lib/imported-tokens";
import { type LivePrice } from "@/lib/market";
import { buildQuote, type Quote } from "@/lib/quote";
import { TOKENS, type Token } from "@/lib/tokens";
import { walletChoices, type WalletChoice } from "@/lib/wallet-choices";
import { friendlyWalletError } from "@/lib/wallet-error";
import { walletConnectReady } from "@/lib/wagmi";

export type WalletSession = {
  name: string;
  address: string;
  chainOk: boolean;
};

export type Timeframe = "1H" | "1D" | "1W" | "1M" | "1Y";

export type Activity = {
  id: string;
  pair: string;
  sellAmount: string;
  buyAmount: string;
  when: string;
};

export type Notice = { title: string; body: string };

type Modal = null | "connect" | "search" | "token-sell" | "token-buy" | "review" | "receipt";

type AppState = {
  wallet: WalletSession | null;
  walletChoices: WalletChoice[];
  connect: (id: string) => Promise<void>;
  connectingId: string | null;
  connectError: string | null;
  disconnect: () => Promise<void>;
  switchToBase: () => Promise<void>;
  switchingChain: boolean;
  balances: Record<string, number>;
  balancesLoading: boolean;
  balancesError: boolean;
  tokens: Token[];
  pricesLive: boolean;
  importToken: (address: string) => Promise<{ id: string } | { error: string }>;
  removeImportedToken: (id: string) => void;
  sellToken: Token;
  buyToken: Token | null;
  setSellToken: (id: string) => void;
  setBuyToken: (id: string) => void;
  sellAmount: string;
  setSellAmount: (value: string) => void;
  flip: () => void;
  slippageBps: number;
  setSlippageBps: (value: number) => void;
  deadlineMin: number;
  setDeadlineMin: (value: number) => void;
  modal: Modal;
  openModal: (modal: Modal) => void;
  closeModal: () => void;
  chartOpen: boolean;
  setChartOpen: (open: boolean) => void;
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
  quote: Quote | null;
  sellAmountNumber: number;
  confirmDemoSwap: () => string | null;
  activity: Activity[];
  notice: Notice | null;
  setNotice: (notice: Notice | null) => void;
  searchOpen: boolean;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { address, chainId, connector } = useAccount();
  const { connectors, connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync, isPending: switchingChain } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: BASE_CHAIN_ID });
  const chainOk = chainId === BASE_CHAIN_ID;
  const wallet = address
    ? { name: connector?.name ?? "Wallet", address, chainOk }
    : null;
  const [customTokens, setCustomTokens] = useState<Token[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({});
  const [pricesLive, setPricesLive] = useState(false);
  const tracked = useMemo(() => [...TOKENS, ...customTokens], [customTokens]);
  const chainBalances = useBaseBalances(address, Boolean(address) && chainOk, tracked);

  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [sellTokenId, setSellTokenId] = useState("eth");
  const [buyTokenId, setBuyTokenId] = useState<string | null>(null);
  const [sellAmount, setSellAmount] = useState("");
  const [slippageBps, setSlippageBpsState] = useState(50);
  const [deadlineMin, setDeadlineMinState] = useState(30);
  const [modal, setModal] = useState<Modal>(null);
  const [chartOpen, setChartOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const [activity, setActivity] = useState<Activity[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    setCustomTokens(readImportedTokens());
  }, []);

  const extra = customTokens
    .map((token) => token.address)
    .filter((value): value is string => Boolean(value))
    .join(",");

  useEffect(() => {
    let cancel = false;
    async function loadPrices() {
      try {
        const response = await fetch(extra ? `/api/prices?extra=${extra}` : "/api/prices");
        if (!response.ok) return;
        const body = (await response.json()) as { ok?: boolean; prices?: Record<string, LivePrice> };
        if (cancel || !body.ok || !body.prices) return;
        setLivePrices(body.prices);
        setPricesLive(true);
      } catch {
        if (!cancel) setPricesLive(false);
      }
    }
    void loadPrices();
    const timer = window.setInterval(() => void loadPrices(), 60_000);
    return () => {
      cancel = true;
      window.clearInterval(timer);
    };
  }, [extra]);

  const tokens = useMemo(
    () =>
      tracked.map((token) => {
        const live = livePrices[token.id];
        if (!live || !(live.usd > 0)) return token;
        return { ...token, priceUsd: live.usd, change1d: live.change1d ?? token.change1d };
      }),
    [livePrices, tracked],
  );

  function findToken(id: string | null): Token | null {
    if (!id) return null;
    return tokens.find((token) => token.id === id) ?? null;
  }

  const choices = useMemo(
    () =>
      walletChoices(
        connectors.map((item) => ({ id: item.id, name: item.name, type: item.type, icon: item.icon })),
        walletConnectReady,
      ),
    [connectors],
  );

  const sellToken = findToken(sellTokenId) ?? tokens[0];
  const buyToken = findToken(buyTokenId);
  const usdc = findToken("usdc");
  const sellAmountNumber = Number(sellAmount);
  const parsedAmount = Number.isFinite(sellAmountNumber) ? sellAmountNumber : 0;

  const quote = useMemo(() => {
    if (!buyToken || !usdc) return null;
    return buildQuote({
      sell: sellToken,
      buy: buyToken,
      sellAmount: parsedAmount,
      slippageBps,
      usdc,
    });
  }, [buyToken, parsedAmount, sellToken, slippageBps, usdc]);

  function setSellToken(id: string) {
    if (id === buyTokenId) {
      setBuyTokenId(sellTokenId);
    }
    setSellTokenId(id);
  }

  function setBuyToken(id: string) {
    if (id === sellTokenId) {
      setSellTokenId(buyTokenId ?? "eth");
    }
    setBuyTokenId(id);
  }

  function flip() {
    if (!buyTokenId) return;
    setSellTokenId(buyTokenId);
    setBuyTokenId(sellTokenId);
  }

  async function connect(id: string) {
    setConnectError(null);
    const selected = connectors.find((item) => item.id === id);
    if (!selected) {
      setConnectError(
        id === "walletconnect-unavailable"
          ? "Mobile wallets need a WalletConnect project ID. Add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID and reload."
          : "That wallet is not available in this browser.",
      );
      return;
    }
    setConnectingId(id);
    try {
      const result = await connectAsync({ connector: selected, chainId: BASE_CHAIN_ID });
      setModal(null);
      if (result.chainId !== BASE_CHAIN_ID) {
        try {
          await switchChainAsync({ chainId: BASE_CHAIN_ID });
        } catch (error) {
          setNotice({ title: "Switch to Base", body: friendlyWalletError(error) });
        }
      }
    } catch (error) {
      setConnectError(friendlyWalletError(error));
    } finally {
      setConnectingId(null);
    }
  }

  async function disconnect() {
    try {
      await disconnectAsync();
    } catch (error) {
      setNotice({ title: "Still connected", body: friendlyWalletError(error) });
      return;
    }
    setActivity([]);
    setModal(null);
    setConnectError(null);
  }

  function rememberImported(next: Token[]) {
    setCustomTokens(next);
    writeImportedTokens(next);
  }

  async function importToken(raw: string): Promise<{ id: string } | { error: string }> {
    if (!isAddress(raw)) return { error: "Paste a Base contract address, starting with 0x." };
    const tokenAddress = getAddress(raw);
    const existing = tokens.find((token) => token.address?.toLowerCase() === tokenAddress.toLowerCase());
    if (existing) return { id: existing.id };
    if (!publicClient) return { error: "Base is not ready for a contract read yet." };
    if (customTokens.length >= 20) return { error: "Remove an imported token before adding another. The limit is 20." };
    try {
      const [name, symbol, decimals] = await Promise.all([
        publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "name" }),
        publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "symbol" }),
        publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "decimals" }),
      ]);
      const token = tokenFromImport({
        address: tokenAddress,
        name: cleanLabel(name, 64) ?? "",
        symbol: cleanLabel(symbol, 16) ?? "",
        decimals: Number(decimals),
      });
      if (!token) return { error: "That contract did not return a usable name, symbol, and decimals on Base." };
      rememberImported([...customTokens, token]);
      return { id: token.id };
    } catch {
      return { error: "That address did not respond as a token contract on Base." };
    }
  }

  function removeImportedToken(id: string) {
    rememberImported(customTokens.filter((token) => token.id !== id));
    if (sellTokenId === id) setSellTokenId("eth");
    if (buyTokenId === id) setBuyTokenId(null);
  }

  async function switchToBase() {
    try {
      await switchChainAsync({ chainId: BASE_CHAIN_ID });
    } catch (error) {
      setNotice({ title: "Switch to Base", body: friendlyWalletError(error) });
    }
  }

  function confirmDemoSwap(): string | null {
    if (!quote || !buyToken || !wallet) {
      const message = "Connect a wallet on Base before reviewing a sample swap.";
      setNotice({ title: "Wallet required", body: message });
      return message;
    }
    if (!wallet.chainOk) {
      const message = "Switch this wallet to Base (chain ID 8453). Nothing is sent on another network.";
      setNotice({ title: "Wrong network", body: message });
      return message;
    }
    if (chainBalances.loading || chainBalances.failed) {
      const message = "Base balances are not ready. Wait for the read to finish before the sample receipt.";
      setNotice({ title: "Balance not ready", body: message });
      return message;
    }
    const balance = chainBalances.balances[sellToken.id] ?? 0;
    if (quote.sellAmount > balance + 1e-8) {
      const message = `The Base balance does not cover ${sellToken.symbol}.`;
      setNotice({ title: "Insufficient balance", body: message });
      return message;
    }
    setActivity((current) => [
      {
        id: `demo-${current.length + 1}`,
        pair: `${sellToken.symbol} → ${buyToken.symbol}`,
        sellAmount: `${formatToken(quote.sellAmount)} ${sellToken.symbol}`,
        buyAmount: `${formatToken(quote.buyAmount)} ${buyToken.symbol}`,
        when: "Just now",
      },
      ...current,
    ]);
    setSellAmount("");
    setModal("receipt");
    return null;
  }

  const value: AppState = {
    wallet,
    walletChoices: choices,
    connect,
    connectingId,
    connectError,
    disconnect,
    switchToBase,
    switchingChain,
    balances: chainBalances.balances,
    balancesLoading: chainBalances.loading,
    balancesError: chainBalances.failed,
    tokens,
    pricesLive,
    importToken,
    removeImportedToken,
    sellToken,
    buyToken,
    setSellToken,
    setBuyToken,
    sellAmount,
    setSellAmount,
    flip,
    slippageBps,
    setSlippageBps: (next) => {
      if (Number.isInteger(next) && next >= 0 && next <= 5000) setSlippageBpsState(next);
    },
    deadlineMin,
    setDeadlineMin: (next) => {
      if (Number.isInteger(next) && next >= 1 && next <= 180) setDeadlineMinState(next);
    },
    modal,
    openModal: (next) => {
      if (next === "connect") setConnectError(null);
      setModal(next);
    },
    closeModal: () => {
      setModal(null);
      setConnectingId(null);
    },
    chartOpen,
    setChartOpen,
    timeframe,
    setTimeframe,
    quote,
    sellAmountNumber: parsedAmount,
    confirmDemoSwap,
    activity,
    notice,
    setNotice,
    searchOpen: modal === "search",
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider.");
  return value;
}

"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { formatToken } from "@/lib/format";
import { buildQuote, type Quote } from "@/lib/quote";
import { TOKENS, USDC, tokenById, type Token } from "@/lib/tokens";

export const DEMO_ADDRESS = "0x1111111111111111111111111111111111111111";

export type WalletKind = "metamask" | "coinbase" | "walletconnect" | "trust";

export type WalletSession = {
  kind: WalletKind;
  name: string;
  address: string;
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

const WALLETS: Record<WalletKind, string> = {
  metamask: "MetaMask",
  coinbase: "Coinbase Wallet",
  walletconnect: "WalletConnect",
  trust: "Trust Wallet",
};

type AppState = {
  wallet: WalletSession | null;
  connect: (kind: WalletKind) => void;
  disconnect: () => void;
  balances: Record<string, number>;
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

function initialBalances(): Record<string, number> {
  return Object.fromEntries(TOKENS.map((token) => [token.id, token.demoBalance]));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletSession | null>(null);
  const [balances, setBalances] = useState<Record<string, number>>(initialBalances);
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

  const sellToken = tokenById(sellTokenId) ?? TOKENS[0];
  const buyToken = tokenById(buyTokenId);
  const sellAmountNumber = Number(sellAmount);
  const parsedAmount = Number.isFinite(sellAmountNumber) ? sellAmountNumber : 0;

  const quote = useMemo(() => {
    if (!buyToken || !USDC) return null;
    return buildQuote({
      sell: sellToken,
      buy: buyToken,
      sellAmount: parsedAmount,
      slippageBps,
      usdc: USDC,
    });
  }, [buyToken, parsedAmount, sellToken, slippageBps]);

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

  function connect(kind: WalletKind) {
    setWallet({ kind, name: WALLETS[kind], address: DEMO_ADDRESS });
    setModal(null);
  }

  function disconnect() {
    setWallet(null);
    setBalances(initialBalances());
    setActivity([]);
    setModal(null);
  }

  function confirmDemoSwap(): string | null {
    if (!quote || !buyToken || !wallet) return "Connect a demo wallet before reviewing a sample swap.";
    const balance = balances[sellToken.id] ?? 0;
    if (quote.sellAmount > balance + 1e-12) return `The demo balance does not cover ${sellToken.symbol}.`;
    setBalances((current) => ({
      ...current,
      [sellToken.id]: (current[sellToken.id] ?? 0) - quote.sellAmount,
      [buyToken.id]: (current[buyToken.id] ?? 0) + quote.buyAmount,
    }));
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
    connect,
    disconnect,
    balances,
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
    openModal: setModal,
    closeModal: () => setModal(null),
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

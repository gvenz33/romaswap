export type Token = {
  id: string;
  symbol: string;
  name: string;
  address: string | null;
  decimals: number;
  priceUsd: number;
  change1h: number;
  change1d: number;
  fdvUsd: number;
  volume1dUsd: number;
  demoBalance: number;
  accent: string;
  note?: string;
};

/**
 * Draft Base allowlist for the demo. Addresses are the commonly published
 * contracts and must be re-verified before any live release.
 * Prices, changes, FDV, and volume are sample figures, not live quotes.
 */
export const TOKENS: Token[] = [
  {
    id: "eth",
    symbol: "ETH",
    name: "Ether",
    address: null,
    decimals: 18,
    priceUsd: 3450,
    change1h: 0.22,
    change1d: -0.84,
    fdvUsd: 415_000_000_000,
    volume1dUsd: 42_500_000,
    demoBalance: 1.842,
    accent: "#8ea2ff",
    note: "Native Ether on Base.",
  },
  {
    id: "weth",
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18,
    priceUsd: 3450,
    change1h: 0.21,
    change1d: -0.83,
    fdvUsd: 8_400_000_000,
    volume1dUsd: 6_200_000,
    demoBalance: 0.35,
    accent: "#b9c0dc",
    note: "Wrapped Ether on Base. This is an ERC-20, not a separate asset from Ether.",
  },
  {
    id: "usdc",
    symbol: "USDC",
    name: "USD Coin",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
    priceUsd: 1,
    change1h: 0,
    change1d: 0,
    fdvUsd: 36_000_000_000,
    volume1dUsd: 28_400_000,
    demoBalance: 4200,
    accent: "#2775ca",
    note: "Native Circle USDC on Base.",
  },
  {
    id: "cbbtc",
    symbol: "cbBTC",
    name: "Coinbase Wrapped BTC",
    address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
    decimals: 8,
    priceUsd: 98400,
    change1h: -0.12,
    change1d: 0.64,
    fdvUsd: 7_100_000_000,
    volume1dUsd: 9_800_000,
    demoBalance: 0.015,
    accent: "#f7931a",
    note: "Coinbase Wrapped BTC on Base. This is not native Bitcoin.",
  },
];

export const USDC = TOKENS.find((token) => token.id === "usdc");

if (!USDC) {
  throw new Error("Draft allowlist is missing native Base USDC.");
}

export function tokenById(id: string | null): Token | null {
  if (!id) return null;
  return TOKENS.find((token) => token.id === id) ?? null;
}

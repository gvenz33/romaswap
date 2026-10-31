import { getAddress, isAddress } from "viem";
import { TOKENS, type Token } from "@/lib/tokens";

export type LivePrice = { usd: number; change1d: number | null };

export const CHART_FRAMES = {
  "1H": { seconds: 60 * 60, span: 12, period: "5m" },
  "1D": { seconds: 24 * 60 * 60, span: 24, period: "1h" },
  "1W": { seconds: 7 * 24 * 60 * 60, span: 42, period: "4h" },
  "1M": { seconds: 30 * 24 * 60 * 60, span: 30, period: "1d" },
  "1Y": { seconds: 365 * 24 * 60 * 60, span: 52, period: "1w" },
} as const;

export type ChartFrame = keyof typeof CHART_FRAMES;

export function coinKeyFor(token: Pick<Token, "id" | "address">): string | null {
  if (token.id === "eth") return "coingecko:ethereum";
  if (!token.address) return null;
  return `base:${token.address.toLowerCase()}`;
}

export function coinKeyForAddress(address: string): string | null {
  if (!isAddress(address)) return null;
  return `base:${getAddress(address).toLowerCase()}`;
}

export function allowlistCoinKeys(): Map<string, string> {
  const keys = new Map<string, string>();
  for (const token of TOKENS) {
    const key = coinKeyFor(token);
    if (key) keys.set(key, token.id);
  }
  return keys;
}

import { FEE_BPS } from "./config";
import type { Token } from "./tokens";

export type Quote = {
  sellAmount: number;
  buyAmount: number;
  feeAmount: number;
  feeToken: Token;
  minReceived: number;
  priceImpactPct: number;
  rate: number;
  sellValueUsd: number;
  buyValueUsd: number;
};

export function feeTokenFor(sell: Token, buy: Token, usdc: Token): Token {
  if (sell.id === usdc.id || buy.id === usdc.id) return usdc;
  return sell;
}

export function buildQuote(input: {
  sell: Token;
  buy: Token;
  sellAmount: number;
  slippageBps: number;
  usdc: Token;
  feeBps?: number;
}): Quote | null {
  const feeBps = input.feeBps ?? FEE_BPS;
  if (feeBps !== FEE_BPS) return null;
  if (!Number.isInteger(input.slippageBps) || input.slippageBps < 0 || input.slippageBps > 5000) {
    return null;
  }
  if (input.sell.id === input.buy.id) return null;
  if (!Number.isFinite(input.sellAmount) || input.sellAmount <= 0) return null;
  if (input.sell.priceUsd <= 0 || input.buy.priceUsd <= 0) return null;

  const sellValueUsd = input.sellAmount * input.sell.priceUsd;
  const feeValueUsd = sellValueUsd * (FEE_BPS / 10_000);
  const buyAmount = (sellValueUsd - feeValueUsd) / input.buy.priceUsd;
  const feeToken = feeTokenFor(input.sell, input.buy, input.usdc);
  const feeAmount = feeToken.id === input.usdc.id ? feeValueUsd / input.usdc.priceUsd : input.sellAmount * (FEE_BPS / 10_000);
  const minReceived = buyAmount * (1 - input.slippageBps / 10_000);
  const priceImpactPct = Math.min(3, sellValueUsd / 20_000);

  return {
    sellAmount: input.sellAmount,
    buyAmount,
    feeAmount,
    feeToken,
    minReceived,
    priceImpactPct,
    rate: buyAmount / input.sellAmount,
    sellValueUsd,
    buyValueUsd: buyAmount * input.buy.priceUsd,
  };
}

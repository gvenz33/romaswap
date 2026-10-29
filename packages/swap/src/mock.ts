import {
  FEE_BPS,
  QUOTE_TTL_MS,
  findAllowlistedToken,
  type AllowlistedToken,
} from "@romaswap/config";
import { feeFromAmount, minimumReceived, selectFeeToken } from "./fees";
import type { NormalizedQuote, SwapIntent } from "./types";

const PRICE_IN_USDC: Record<string, bigint> = {
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": 3_500_000_000n,
  "0x4200000000000000000000000000000000000006": 3_500_000_000n,
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": 1_000_000n,
};

function scale(): bigint {
  return 1_000_000n;
}

function toNotional(amount: bigint, token: AllowlistedToken): bigint {
  const price = PRICE_IN_USDC[token.address.toLowerCase()];
  if (!price) return 0n;
  return (amount * price) / 10n ** BigInt(token.decimals);
}

function fromNotional(notional: bigint, token: AllowlistedToken): bigint {
  const price = PRICE_IN_USDC[token.address.toLowerCase()];
  if (!price || price === 0n) return 0n;
  return (notional * 10n ** BigInt(token.decimals)) / price;
}

export function buildMockQuote(intent: SwapIntent, now: number): NormalizedQuote | null {
  const sell = findAllowlistedToken(intent.sellToken);
  const buy = findAllowlistedToken(intent.buyToken);
  if (!sell || !buy) return null;
  const feeToken = selectFeeToken(sell, buy);
  let feeAmount: bigint;
  let buyAmount: bigint;
  if (feeToken.address.toLowerCase() === sell.address.toLowerCase()) {
    feeAmount = feeFromAmount(intent.sellAmount);
    const net = intent.sellAmount - feeAmount;
    buyAmount = fromNotional(toNotional(net, sell), buy);
  } else {
    const gross = fromNotional(toNotional(intent.sellAmount, sell), buy);
    feeAmount = feeFromAmount(gross);
    buyAmount = gross - feeAmount;
  }
  if (buyAmount <= 0n || feeAmount <= 0n) return null;
  const minBuyAmount = minimumReceived(buyAmount, intent.slippageBps);
  return {
    source: "mock",
    liquidityAvailable: true,
    sellToken: sell.address,
    buyToken: buy.address,
    sellAmount: intent.sellAmount.toString(),
    buyAmount: buyAmount.toString(),
    minBuyAmount: minBuyAmount.toString(),
    feeToken: feeToken.address,
    feeSymbol: feeToken.symbol,
    feeBps: FEE_BPS,
    integratorFee: {
      amount: feeAmount.toString(),
      token: feeToken.address,
      symbol: feeToken.symbol,
      type: "volume",
    },
    zeroExFee: {
      amount: "0",
      token: feeToken.address,
      symbol: feeToken.symbol,
      type: "none",
    },
    estimatedGas: "180000",
    gasPrice: "100000000",
    slippageBps: intent.slippageBps,
    quotedAt: now,
    expiresAt: now + QUOTE_TTL_MS,
    allowanceSpender: null,
    transaction: null,
    executable: false,
    simulationOnly: true,
  };
}

export function sampleNotionalScale(): bigint {
  return scale();
}

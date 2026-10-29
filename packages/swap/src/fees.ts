import {
  BASE_USDC_ADDRESS,
  FEE_BPS,
  type AllowlistedToken,
  sameAddress,
} from "@romaswap/config";

const BPS = 10_000n;

/**
 * USDC-first. When native Base USDC is either leg, the fee token is that USDC.
 * When it is neither leg, the fee stays inside the pair and is taken in the sell token.
 * A third token is never a fee token.
 */
export function selectFeeToken(
  sell: AllowlistedToken,
  buy: AllowlistedToken,
): AllowlistedToken {
  if (sameAddress(sell.address, BASE_USDC_ADDRESS)) return sell;
  if (sameAddress(buy.address, BASE_USDC_ADDRESS)) return buy;
  return sell;
}

export function feeFromAmount(amount: bigint, bps = FEE_BPS): bigint {
  if (amount <= 0n) return 0n;
  return (amount * BigInt(bps)) / BPS;
}

export function minimumReceived(buyAmount: bigint, slippageBps: number): bigint {
  if (buyAmount <= 0n) return 0n;
  const ppm = BigInt(slippageBps) * 100n;
  return (buyAmount * (1_000_000n - ppm)) / 1_000_000n;
}

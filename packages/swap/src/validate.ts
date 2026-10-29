import {
  BASE_CHAIN_ID,
  DEFAULT_SLIPPAGE_BPS,
  MAX_SLIPPAGE_BPS,
  MIN_SLIPPAGE_BPS,
  QUOTE_TTL_MS,
  findAllowlistedToken,
  isBlockedToken,
  sameAddress,
  type AllowlistedToken,
} from "@romaswap/config";
import { getAddress, isAddress, isHex } from "viem";
import { selectFeeToken } from "./fees";
import { parseBaseUnitString } from "./money";
import type { SwapIntent } from "./types";

export type FieldError = { code: string; message: string };

export function failure(code: string, message: string): { ok: false; error: FieldError } {
  return { ok: false, error: { code, message } };
}

function minimumSell(token: AllowlistedToken): bigint {
  if (token.decimals <= 6) return 1_000_000n;
  return 100_000_000_000_000n;
}

export function parseSwapIntent(body: unknown): { ok: true; intent: SwapIntent } | { ok: false; error: FieldError } {
  if (!body || typeof body !== "object") {
    return failure("MALFORMED_REQUEST", "The swap request was empty.");
  }
  const record = body as Record<string, unknown>;
  if (record.chainId !== undefined && record.chainId !== BASE_CHAIN_ID) {
    return failure(
      "UNSUPPORTED_CHAIN",
      "RomaSwap quotes Base only. Switch the wallet to Base (chain 8453).",
    );
  }
  if (typeof record.sellToken !== "string" || !isAddress(record.sellToken)) {
    return failure("MALFORMED_TOKEN", "The sell token address is not valid.");
  }
  if (typeof record.buyToken !== "string" || !isAddress(record.buyToken)) {
    return failure("MALFORMED_TOKEN", "The buy token address is not valid.");
  }
  const sellAddress = getAddress(record.sellToken);
  const buyAddress = getAddress(record.buyToken);
  if (isBlockedToken(sellAddress) || isBlockedToken(buyAddress)) {
    return failure(
      "UNSUPPORTED_TOKEN",
      "That token is not on the RomaSwap allowlist. Bridged USDC (USDbC) is not accepted.",
    );
  }
  const sell = findAllowlistedToken(sellAddress);
  const buy = findAllowlistedToken(buyAddress);
  if (!sell || !buy) {
    return failure("UNSUPPORTED_TOKEN", "Both tokens must be on the reviewed Base allowlist.");
  }
  if (sameAddress(sell.address, buy.address)) {
    return failure("SAME_TOKEN", "Choose two different tokens.");
  }
  const sellAmount = parseBaseUnitString(record.sellAmount);
  if (sellAmount === null || sellAmount <= 0n) {
    return failure("MALFORMED_AMOUNT", "The sell amount must be a positive whole number of base units.");
  }
  if (sellAmount < minimumSell(sell)) {
    const minimum = sell.decimals <= 6 ? "1 USDC" : `0.0001 ${sell.symbol}`;
    return failure("AMOUNT_TOO_SMALL", `The minimum sell size for ${sell.symbol} is ${minimum}.`);
  }
  let slippageBps = DEFAULT_SLIPPAGE_BPS;
  if (record.slippageBps !== undefined) {
    if (
      typeof record.slippageBps !== "number" ||
      !Number.isInteger(record.slippageBps) ||
      record.slippageBps < MIN_SLIPPAGE_BPS ||
      record.slippageBps > MAX_SLIPPAGE_BPS
    ) {
      return failure(
        "MALFORMED_SLIPPAGE",
        `Slippage must be a whole number from ${MIN_SLIPPAGE_BPS} to ${MAX_SLIPPAGE_BPS} basis points.`,
      );
    }
    slippageBps = record.slippageBps;
  }
  let taker: `0x${string}` | null = null;
  if (record.taker !== undefined && record.taker !== null && record.taker !== "") {
    if (typeof record.taker !== "string" || !isAddress(record.taker)) {
      return failure("MALFORMED_TAKER", "The wallet address is not valid.");
    }
    taker = getAddress(record.taker);
  }
  return {
    ok: true,
    intent: {
      sellToken: sell.address,
      buyToken: buy.address,
      sellAmount,
      slippageBps,
      taker,
    },
  };
}

export function expectedFeeToken(intent: SwapIntent): AllowlistedToken {
  const sell = findAllowlistedToken(intent.sellToken);
  const buy = findAllowlistedToken(intent.buyToken);
  if (!sell || !buy) {
    throw new Error("Allowlist changed under an existing intent.");
  }
  return selectFeeToken(sell, buy);
}

const ZERO = "0x0000000000000000000000000000000000000000";

function asAddress(value: unknown): `0x${string}` | null {
  if (typeof value !== "string" || !isAddress(value)) return null;
  const address = getAddress(value);
  if (sameAddress(address, ZERO)) return null;
  return address;
}

export function assertFresh(quotedAt: number, now: number): FieldError | null {
  if (!Number.isFinite(quotedAt) || now - quotedAt > QUOTE_TTL_MS || quotedAt > now + 5_000) {
    return {
      code: "STALE_QUOTE",
      message: "This quote expired. Request a fresh quote before signing.",
    };
  }
  return null;
}

export function validateLiveTransaction(input: {
  intent: SwapIntent;
  to: unknown;
  data: unknown;
  value: unknown;
  spender: unknown;
}): { ok: true; to: `0x${string}`; data: `0x${string}`; value: string; spender: `0x${string}` | null } | { ok: false; error: FieldError } {
  const to = asAddress(input.to);
  if (!to) {
    return failure("UNSAFE_TARGET", "The quote did not include a valid settlement target.");
  }
  if (typeof input.data !== "string" || !isHex(input.data) || input.data.length < 10) {
    return failure("UNSAFE_CALLDATA", "The quote calldata is missing or malformed.");
  }
  const value = parseBaseUnitString(input.value);
  if (value === null) {
    return failure("UNSAFE_VALUE", "The quote transaction value is not a base-unit integer.");
  }
  const sell = findAllowlistedToken(input.intent.sellToken);
  if (!sell) return failure("UNSUPPORTED_TOKEN", "The sell token left the allowlist.");
  if (sell.native) {
    if (value !== input.intent.sellAmount) {
      return failure("UNSAFE_VALUE", "A native sell must send exactly the sell amount as transaction value.");
    }
    if (input.spender) {
      return failure("UNSAFE_SPENDER", "Native ETH does not use an ERC-20 approval.");
    }
  } else if (value !== 0n) {
    return failure("UNSAFE_VALUE", "An ERC-20 sell must send zero native value.");
  }
  const reserved = new Set(
    [input.intent.sellToken, input.intent.buyToken, input.intent.taker]
      .filter((item): item is `0x${string}` => Boolean(item))
      .map((item) => item.toLowerCase()),
  );
  if (reserved.has(to.toLowerCase())) {
    return failure("UNSAFE_TARGET", "The settlement target cannot be the token, the fee wallet, or the trader.");
  }
  let spender: `0x${string}` | null = null;
  if (!sell.native) {
    spender = asAddress(input.spender);
    if (!spender) {
      return failure("UNSAFE_SPENDER", "The quote did not name an AllowanceHolder spender.");
    }
    if (!sameAddress(spender, to)) {
      return failure(
        "UNSAFE_SPENDER",
        "Refusing the quote. An ERC-20 approval must name the same contract that receives the swap, never a separate Settler.",
      );
    }
    if (reserved.has(spender.toLowerCase())) {
      return failure("UNSAFE_SPENDER", "The approval spender is not an allowed settlement contract.");
    }
  }
  return { ok: true, to, data: input.data as `0x${string}`, value: value.toString(), spender };
}

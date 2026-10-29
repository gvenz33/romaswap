import { FEE_BPS, findAllowlistedToken } from "@romaswap/config";
import { parseBaseUnitString } from "./money";
import type { NormalizedQuote, SwapIntent, ZeroExResponse } from "./types";
import { expectedFeeToken, validateLiveTransaction, type FieldError } from "./validate";

const ZERO_EX_ORIGIN = "https://api.0x.org";

export class ZeroExRequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function redact(text: string): string {
  return text.replace(/0x-api-key[=:]\s*\S+/gi, "0x-api-key=[redacted]").slice(0, 280);
}

export function feeQuery(intent: SwapIntent, recipient: `0x${string}`): Record<string, string> {
  const feeToken = expectedFeeToken(intent);
  return {
    chainId: "8453",
    sellToken: intent.sellToken,
    buyToken: intent.buyToken,
    sellAmount: intent.sellAmount.toString(),
    slippagePpm: String(intent.slippageBps * 100),
    swapFeeBps: String(FEE_BPS),
    swapFeeRecipient: recipient,
    swapFeeToken: feeToken.address,
    ...(intent.taker ? { taker: intent.taker } : {}),
  };
}

export async function fetchZeroEx(
  kind: "price" | "quote",
  intent: SwapIntent,
  apiKey: string,
  recipient: `0x${string}`,
): Promise<ZeroExResponse> {
  const params = new URLSearchParams(feeQuery(intent, recipient));
  const response = await fetch(`${ZERO_EX_ORIGIN}/swap/allowance-holder/${kind}?${params.toString()}`, {
    headers: {
      "0x-api-key": apiKey,
      "0x-version": "v2",
      accept: "application/json",
    },
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) {
    throw new ZeroExRequestError(
      response.status,
      response.status === 429
        ? "0x rate limited this quote. Wait a moment and try again."
        : `0x could not price this pair (${response.status}). ${redact(text)}`,
    );
  }
  return JSON.parse(text) as ZeroExResponse;
}

export function normalizeLive(
  kind: "price" | "quote",
  payload: ZeroExResponse,
  intent: SwapIntent,
  now: number,
  executionEnabled: boolean,
): { ok: true; quote: NormalizedQuote } | { ok: false; error: FieldError } {
  if (payload.liquidityAvailable === false) {
    return {
      ok: false,
      error: { code: "NO_LIQUIDITY", message: "No liquidity is available for this pair and size." },
    };
  }
  const buyAmount = parseBaseUnitString(payload.buyAmount);
  const minBuyAmount = parseBaseUnitString(payload.minBuyAmount);
  if (buyAmount === null || buyAmount <= 0n || minBuyAmount === null) {
    return {
      ok: false,
      error: { code: "MALFORMED_QUOTE", message: "The price response did not include a buy amount." },
    };
  }
  const sell = findAllowlistedToken(intent.sellToken);
  const buy = findAllowlistedToken(intent.buyToken);
  const feeToken = expectedFeeToken(intent);
  if (!sell || !buy) {
    return { ok: false, error: { code: "UNSUPPORTED_TOKEN", message: "The pair is no longer allowlisted." } };
  }
  if (payload.sellToken && payload.sellToken.toLowerCase() !== intent.sellToken.toLowerCase()) {
    return { ok: false, error: { code: "PAIR_MISMATCH", message: "The quote sell token does not match the request." } };
  }
  if (payload.buyToken && payload.buyToken.toLowerCase() !== intent.buyToken.toLowerCase()) {
    return { ok: false, error: { code: "PAIR_MISMATCH", message: "The quote buy token does not match the request." } };
  }
  const reportedFee = payload.fees?.integratorFee;
  if (!reportedFee?.amount || !reportedFee.token) {
    return {
      ok: false,
      error: { code: "FEE_MISSING", message: "The quote did not return the RomaSwap integrator fee." },
    };
  }
  const feeAmount = parseBaseUnitString(reportedFee.amount);
  if (feeAmount === null || feeAmount <= 0n) {
    return { ok: false, error: { code: "FEE_MISSING", message: "The integrator fee amount was empty." } };
  }
  if (reportedFee.token.toLowerCase() !== feeToken.address.toLowerCase()) {
    return {
      ok: false,
      error: {
        code: "FEE_TOKEN_MISMATCH",
        message: "The quote collected the fee in a different token than the USDC-first rule.",
      },
    };
  }
  if (minBuyAmount <= 0n || minBuyAmount > buyAmount) {
    return {
      ok: false,
      error: {
        code: "MIN_BUY_MISMATCH",
        message: "The guaranteed buy amount is outside the quoted buy amount.",
      },
    };
  }
  let transaction: NormalizedQuote["transaction"] = null;
  let spender: `0x${string}` | null = null;
  if (kind === "quote") {
    const checked = validateLiveTransaction({
      intent,
      to: payload.transaction?.to,
      data: payload.transaction?.data,
      value: payload.transaction?.value,
      spender: sell.native ? null : payload.issues?.allowance?.spender ?? payload.allowanceTarget,
    });
    if (!checked.ok) return checked;
    spender = checked.spender;
    if (executionEnabled) {
      transaction = { to: checked.to, data: checked.data, value: checked.value };
    }
  }
  const zeroEx = payload.fees?.zeroExFee;
  const zeroExToken = zeroEx?.token ? findAllowlistedToken(zeroEx.token) : undefined;
  return {
    ok: true,
    quote: {
      source: "live",
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
        type: reportedFee.type ?? "volume",
      },
      zeroExFee:
        zeroEx?.amount && zeroEx.token && zeroExToken
          ? {
              amount: zeroEx.amount,
              token: zeroExToken.address,
              symbol: zeroExToken.symbol,
              type: zeroEx.type ?? "volume",
            }
          : null,
      estimatedGas: payload.transaction?.gas ?? payload.gas ?? null,
      gasPrice: payload.gasPrice ?? null,
      slippageBps: intent.slippageBps,
      quotedAt: now,
      expiresAt: now + 30_000,
      allowanceSpender: spender,
      transaction,
      executable: kind === "quote" && executionEnabled && transaction !== null,
      simulationOnly: false,
    },
  };
}

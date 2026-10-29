import { describe, expect, it } from "vitest";
import {
  BASE_USDC_ADDRESS,
  BASE_WETH_ADDRESS,
  BLOCKED_USDBC_ADDRESS,
  NATIVE_ETH_ADDRESS,
} from "@romaswap/config";
import { feeFromAmount, selectFeeToken } from "./fees";
import { formatBaseUnits, parseHumanAmount } from "./money";
import { buildMockQuote } from "./mock";
import { findAllowlistedToken } from "@romaswap/config";
import { assertFresh, parseSwapIntent, validateLiveTransaction } from "./validate";
import { normalizeLive } from "./zeroex";

const eth = findAllowlistedToken(NATIVE_ETH_ADDRESS)!;
const weth = findAllowlistedToken(BASE_WETH_ADDRESS)!;
const usdc = findAllowlistedToken(BASE_USDC_ADDRESS)!;

describe("amounts", () => {
  it("parses human amounts with integer math", () => {
    expect(parseHumanAmount("1.5", 6)).toBe(1_500_000n);
    expect(parseHumanAmount("0.0001", 18)).toBe(100_000_000_000_000n);
    expect(parseHumanAmount("1.1234567", 6)).toBeNull();
    expect(parseHumanAmount("1e2", 6)).toBeNull();
  });

  it("formats base units without floating point", () => {
    expect(formatBaseUnits(1_500_000n, 6)).toBe("1.5");
    expect(formatBaseUnits(100_000_000_000_000n, 18)).toBe("0.0001");
  });
});

describe("fees", () => {
  it("takes 0.25% and prefers USDC on either side", () => {
    expect(selectFeeToken(usdc, eth).symbol).toBe("USDC");
    expect(selectFeeToken(eth, usdc).symbol).toBe("USDC");
    expect(selectFeeToken(eth, weth).symbol).toBe("ETH");
    expect(feeFromAmount(100_000_000n)).toBe(250_000n);
  });

  it("builds a sample ETH to USDC quote with the fee in USDC", () => {
    const quote = buildMockQuote(
      {
        sellToken: eth.address,
        buyToken: usdc.address,
        sellAmount: parseHumanAmount("0.1", 18)!,
        slippageBps: 50,
        taker: null,
      },
      1_000,
    );
    expect(quote?.simulationOnly).toBe(true);
    expect(quote?.transaction).toBeNull();
    expect(quote?.feeSymbol).toBe("USDC");
    expect(quote?.integratorFee?.amount).toBe("875000");
    expect(quote?.buyAmount).toBe("349125000");
  });
});

describe("validation", () => {
  it("blocks bridged USDC, identical tokens, and tiny amounts", () => {
    expect(parseSwapIntent({ sellToken: BLOCKED_USDBC_ADDRESS, buyToken: eth.address, sellAmount: "1000000" }).ok).toBe(false);
    expect(
      parseSwapIntent({ sellToken: eth.address, buyToken: eth.address, sellAmount: "1000000000000000000" }).ok,
    ).toBe(false);
    const tiny = parseSwapIntent({
      sellToken: usdc.address,
      buyToken: eth.address,
      sellAmount: "1",
    });
    expect(tiny.ok).toBe(false);
  });

  it("rejects a non-Base chain id from the client", () => {
    const result = parseSwapIntent({
      chainId: 1,
      sellToken: eth.address,
      buyToken: usdc.address,
      sellAmount: "1000000000000000000",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNSUPPORTED_CHAIN");
  });

  it("refuses an ERC-20 approval spender that is not the swap target", () => {
    const intent = {
      sellToken: usdc.address,
      buyToken: eth.address,
      sellAmount: 10_000_000n,
      slippageBps: 50,
      taker: "0x1111111111111111111111111111111111111111" as const,
    };
    const result = validateLiveTransaction({
      intent,
      to: "0x2222222222222222222222222222222222222222",
      data: "0x12345678",
      value: "0",
      spender: "0x3333333333333333333333333333333333333333",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNSAFE_SPENDER");
  });

  it("accepts an exact AllowanceHolder target and rejects a stale quote", () => {
    const holder = "0x0000000000001fF3684f28c67538d4D072C22734" as const;
    const intent = {
      sellToken: usdc.address,
      buyToken: eth.address,
      sellAmount: 10_000_000n,
      slippageBps: 50,
      taker: "0x1111111111111111111111111111111111111111" as const,
    };
    const result = validateLiveTransaction({
      intent,
      to: holder,
      data: "0xabcdef01",
      value: "0",
      spender: holder,
    });
    expect(result.ok).toBe(true);
    expect(assertFresh(1_000, 40_000)?.code).toBe("STALE_QUOTE");
    expect(assertFresh(1_000, 20_000)).toBeNull();
  });

  it("rejects a live price that drops the integrator fee", () => {
    const intent = {
      sellToken: eth.address,
      buyToken: usdc.address,
      sellAmount: 10n ** 18n,
      slippageBps: 50,
      taker: null,
    };
    const normalized = normalizeLive(
      "price",
      { liquidityAvailable: true, buyAmount: "3500000000", minBuyAmount: "3482500000" },
      intent,
      1,
      false,
    );
    expect(normalized.ok).toBe(false);
  });
});

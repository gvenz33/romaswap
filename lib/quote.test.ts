import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FEE_BPS } from "./config";
import { buildQuote, feeTokenFor } from "./quote";
import { TOKENS, tokenById } from "./tokens";

const eth = tokenById("eth");
const usdc = tokenById("usdc");
const cbbtc = tokenById("cbbtc");

if (!eth || !usdc || !cbbtc) {
  throw new Error("Allowlist fixtures missing.");
}

describe("RomaSwap sample quote", () => {
  it("locks the integrator fee at 25 bps", () => {
    assert.equal(FEE_BPS, 25);
  });

  it("collects the sample fee in USDC when USDC is bought", () => {
    const quote = buildQuote({
      sell: eth,
      buy: usdc,
      sellAmount: 1,
      slippageBps: 50,
      usdc,
    });
    assert.ok(quote);
    assert.equal(quote.feeToken.id, "usdc");
    assert.equal(quote.feeAmount, eth.priceUsd * 0.0025);
    assert.equal(quote.buyAmount, eth.priceUsd * 0.9975);
    assert.ok(Math.abs(quote.minReceived - quote.buyAmount * 0.995) < 1e-9);
  });

  it("collects the sample fee in the sell token when USDC is not in the pair", () => {
    assert.equal(feeTokenFor(eth, cbbtc, usdc).id, "eth");
    const quote = buildQuote({
      sell: eth,
      buy: cbbtc,
      sellAmount: 2,
      slippageBps: 0,
      usdc,
    });
    assert.ok(quote);
    assert.equal(quote.feeToken.id, "eth");
    assert.equal(quote.feeAmount, 0.005);
    assert.equal(quote.minReceived, quote.buyAmount);
  });

  it("rejects a client fee override, a same-token pair, and an empty amount", () => {
    assert.equal(
      buildQuote({ sell: eth, buy: usdc, sellAmount: 1, slippageBps: 50, usdc, feeBps: 30 }),
      null,
    );
    assert.equal(buildQuote({ sell: eth, buy: eth, sellAmount: 1, slippageBps: 50, usdc }), null);
    assert.equal(buildQuote({ sell: eth, buy: usdc, sellAmount: 0, slippageBps: 50, usdc }), null);
    assert.equal(buildQuote({ sell: eth, buy: usdc, sellAmount: 1, slippageBps: 5001, usdc }), null);
  });

  it("only exposes the draft allowlist", () => {
    assert.deepEqual(
      TOKENS.map((token) => token.symbol),
      ["ETH", "WETH", "USDC", "cbBTC", "USDT", "EURC", "cbETH", "wstETH", "AERO", "cbXRP", "cbDOGE", "cbADA", "cbLTC", "cbMEGA", "cbHYPE", "cbZEC"],
    );
    assert.equal(usdc.address, "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
  });
});

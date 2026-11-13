import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bankBuyQuote } from "./bank";

describe("bank buy quote", () => {
  it("converts dollars after the 25 bps fee", () => {
    const quote = bankBuyQuote(100, 1);
    assert.ok(quote);
    assert.equal(quote.feeUsd, 0.25);
    assert.equal(quote.netUsd, 99.75);
    assert.equal(quote.receive, 99.75);
  });

  it("rejects an empty amount or a missing price", () => {
    assert.equal(bankBuyQuote(0, 1), null);
    assert.equal(bankBuyQuote(25, 0), null);
    assert.equal(bankBuyQuote(Number.NaN, 10), null);
  });
});

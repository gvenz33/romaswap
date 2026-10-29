import { appendEvent, anonymizeWallet } from "@romaswap/telemetry";
import {
  ZeroExRequestError,
  buildMockQuote,
  fetchZeroEx,
  normalizeLive,
  parseSwapIntent,
  type NormalizedQuote,
  type SwapIntent,
} from "@romaswap/swap";
import { feeRecipient, runtimeMode } from "./mode";
import { consumeView, issueView } from "./views";

export type QuoteResult =
  | { ok: true; quote: NormalizedQuote; viewId?: string }
  | { ok: false; status: number; code: string; message: string };

function record(
  kind: "price" | "quote",
  started: number,
  intent: SwapIntent | null,
  ok: boolean,
  source: "mock" | "live" | undefined,
  result: string,
) {
  appendEvent({
    kind,
    at: new Date().toISOString(),
    ok,
    latencyMs: Date.now() - started,
    walletKey: intent?.taker ? anonymizeWallet(intent.taker) : undefined,
    pair: intent ? `${intent.sellToken}/${intent.buyToken}` : undefined,
    result,
    source,
  });
}

export async function priceSwap(body: unknown): Promise<QuoteResult> {
  const started = Date.now();
  const mode = runtimeMode();
  if (!mode.quotesEnabled) {
    record("price", started, null, false, undefined, "PAUSED");
    return { ok: false, status: 503, code: "QUOTES_PAUSED", message: mode.reason };
  }
  const parsed = parseSwapIntent(body);
  if (!parsed.ok) {
    record("price", started, null, false, undefined, parsed.error.code);
    return { ok: false, status: 400, code: parsed.error.code, message: parsed.error.message };
  }
  const quote = await quoteFor("price", parsed.intent, mode);
  if (!quote.ok) {
    record("price", started, parsed.intent, false, mode.live ? "live" : "mock", quote.code);
    return quote;
  }
  const viewId = issueView(parsed.intent);
  record("price", started, parsed.intent, true, quote.quote.source, "OK");
  return { ok: true, quote: quote.quote, viewId };
}

export async function firmQuote(body: unknown): Promise<QuoteResult> {
  const started = Date.now();
  const mode = runtimeMode();
  if (!mode.quotesEnabled) {
    record("quote", started, null, false, undefined, "PAUSED");
    return { ok: false, status: 503, code: "QUOTES_PAUSED", message: mode.reason };
  }
  const parsed = parseSwapIntent(body);
  if (!parsed.ok) {
    record("quote", started, null, false, undefined, parsed.error.code);
    return { ok: false, status: 400, code: parsed.error.code, message: parsed.error.message };
  }
  if (mode.live && !parsed.intent.taker) {
    record("quote", started, parsed.intent, false, "live", "TAKER_REQUIRED");
    return {
      ok: false,
      status: 400,
      code: "TAKER_REQUIRED",
      message: "Connect the wallet that will sell the tokens before requesting a firm quote.",
    };
  }
  const viewError = consumeView(
    body && typeof body === "object" ? (body as { viewId?: unknown }).viewId : undefined,
    parsed.intent,
  );
  if (viewError) {
    record("quote", started, parsed.intent, false, mode.live ? "live" : "mock", "STALE_PREVIEW");
    return { ok: false, status: 409, code: "STALE_PREVIEW", message: viewError };
  }
  const quote = await quoteFor("quote", parsed.intent, mode);
  if (!quote.ok) {
    record("quote", started, parsed.intent, false, mode.live ? "live" : "mock", quote.code);
    return quote;
  }
  record("quote", started, parsed.intent, true, quote.quote.source, quote.quote.executable ? "EXECUTABLE" : "REVIEW_ONLY");
  return { ok: true, quote: quote.quote };
}

async function quoteFor(
  kind: "price" | "quote",
  intent: SwapIntent,
  mode: ReturnType<typeof runtimeMode>,
): Promise<QuoteResult> {
  const now = Date.now();
  if (!mode.live) {
    const mock = buildMockQuote(intent, now);
    if (!mock) {
      return {
        ok: false,
        status: 422,
        code: "NO_LIQUIDITY",
        message: "The sample market cannot price this size.",
      };
    }
    return { ok: true, quote: mock };
  }
  const key = process.env.ZEROX_API_KEY?.trim() ?? "";
  const recipient = feeRecipient();
  if (!recipient) {
    return {
      ok: false,
      status: 503,
      code: "FEE_RECIPIENT_MISSING",
      message: "The fee collection address is not configured.",
    };
  }
  try {
    const payload = await fetchZeroEx(kind, intent, key, recipient);
    const normalized = normalizeLive(kind, payload, intent, now, mode.executionEnabled);
    if (!normalized.ok) {
      return { ok: false, status: 422, code: normalized.error.code, message: normalized.error.message };
    }
    return { ok: true, quote: normalized.quote };
  } catch (error) {
    if (error instanceof ZeroExRequestError) {
      return { ok: false, status: 502, code: "PROVIDER_ERROR", message: error.message };
    }
    return {
      ok: false,
      status: 502,
      code: "PROVIDER_ERROR",
      message: "The quote provider did not respond. Nothing was sent to your wallet.",
    };
  }
}

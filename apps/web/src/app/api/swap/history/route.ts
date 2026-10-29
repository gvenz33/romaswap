import { appendEvent, readEvents } from "@romaswap/telemetry";
import { isAddress, isHash } from "viem";
import { jsonError } from "@/server/http";

const STATES = new Set(["submitted", "confirmed", "reverted", "rejected", "simulated"]);

export function GET(request: Request) {
  const wallet = new URL(request.url).searchParams.get("wallet") ?? "";
  if (!isAddress(wallet)) {
    return jsonError(400, "MALFORMED_TAKER", "History requires a valid wallet address.");
  }
  const events = readEvents()
    .filter((event) => event.kind === "history" && event.walletKey === wallet.toLowerCase())
    .slice(-50)
    .reverse();
  return Response.json({ wallet, events });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "MALFORMED_REQUEST", "The history update was not valid JSON.");
  }
  if (!body || typeof body !== "object") {
    return jsonError(400, "MALFORMED_REQUEST", "The history update was empty.");
  }
  const record = body as Record<string, unknown>;
  if (typeof record.wallet !== "string" || !isAddress(record.wallet)) {
    return jsonError(400, "MALFORMED_TAKER", "The wallet address is not valid.");
  }
  if (typeof record.state !== "string" || !STATES.has(record.state)) {
    return jsonError(400, "MALFORMED_REQUEST", "The transaction state is not recognized.");
  }
  const txHash = typeof record.txHash === "string" ? record.txHash : undefined;
  if (record.state !== "simulated" && record.state !== "rejected") {
    if (!txHash || !isHash(txHash)) {
      return jsonError(400, "MALFORMED_REQUEST", "A broadcast transaction needs a transaction hash.");
    }
  }
  appendEvent({
    kind: "history",
    at: new Date().toISOString(),
    ok: record.state === "confirmed" || record.state === "simulated" || record.state === "submitted",
    walletKey: record.wallet.toLowerCase(),
    pair: typeof record.pair === "string" ? record.pair.slice(0, 80) : undefined,
    txHash,
    quoteRef: typeof record.quoteRef === "string" ? record.quoteRef.slice(0, 80) : undefined,
    state: record.state as "submitted" | "confirmed" | "reverted" | "rejected" | "simulated",
    source: record.source === "live" ? "live" : "mock",
    result: typeof record.result === "string" ? record.result.slice(0, 160) : undefined,
  });
  return Response.json({ ok: true });
}

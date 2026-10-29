import { mkdirSync, readFileSync, appendFileSync, existsSync } from "node:fs";
import path from "node:path";

export type TelemetryKind = "price" | "quote" | "history";

export type TelemetryEvent = {
  kind: TelemetryKind;
  at: string;
  ok: boolean;
  latencyMs?: number;
  walletKey?: string;
  pair?: string;
  result?: string;
  txHash?: string;
  quoteRef?: string;
  source?: "mock" | "live";
  state?: "submitted" | "confirmed" | "reverted" | "rejected" | "simulated";
};

export type Metrics = {
  priceRequests: number;
  priceSuccess: number;
  quoteRequests: number;
  quoteSuccess: number;
  priceSuccessRatio: number | null;
  latencyP50Ms: number | null;
  latencyP95Ms: number | null;
  simulated: number;
  submitted: number;
  confirmed: number;
  reverted: number;
  rejected: number;
};

export function anonymizeWallet(address: string): string {
  const value = address.toLowerCase();
  if (value.length < 10) return "redacted";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function dataDir(): string {
  return process.env.ROMASWAP_DATA_DIR
    ? path.resolve(process.env.ROMASWAP_DATA_DIR)
    : path.resolve(process.cwd(), "data");
}

function fileFor(dir: string): string {
  return path.join(dir, "events.jsonl");
}

export function appendEvent(event: TelemetryEvent, dir = dataDir()): void {
  mkdirSync(dir, { recursive: true });
  appendFileSync(fileFor(dir), `${JSON.stringify(event)}\n`, "utf8");
}

export function readEvents(dir = dataDir()): TelemetryEvent[] {
  const file = fileFor(dir);
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as TelemetryEvent];
      } catch {
        return [];
      }
    });
}

function percentile(values: number[], ratio: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1);
  return sorted[Math.max(0, index)] ?? null;
}

export function summarize(events: TelemetryEvent[]): Metrics {
  const prices = events.filter((event) => event.kind === "price");
  const quotes = events.filter((event) => event.kind === "quote");
  const history = events.filter((event) => event.kind === "history");
  const latencies = [...prices, ...quotes].flatMap((event) =>
    typeof event.latencyMs === "number" ? [event.latencyMs] : [],
  );
  const priceSuccess = prices.filter((event) => event.ok).length;
  return {
    priceRequests: prices.length,
    priceSuccess,
    quoteRequests: quotes.length,
    quoteSuccess: quotes.filter((event) => event.ok).length,
    priceSuccessRatio: prices.length === 0 ? null : priceSuccess / prices.length,
    latencyP50Ms: percentile(latencies, 0.5),
    latencyP95Ms: percentile(latencies, 0.95),
    simulated: history.filter((event) => event.state === "simulated").length,
    submitted: history.filter((event) => event.state === "submitted").length,
    confirmed: history.filter((event) => event.state === "confirmed").length,
    reverted: history.filter((event) => event.state === "reverted").length,
    rejected: history.filter((event) => event.state === "rejected").length,
  };
}

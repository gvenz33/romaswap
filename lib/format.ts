export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  if (value === 0) return "$0";
  if (value > 0 && value < 0.01) return "<$0.01";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  });
}

export function formatPrice(value: number): string {
  if (!(value > 0)) return "—";
  const digits = value >= 1 ? 2 : value >= 0.01 ? 4 : 6;
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
  });
}

export function formatCompactUsd(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return formatUsd(value);
}

export function formatToken(value: number, maxFraction = 6): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  const digits = value >= 1000 ? 2 : value >= 1 ? 4 : maxFraction;
  return value.toLocaleString("en-US", { maximumFractionDigits: digits });
}

export function formatPct(value: number): string {
  const abs = Math.abs(value);
  const body = abs.toLocaleString("en-US", {
    minimumFractionDigits: abs === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  if (value > 0) return `+${body}%`;
  if (value < 0) return `-${body}%`;
  return "0%";
}

export function shortAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function sanitizeAmount(raw: string, decimals: number): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [whole = "", ...rest] = cleaned.split(".");
  const fraction = rest.join("").slice(0, decimals);
  const head = whole.replace(/^0+(?=\d)/, "");
  if (cleaned.includes(".")) return `${head || "0"}.${fraction}`;
  return head;
}

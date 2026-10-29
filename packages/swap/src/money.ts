export function parseHumanAmount(input: string, decimals: number): bigint | null {
  const trimmed = input.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  if (fraction.length > decimals) return null;
  if (whole.length > 40) return null;
  const padded = fraction.padEnd(decimals, "0");
  const combined = `${whole}${padded}`.replace(/^0+/, "") || "0";
  return BigInt(combined);
}

export function formatBaseUnits(amount: bigint, decimals: number, maxFraction = 6): string {
  const negative = amount < 0n;
  const value = negative ? -amount : amount;
  const scale = 10n ** BigInt(decimals);
  const whole = value / scale;
  const fraction = value % scale;
  const digits = fraction.toString().padStart(decimals, "0");
  const shown = digits.slice(0, maxFraction).replace(/0+$/, "");
  const text = shown.length > 0 ? `${whole.toString()}.${shown}` : whole.toString();
  return negative ? `-${text}` : text;
}

export function parseBaseUnitString(value: unknown): bigint | null {
  if (typeof value !== "string" || !/^(0|[1-9][0-9]{0,77})$/.test(value)) return null;
  return BigInt(value);
}

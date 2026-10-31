import { getAddress, isAddress } from "viem";
import type { Token } from "@/lib/tokens";

const STORAGE_KEY = "romaswap.imported-tokens";
const ACCENTS = ["#8ea2ff", "#ffe14a", "#5dffb0", "#ff8a3d", "#ff9ec8", "#7ec8ff"];

export function importedTokenId(address: string): string {
  return `custom:${getAddress(address).toLowerCase()}`;
}

export function accentFor(address: string): string {
  const tint = Number.parseInt(address.slice(2, 4), 16);
  return ACCENTS[tint % ACCENTS.length] ?? ACCENTS[0];
}

export function cleanLabel(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > max) return null;
  if (/[\u0000-\u001f]/.test(trimmed)) return null;
  return trimmed;
}

export function tokenFromImport(input: { address: string; symbol: string; name: string; decimals: number }): Token | null {
  if (!isAddress(input.address)) return null;
  const symbol = cleanLabel(input.symbol, 16);
  const name = cleanLabel(input.name, 64);
  if (!symbol || !name) return null;
  if (!Number.isInteger(input.decimals) || input.decimals < 0 || input.decimals > 18) return null;
  const address = getAddress(input.address);
  return {
    id: importedTokenId(address),
    symbol,
    name,
    address,
    decimals: input.decimals,
    priceUsd: 0,
    change1h: 0,
    change1d: 0,
    fdvUsd: 0,
    volume1dUsd: 0,
    demoBalance: 0,
    accent: accentFor(address),
    imported: true,
    note: "Added from a contract address. This token is not on the reviewed allowlist.",
  };
}

export function readImportedTokens(): Token[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const record = item as { address?: unknown; symbol?: unknown; name?: unknown; decimals?: unknown };
      const token = tokenFromImport({
        address: String(record.address ?? ""),
        symbol: String(record.symbol ?? ""),
        name: String(record.name ?? ""),
        decimals: Number(record.decimals),
      });
      return token ? [token] : [];
    });
  } catch {
    return [];
  }
}

export function writeImportedTokens(tokens: Token[]) {
  const stored = tokens
    .filter((token) => token.imported && token.address)
    .slice(0, 20)
    .map((token) => ({
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
    }));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

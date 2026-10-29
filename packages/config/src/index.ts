export const BASE_CHAIN_ID = 8453 as const;

/** 0x placeholder for native ETH on Base. Not a contract. */
export const NATIVE_ETH_ADDRESS =
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as const;

/** Canonical Base WETH. */
export const BASE_WETH_ADDRESS =
  "0x4200000000000000000000000000000000000006" as const;

/** Native USDC on Base. Bridged USDbC is not this token. */
export const BASE_USDC_ADDRESS =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

/** Bridged USDC. Lookalike. Never allowlisted. */
export const BLOCKED_USDBC_ADDRESS =
  "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA" as const;

/** Modeling assumption from the approved roadmap. Not a live-fee guarantee. */
export const FEE_BPS = 25;

/** Firm quotes older than this cannot be signed. */
export const QUOTE_TTL_MS = 30_000;

/** Default user slippage. 50 bps = 0.50% = 5000 ppm. */
export const DEFAULT_SLIPPAGE_BPS = 50;

export const MIN_SLIPPAGE_BPS = 10;
export const MAX_SLIPPAGE_BPS = 100;

export const ALLOWLIST_VERSION = "2026-10-29.1";

export type TokenStatus = "reviewed";

export type AllowlistedToken = {
  chainId: typeof BASE_CHAIN_ID;
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  native: boolean;
  status: TokenStatus;
  riskRationale: string;
};

export const ALLOWLIST: readonly AllowlistedToken[] = [
  {
    chainId: BASE_CHAIN_ID,
    address: NATIVE_ETH_ADDRESS,
    symbol: "ETH",
    name: "Ether",
    decimals: 18,
    native: true,
    status: "reviewed",
    riskRationale: "Base native gas token, represented by the 0x native placeholder.",
  },
  {
    chainId: BASE_CHAIN_ID,
    address: BASE_WETH_ADDRESS,
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    native: false,
    status: "reviewed",
    riskRationale: "Canonical Base WETH predeploy.",
  },
  {
    chainId: BASE_CHAIN_ID,
    address: BASE_USDC_ADDRESS,
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    native: false,
    status: "reviewed",
    riskRationale: "Native Circle USDC on Base. Not bridged USDbC.",
  },
] as const;

export function sameAddress(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

export function findAllowlistedToken(address: string): AllowlistedToken | undefined {
  return ALLOWLIST.find((token) => sameAddress(token.address, address));
}

export function isBlockedToken(address: string): boolean {
  return sameAddress(address, BLOCKED_USDBC_ADDRESS);
}

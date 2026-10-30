export const BASE_CHAIN_ID = 8453;
export const FEE_BPS = 25;
export const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export type PublicConfig = {
  chainId: 8453;
  feeBps: 25;
  mode: "demo";
  trading: "disabled";
};

export function assertPublicConfig(): PublicConfig {
  const chain = process.env.NEXT_PUBLIC_ROMASWAP_CHAIN_ID ?? String(BASE_CHAIN_ID);
  const fee = process.env.NEXT_PUBLIC_ROMASWAP_FEE_BPS ?? String(FEE_BPS);
  const mode = process.env.NEXT_PUBLIC_ROMASWAP_MODE ?? "demo";

  if (chain !== String(BASE_CHAIN_ID)) {
    throw new Error("RomaSwap only runs on Base, chain ID 8453.");
  }
  if (fee !== String(FEE_BPS)) {
    throw new Error("RomaSwap integrator fee is locked at 25 bps.");
  }
  if (mode !== "demo") {
    throw new Error("This build is demo-only. Live trading is not enabled.");
  }

  return { chainId: BASE_CHAIN_ID, feeBps: FEE_BPS, mode: "demo", trading: "disabled" };
}

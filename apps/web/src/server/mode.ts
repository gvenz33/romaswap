import { isAddress } from "viem";

export type RuntimeMode = {
  quotesEnabled: boolean;
  executionEnabled: boolean;
  live: boolean;
  reason: string;
};

export function runtimeMode(env: NodeJS.ProcessEnv = process.env): RuntimeMode {
  const quotesEnabled = env.SWAP_QUOTES_ENABLED !== "false";
  const executionRequested = env.SWAP_EXECUTION_ENABLED === "true";
  const liveRequested = env.SWAP_LIVE === "true";
  const key = env.ZEROX_API_KEY?.trim() ?? "";
  const recipient = env.SWAP_FEE_RECIPIENT?.trim() ?? "";
  const recipientOk = isAddress(recipient);
  if (!quotesEnabled) {
    return {
      quotesEnabled: false,
      executionEnabled: false,
      live: false,
      reason: "Quote issuance is paused by the kill switch.",
    };
  }
  if (!liveRequested) {
    return {
      quotesEnabled: true,
      executionEnabled: false,
      live: false,
      reason: "Sample prices are on. Live 0x quotes stay off until SWAP_LIVE is set after launch approval.",
    };
  }
  if (!key || !recipientOk) {
    return {
      quotesEnabled: true,
      executionEnabled: false,
      live: false,
      reason: "Live mode was requested, but the 0x API key or fee recipient address is missing.",
    };
  }
  return {
    quotesEnabled: true,
    executionEnabled: executionRequested,
    live: true,
    reason: executionRequested
      ? "Live quotes and wallet execution are enabled."
      : "Live quotes are on. Wallet execution is still paused.",
  };
}

export function feeRecipient(env: NodeJS.ProcessEnv = process.env): `0x${string}` | null {
  const recipient = env.SWAP_FEE_RECIPIENT?.trim() ?? "";
  return isAddress(recipient) ? recipient : null;
}

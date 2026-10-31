export function friendlyWalletError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const lower = message.toLowerCase();

  if (lower.includes("user rejected") || lower.includes("user denied") || lower.includes("rejected the request")) {
    return "The wallet request was rejected. Nothing was signed.";
  }
  if (
    lower.includes("provider not found") ||
    lower.includes("not installed") ||
    lower.includes("connector not found") ||
    lower.includes("no provider")
  ) {
    return "That wallet is not available in this browser. Install its extension, or use WalletConnect for a mobile wallet.";
  }
  if (lower.includes("chain") && (lower.includes("unsupported") || lower.includes("not configured") || lower.includes("switch"))) {
    return "Switch this wallet to Base (chain ID 8453). RomaSwap does not run on any other network.";
  }
  if (!message) return "The wallet did not connect.";

  return message.replace(/0x[a-fA-F0-9]{8,}/g, "0x…").slice(0, 180);
}

import { ALLOWLIST_VERSION, BASE_CHAIN_ID, FEE_BPS } from "@romaswap/config";
import { runtimeMode } from "@/server/mode";

export function GET() {
  const mode = runtimeMode();
  return Response.json({
    chainId: BASE_CHAIN_ID,
    allowlistVersion: ALLOWLIST_VERSION,
    feeBps: FEE_BPS,
    quotesEnabled: mode.quotesEnabled,
    executionEnabled: mode.executionEnabled,
    live: mode.live,
    reason: mode.reason,
  });
}

import { ALLOWLIST_VERSION } from "@romaswap/config";
import { adminAuthorized, jsonError } from "@/server/http";
import { runtimeMode } from "@/server/mode";

export function GET(request: Request) {
  if (!process.env.ADMIN_ACCESS_TOKEN?.trim()) {
    return jsonError(503, "ADMIN_UNCONFIGURED", "Admin access is not configured on this server.");
  }
  if (!adminAuthorized(request)) {
    return jsonError(401, "UNAUTHORIZED", "Admin access was refused.");
  }
  const mode = runtimeMode();
  return Response.json({
    ok: mode.quotesEnabled,
    allowlistVersion: ALLOWLIST_VERSION,
    zeroExConfigured: Boolean(process.env.ZEROX_API_KEY?.trim()),
    feeRecipientConfigured: Boolean(process.env.SWAP_FEE_RECIPIENT?.trim()),
    rpcConfigured: Boolean(process.env.NEXT_PUBLIC_BASE_RPC_URL?.trim()),
    quotesEnabled: mode.quotesEnabled,
    executionEnabled: mode.executionEnabled,
    live: mode.live,
    reason: mode.reason,
  });
}

import { assertPublicConfig } from "@/lib/config";

export function GET() {
  const config = assertPublicConfig();
  return Response.json({
    ok: true,
    chainId: config.chainId,
    feeBps: config.feeBps,
    mode: config.mode,
    trading: config.trading,
  });
}

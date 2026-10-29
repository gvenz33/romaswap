import { ALLOWLIST, ALLOWLIST_VERSION, BASE_CHAIN_ID } from "@romaswap/config";

export function GET(request: Request) {
  const chainId = new URL(request.url).searchParams.get("chainId");
  if (chainId && chainId !== String(BASE_CHAIN_ID)) {
    return Response.json(
      {
        error: {
          code: "UNSUPPORTED_CHAIN",
          message: "The token catalog is published for Base (chain 8453) only.",
        },
      },
      { status: 400 },
    );
  }
  return Response.json({
    chainId: BASE_CHAIN_ID,
    version: ALLOWLIST_VERSION,
    tokens: ALLOWLIST,
  });
}

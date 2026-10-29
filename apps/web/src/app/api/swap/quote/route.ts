import { firmQuote } from "@/server/quote";
import { clientIp, jsonError, rateLimit } from "@/server/http";

export async function POST(request: Request) {
  if (!rateLimit(clientIp(request))) {
    return jsonError(429, "RATE_LIMITED", "Too many quote requests. Wait a minute and try again.");
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "MALFORMED_REQUEST", "The quote request was not valid JSON.");
  }
  const result = await firmQuote(body);
  if (!result.ok) return jsonError(result.status, result.code, result.message);
  return Response.json({ quote: result.quote });
}

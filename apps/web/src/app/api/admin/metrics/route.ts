import { readEvents, summarize } from "@romaswap/telemetry";
import { adminAuthorized, jsonError } from "@/server/http";
import { runtimeMode } from "@/server/mode";

export function GET(request: Request) {
  if (!process.env.ADMIN_ACCESS_TOKEN?.trim()) {
    return jsonError(503, "ADMIN_UNCONFIGURED", "Set ADMIN_ACCESS_TOKEN before opening analytics.");
  }
  if (!adminAuthorized(request)) {
    return jsonError(401, "UNAUTHORIZED", "Admin access was refused.");
  }
  const events = readEvents();
  return Response.json({
    mode: runtimeMode(),
    metrics: summarize(events),
    recent: events.slice(-40).reverse(),
  });
}

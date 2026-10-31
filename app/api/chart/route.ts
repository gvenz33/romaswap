import { CHART_FRAMES, type ChartFrame, coinKeyFor, coinKeyForAddress } from "@/lib/market";
import { tokenById } from "@/lib/tokens";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const frameName = url.searchParams.get("frame") ?? "1D";
  const frame = frameName in CHART_FRAMES ? CHART_FRAMES[frameName as ChartFrame] : CHART_FRAMES["1D"];
  const tokenId = url.searchParams.get("token");
  const address = url.searchParams.get("address");
  const token = tokenId ? tokenById(tokenId) : null;
  const key = token ? coinKeyFor(token) : address ? coinKeyForAddress(address) : null;
  if (!key) return Response.json({ ok: false, points: [] }, { status: 400 });

  const start = Math.floor(Date.now() / 1000) - frame.seconds;
  try {
    const response = await fetch(
      `https://coins.llama.fi/chart/${key}?start=${start}&span=${frame.span}&period=${frame.period}`,
      { next: { revalidate: 60 } },
    );
    if (!response.ok) return Response.json({ ok: false, points: [] }, { status: 502 });
    const body = (await response.json()) as { coins?: Record<string, { prices?: { price?: number }[] }> };
    const points = (body.coins?.[key]?.prices ?? [])
      .map((point) => point.price)
      .filter((price): price is number => typeof price === "number" && price > 0);
    return Response.json({ ok: true, points });
  } catch {
    return Response.json({ ok: false, points: [] }, { status: 502 });
  }
}

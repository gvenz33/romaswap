import { getAddress, isAddress } from "viem";
import { allowlistCoinKeys, coinKeyForAddress, type LivePrice } from "@/lib/market";

export async function GET(request: Request) {
  const extra = new URL(request.url).searchParams.get("extra") ?? "";
  const keys = allowlistCoinKeys();
  for (const part of extra.split(",")) {
    const trimmed = part.trim();
    if (!isAddress(trimmed) || keys.size >= 40) continue;
    const address = getAddress(trimmed);
    keys.set(coinKeyForAddress(address) ?? "", `custom:${address.toLowerCase()}`);
  }
  keys.delete("");

  const list = [...keys.keys()].join(",");
  const now = Math.floor(Date.now() / 1000);
  try {
    const [currentResponse, dayResponse] = await Promise.all([
      fetch(`https://coins.llama.fi/prices/current/${list}`, { next: { revalidate: 60 } }),
      fetch(`https://coins.llama.fi/prices/historical/${now - 86_400}/${list}`, { next: { revalidate: 300 } }),
    ]);
    if (!currentResponse.ok) {
      return Response.json({ ok: false }, { status: 502 });
    }
    const current = (await currentResponse.json()) as { coins?: Record<string, { price?: number }> };
    const day = dayResponse.ok
      ? ((await dayResponse.json()) as { coins?: Record<string, { price?: number }> })
      : { coins: {} };
    const prices: Record<string, LivePrice> = {};
    for (const [key, id] of keys) {
      const usd = current.coins?.[key]?.price;
      if (typeof usd !== "number" || !(usd > 0)) continue;
      const previous = day.coins?.[key]?.price;
      const change1d = typeof previous === "number" && previous > 0 ? ((usd - previous) / previous) * 100 : null;
      prices[id] = { usd, change1d };
    }
    return Response.json({ ok: true, prices, updatedAt: new Date().toISOString() });
  } catch {
    return Response.json({ ok: false }, { status: 502 });
  }
}

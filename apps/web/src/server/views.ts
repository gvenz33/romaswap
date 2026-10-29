import type { SwapIntent } from "@romaswap/swap";

type View = SwapIntent & { id: string; issuedAt: number; used: boolean };

const store = globalThis as unknown as { __romaswapViews?: Map<string, View> };
const views = store.__romaswapViews ?? new Map<string, View>();
store.__romaswapViews = views;

export function issueView(intent: SwapIntent, now = Date.now()): string {
  const id = crypto.randomUUID();
  views.set(id, { ...intent, id, issuedAt: now, used: false });
  for (const [key, view] of views) {
    if (now - view.issuedAt > 120_000) views.delete(key);
  }
  return id;
}

export function consumeView(id: unknown, intent: SwapIntent, now = Date.now()): string | null {
  if (typeof id !== "string") return "Request a price before asking for a firm quote.";
  const view = views.get(id);
  if (!view || view.used || now - view.issuedAt > 60_000) {
    return "That price preview expired. Refresh the price, then review the swap again.";
  }
  const same =
    view.sellToken === intent.sellToken &&
    view.buyToken === intent.buyToken &&
    view.sellAmount === intent.sellAmount &&
    view.slippageBps === intent.slippageBps &&
    view.taker === intent.taker;
  if (!same) return "The firm quote does not match the price you were shown.";
  view.used = true;
  return null;
}

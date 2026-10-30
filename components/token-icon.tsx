import type { Token } from "@/lib/tokens";

export function TokenIcon({ token, size = 24 }: { token: Pick<Token, "symbol" | "accent">; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-[#131313]"
      style={{ width: size, height: size, background: token.accent, fontSize: size * 0.38 }}
      aria-hidden
    >
      {token.symbol.slice(0, 1)}
    </span>
  );
}

export function Sparkline({ seed, up }: { seed: string; up: boolean }) {
  const points = series(seed, 24);
  const width = 88;
  const height = 32;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point - min) / span) * (height - 4) - 2;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <path d={d} fill="none" stroke={up ? "#b6ff6a" : "#ff9ec8"} strokeWidth="1.8" />
    </svg>
  );
}

export function series(seed: string, count: number): number[] {
  let state = 0;
  for (let i = 0; i < seed.length; i += 1) state = (state * 33 + seed.charCodeAt(i)) % 100000;
  const points: number[] = [];
  let value = 40 + (state % 20);
  for (let i = 0; i < count; i += 1) {
    state = (state * 16807 + 17) % 2147483647;
    const delta = (state % 11) - 5;
    value = Math.max(8, Math.min(92, value + delta));
    points.push(value);
  }
  return points;
}

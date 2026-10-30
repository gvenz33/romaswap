export type SamplePool = {
  id: string;
  pair: string;
  base: string;
  quote: string;
  tvlUsd: number;
  volume1dUsd: number;
  volume30dUsd: number;
  volTvl: number;
  aprPct: number;
};

/** Sample Base routes for the demo table. These are not RomaSwap-owned pools. */
export const SAMPLE_POOLS: SamplePool[] = [
  {
    id: "eth-usdc",
    pair: "ETH / USDC",
    base: "ETH",
    quote: "USDC",
    tvlUsd: 18_400_000,
    volume1dUsd: 2_100_000,
    volume30dUsd: 61_000_000,
    volTvl: 0.11,
    aprPct: 8.4,
  },
  {
    id: "weth-usdc",
    pair: "WETH / USDC",
    base: "WETH",
    quote: "USDC",
    tvlUsd: 6_800_000,
    volume1dUsd: 740_000,
    volume30dUsd: 19_400_000,
    volTvl: 0.11,
    aprPct: 6.1,
  },
  {
    id: "cbbtc-usdc",
    pair: "cbBTC / USDC",
    base: "cbBTC",
    quote: "USDC",
    tvlUsd: 9_200_000,
    volume1dUsd: 1_150_000,
    volume30dUsd: 28_600_000,
    volTvl: 0.13,
    aprPct: 7.2,
  },
  {
    id: "cbbtc-eth",
    pair: "cbBTC / ETH",
    base: "cbBTC",
    quote: "ETH",
    tvlUsd: 4_100_000,
    volume1dUsd: 380_000,
    volume30dUsd: 9_700_000,
    volTvl: 0.09,
    aprPct: 4.8,
  },
];

export type SampleTx = {
  id: string;
  pair: string;
  side: "Buy" | "Sell";
  amount: string;
  valueUsd: number;
  when: string;
};

export const SAMPLE_TXS: SampleTx[] = [
  { id: "s1", pair: "ETH → USDC", side: "Sell", amount: "0.42 ETH", valueUsd: 1449, when: "2m ago" },
  { id: "s2", pair: "USDC → cbBTC", side: "Buy", amount: "0.004 cbBTC", valueUsd: 393, when: "11m ago" },
  { id: "s3", pair: "WETH → USDC", side: "Sell", amount: "1.10 WETH", valueUsd: 3795, when: "28m ago" },
  { id: "s4", pair: "cbBTC → ETH", side: "Sell", amount: "0.02 cbBTC", valueUsd: 1968, when: "1h ago" },
  { id: "s5", pair: "ETH → WETH", side: "Buy", amount: "2.00 WETH", valueUsd: 6900, when: "3h ago" },
];

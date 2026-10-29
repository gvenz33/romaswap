export type QuoteSource = "mock" | "live";

export type FeeLine = {
  amount: string;
  token: `0x${string}`;
  symbol: string;
  type: string;
};

export type NormalizedQuote = {
  source: QuoteSource;
  liquidityAvailable: boolean;
  sellToken: `0x${string}`;
  buyToken: `0x${string}`;
  sellAmount: string;
  buyAmount: string;
  minBuyAmount: string;
  feeToken: `0x${string}`;
  feeSymbol: string;
  feeBps: number;
  integratorFee: FeeLine | null;
  zeroExFee: FeeLine | null;
  estimatedGas: string | null;
  gasPrice: string | null;
  slippageBps: number;
  quotedAt: number;
  expiresAt: number;
  allowanceSpender: `0x${string}` | null;
  transaction: {
    to: `0x${string}`;
    data: `0x${string}`;
    value: string;
  } | null;
  executable: boolean;
  simulationOnly: boolean;
};

export type ZeroExResponse = {
  liquidityAvailable?: boolean;
  buyAmount?: string;
  minBuyAmount?: string;
  sellAmount?: string;
  buyToken?: string;
  sellToken?: string;
  allowanceTarget?: string | null;
  gas?: string | null;
  gasPrice?: string | null;
  fees?: {
    integratorFee?: { amount?: string; token?: string; type?: string } | null;
    zeroExFee?: { amount?: string; token?: string; type?: string } | null;
  };
  issues?: {
    allowance?: { actual?: string; spender?: string } | null;
    balance?: unknown;
    simulationIncomplete?: boolean;
  } | null;
  transaction?: {
    to?: string;
    data?: string;
    value?: string;
    gas?: string;
    gasPrice?: string;
  } | null;
};

export type SwapIntent = {
  sellToken: `0x${string}`;
  buyToken: `0x${string}`;
  sellAmount: bigint;
  slippageBps: number;
  taker: `0x${string}` | null;
};

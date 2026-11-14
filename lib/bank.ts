export const FIAT_PLATFORMS = [
  {
    id: "bank",
    label: "Bank",
    step: "Pay from your bank",
    privacy: "RomaSwap does not ask for a bank login, account number, or routing number.",
  },
  {
    id: "cash-app",
    label: "Cash App",
    step: "Pay with Cash App",
    privacy: "RomaSwap does not ask for a Cash App login.",
  },
  {
    id: "zelle",
    label: "Zelle",
    step: "Pay with Zelle",
    privacy: "RomaSwap does not ask for a Zelle or bank login.",
  },
  {
    id: "venmo",
    label: "Venmo",
    step: "Pay with Venmo",
    privacy: "RomaSwap does not ask for a Venmo login.",
  },
  {
    id: "wise",
    label: "Wise",
    step: "Pay with Wise",
    privacy: "RomaSwap does not ask for a Wise login.",
  },
  {
    id: "revolut",
    label: "Revolut",
    step: "Pay with Revolut",
    privacy: "RomaSwap does not ask for a Revolut login.",
  },
] as const;

export type FiatPlatformId = (typeof FIAT_PLATFORMS)[number]["id"];

export function fiatPlatform(id: string) {
  return FIAT_PLATFORMS.find((platform) => platform.id === id) ?? FIAT_PLATFORMS[0];
}

export const BANK_FEE_BPS = 25;

export type BankBuyQuote = {
  receive: number;
  feeUsd: number;
  netUsd: number;
};

/** Indicative conversion from dollars into a token. No bank debit is created. */
export function bankBuyQuote(usd: number, priceUsd: number): BankBuyQuote | null {
  if (!Number.isFinite(usd) || usd <= 0) return null;
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) return null;
  const feeUsd = usd * (BANK_FEE_BPS / 10_000);
  const netUsd = usd - feeUsd;
  return { receive: netUsd / priceUsd, feeUsd, netUsd };
}

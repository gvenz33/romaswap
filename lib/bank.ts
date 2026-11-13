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

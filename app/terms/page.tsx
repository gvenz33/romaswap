import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 text-sm leading-7 text-[#d7d7d7]">
      <h1 className="text-3xl font-medium text-white">Terms of Service</h1>
      <p className="mt-4">
        RomaSwap is an independent Base interface for reviewing token swaps. This deployment is a demo. It shows sample prices and records nothing onchain. It does not broadcast transactions, hold customer assets, or request a seed phrase.
      </p>
      <p className="mt-3">
        RomaSwap is an independent product. It is not affiliated with Uniswap Labs. The layout follows a familiar swap-interface pattern and uses RomaSwap’s own name, copy, and mark.
      </p>
      <p className="mt-3">
        When live trading is later approved, you would connect a wallet you control, review the network, tokens, amount, fee, slippage, minimum received, and estimated network fee, and sign in that wallet. The planned integrator fee is 0.25% (25 bps). Fee collection prefers native Base USDC when USDC is the token you sell or buy.
      </p>
      <p className="mt-3">
        cbBTC means Coinbase Wrapped BTC on Base. It is not native Bitcoin. RomaSwap does not promise redemption, profit, or that a swap will execute.
      </p>
      <p className="mt-3">
        Nothing here is an offer to buy or sell securities, a solicitation, or investment, legal, or tax advice. Live trading stays off until counsel, security review, and the owner’s written approval.
      </p>
      <p className="mt-6">
        <Link className="text-[#ffe14a]" href="/swap">Back to Swap</Link>
      </p>
    </article>
  );
}

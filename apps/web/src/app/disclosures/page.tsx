export default function DisclosuresPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <h1 className="font-serif text-5xl text-cream">Disclosures</h1>
      <div className="mt-6 space-y-4 text-base leading-7 text-mute">
        <p>
          RomaSwap is a noncustodial interface. It does not hold your assets, seed phrase, or private keys, and it does
          not submit transactions for you. Your wallet signs every approval and swap.
        </p>
        <p>
          The modeled integrator fee is 0.25% (25 basis points). When native Base USDC is one side of the pair, the fee
          is taken in that USDC. Otherwise it is taken in the sell token. A third token is never used. The amount you
          sign is the amount returned by the quote, shown before the wallet opens.
        </p>
        <p>
          Quotes can expire, liquidity can disappear, and a transaction can revert. A reverted swap is not revenue.
          Sample mode does not broadcast anything. Live trading stays disabled until the fee wallet, 0x key, security
          review, and regulatory signoff are in place.
        </p>
        <p>
          Only reviewed Base assets are offered: ETH, WETH, and native USDC. Bridged USDbC is rejected. RomaSwap does
          not bridge, lend, or trade perpetuals, and it does not promise the best price in every market.
        </p>
      </div>
    </main>
  );
}

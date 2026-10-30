# RomaSwap product requirements

## Mission
Premium, black-and-gold branded token swap experience comparable in usability to Uniswap. Frontend brand: **RomaSwap**. The initial product is an interface/aggregator, not an independently operated AMM, L1 blockchain, custodial exchange, bridge, fiat onramp, or investment adviser.

## MVP in scope
- Base mainnet (chain ID `8453`) only.
- Wallet connections: MetaMask, Coinbase Wallet, WalletConnect-compatible wallets, **including Trust Wallet** where supported by connector and platform.
- ETH/native Base asset and a reviewed allowlist of Base ERC-20s including native USDC, subject to 0x support and sufficient liquidity.
- Price requests and firm swap quotes; explicit network, token contract, send amount, estimated received, min received, slippage, route/fees and gas before confirmation.
- User-controlled ERC-20 approval and transaction signing; clear pending/succeeded/reverted/expired states.
- Balances and transaction history for connected address (data from authorized indexer or indexed blockchain, no private keys).
- Server-configured platform integrator fee **25 basis points (0.25%)** with USDC preference; fee revenue goes to a dedicated RomaSwap business-controlled Base address.
- Responsive mobile-first polished Roman black/gold UI, using provided logo only as a visual concept.
- Admin analytics limited to necessary noncustodial operational data (aggregate trades, volumes, fee receipts, API errors) with access control.
- Token allowlist, transaction simulations, rate limits, logging, alerts, independent security review, regulatory gate before live launch.

## Explicitly out of scope at launch
Custom AMM/pools, proprietary DEX smart contracts, RomaSwap token, yield/lending/staking, fiat purchases, native Bitcoin or native Solana swaps, bridging/cross-chain routing, discretionary trading, bot trading, custodial deposit accounts, automated sweeping using a hot-wallet seed.

## Design goals
Trustworthy and transparent rather than meme-centric; highly readable exchange widget; no guarantee of returns or execution; UI must make wrapped BTC (e.g. cbBTC) distinct from Bitcoin native chain. Accessible responsive layouts and safe failure states.

## Decisions awaiting owner confirmation
Exact public domain and brand clearance; legal entity and regulatory counsel; production fee-receiving **public address**; exact token allowlist and fallback-token priority; supported jurisdictions; whether to retain 25 bps after competitive pricing analysis; chain RPC/indexer/vendor selection; analytics retention/privacy policy; testnet quote strategy (0x support varies by chain); UI final logo assets.

# Architecture and integrations

## Suggested stack
Next.js (App Router), TypeScript strict, React, Tailwind or approved styling system; wagmi + viem; wallet connectors through Reown/WalletConnect and Coinbase Wallet; 0x Swap API v2 (AllowanceHolder flow); server endpoints using route handlers; optional Postgres for aggregate metrics and transaction metadata; RPC/indexing provider with quotas and fallback; Sentry-like error monitoring.

## Transaction workflow
1. User connects self-controlled wallet and checks Base chain ID 8453.
2. UI obtains balances and token info from chain; only allowlist assets can be selected.
3. Server validates amount, addresses, chain, user wallet address, allowlisted tokens, fee config. GET 0x `/swap/allowance-holder/price` for indicative price (verify current 0x path and required headers).
4. On swap, GET `/swap/allowance-holder/quote` with exact amount, taker, selected `swapFeeToken`, `swapFeeBps=25`, and fixed `swapFeeRecipient` from server env.
5. Validate response (chain, tokens, input amount, taker, fee recipient and token, allowance issue/amount, TTL where supplied, minimum output, source). Never trust client price or spender.
6. If an ERC-20 allowance is needed, wallet must approve **verified AllowanceHolder spender** from the API response, not Settler; encourage exact allowance over unlimited. Wait for approval receipt and refresh quote if needed.
7. Preview complete costs including fee, estimated gas, price impact/slippage and minimum received. Requote on expiry or changed input; prompt user approval.
8. User signs and broadcasts transaction with wallet. Never store wallet signing material server-side.
9. Monitor transaction confirmation/reverts; reconcile onchain integrator fee by receipt logs and balances; display tx link for Base explorer. Handle reorg/pending timeout and avoid claiming settlement too early.

## Suggested API routes
- `GET /api/tokens` — vetted Base token list.
- `POST /api/swap/price` — validated indicative price proxy.
- `POST /api/swap/quote` — validated firm quote proxy + server fee config.
- `GET /api/wallet/:address/history` — indexed noncustodial tx history (rate limited).
- `GET /api/health` — safe operational status without secret exposure.
- Admin: authenticated aggregate analytics / fee reconciliation. These are proposals, not deployed endpoints.

## Technical safeguards
Quote expiry and repricing; RPC fallback; versioned token allowlist; contract verification; checksummed addresses; amount/decimal safety using bigint; CORS/CSRF protections as applicable; server API key, rate limiting; sessionless wallet connection unless authenticated ownership proof is specifically needed. Never assume a wallet connection by itself authenticates an admin.

## Authoritative docs to refresh before coding
- https://docs.0x.org/
- https://docs.base.org/
- https://wagmi.sh/
- https://viem.sh/
- https://docs.reown.com/
- https://developers.circle.com/stablecoins/usdc-contract-addresses

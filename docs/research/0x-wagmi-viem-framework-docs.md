# Framework docs dossier: 0x Swap API v2, fees, quote submission, Base, wagmi/viem, Next.js proxy

Fetched 2026-10-29 (UTC). The research brief dated the task 2026-10-28. No packages are installed in this workspace and there is no `package.json`; versions below are from published docs and npm pages, not from a local install.

## Source coverage and disagreements

Context7 (`resolve-library-id` for `0x`, `wagmi`, and `viem`) returned `Monthly quota exceeded` before any `query-docs` call. Nothing in this dossier comes from Context7, so there is no Context7-versus-web disagreement to report. Every factual claim below is from a page fetched on 2026-10-29.

Official docs beat blogs. Where two official 0x pages disagree, that is called out in place. Parameter names that do not appear in the current reference are marked UNVERIFIED and are not recommended.

Deprecation searches run as requested:

- "0x Swap API deprecated 2026 sunset shutdown" — current docs do not describe a 2026 sunset of Swap API v2. They say API v1 was sunset on 11 April 2025. The changelog is still shipping Swap API changes through 30 September 2026.
- "0x Swap API v2 breaking changes migration" — the current migration document is [Upgrading to Swap API v2](https://docs.0x.org/docs/upgrading/upgrading-to-swap-v2).

Do not call `https://api.0x.org/swap/v1`. Do not send v1 parameter names.

## 1. 0x Swap API v2 as of late 2026

v2 is the current Swap API. v1 was replaced by v2, not by a v3.

[Upgrading overview](https://docs.0x.org/docs/upgrading/overview) lists the v1 lifecycle and states the current stage is "Sunset – End of Life": "API v1 fully retired; endpoints will no longer be accessible" on 11 April 2025. The same page says that after that date "all teams must have upgraded to v2" and "Integrators will no longer be able to use v1 endpoints." [Upgrading to Swap API v2](https://docs.0x.org/docs/upgrading/upgrading-to-swap-v2) repeats: "0x API v1 was sunset on April 11, 2025."

The [changelog](https://docs.0x.org/changelog) entry for 30 September 2026 still adds Base liquidity sources and documents Swap, Gasless, and Cross-Chain API changes. That is the latest changelog entry retrieved. v2 is what those entries are changing.

### What replaced v1

From the upgrade guide, the v1 shape is gone:

| v1 | v2 |
| --- | --- |
| Chain in the hostname, for example `https://polygon.api.0x.org/swap/v1/quote` | One host, `https://api.0x.org`, plus query `chainId` |
| Version in the path (`/swap/v1/`) | Required header `0x-version: v2` |
| `takerAddress` | `taker` |
| `sellTokenAddress` | `sellToken` |
| `buyTokenAddress` | `buyToken` |
| Allowance on the 0x Exchange Proxy (`to` in the v1 sample is `0xdef1c0ded9bec7f1a1670819833240f027b25eff`) | Allowance on AllowanceHolder or Permit2, returned per response. Never approve the Settler. |
| Top-level `to`, `data`, `value`, `gas`, `gasPrice` | Those fields moved under `transaction` |
| `buyTokenFeePercentage`, `feeRecipient`, `feeRecipientTradeSurplus`, `slippagePercentage` (names in the v1 sample curl) | `swapFeeBps` or `swapFeePpm`, `swapFeeRecipient`, `swapFeeToken`, `slippagePpm` (`slippageBps` still accepted but marked deprecated) |

`skipValidation` was removed. Quotes are always validated. A new `liquidityAvailable` field gates the rest of the payload: other fields are omitted when it is `false` ([FAQ](https://docs.0x.org/docs/introduction/faq)).

### Recommended path for a new EVM integrator on Base (chain id 8453)

Use Allowance Holder, not Permit2 and not Gasless, as the default.

[Contracts](https://docs.0x.org/docs/core-concepts/contracts) calls AllowanceHolder "the default and recommended allowance contract for most integrators" because of gas, a single standard approval, and fewer integration pitfalls than Permit2. Endpoints:

- `GET /swap/allowance-holder/price`
- `GET /swap/allowance-holder/quote`

The same page says AllowanceHolder fits teams that want one wallet UX, people upgrading from Swap v1, and multisigs or smart-contract wallets.

The upgrade FAQ distinguishes the two allowance styles:

- AllowanceHolder: one signature, closest to v1, consistent across wallets.
- Permit2: universal allowance that can be reused across apps, but two signatures per trade (approval signature plus the swap). Use `/swap/permit2/price` and `/swap/permit2/quote` only when that UX is required. After the quote, sign `permit2.eip712` and append the signature length and signature data to `transaction.data` before `sendTransaction`. `permit2` is null when the sell token is native or the trade is wrap/unwrap ([Permit2 getQuote](https://docs.0x.org/api-reference/evm-ap-is/swap/permit-2-getquote)).

Gasless is a separate live product (section 8). It is not the recommended default. It cannot sell the native token, and the client does not submit the swap with `sendTransaction`.

The AllowanceHolder quickstart is explicitly the getting-started path: [Get Started with Swap API](https://docs.0x.org/evm/0x-swap-api/guides/swap-tokens-with-0x-swap-api).

### Base URL, paths, headers

[API Overview](https://docs.0x.org/api-reference/api-overview) says every request uses:

```text
https://api.0x.org
```

HTTPS only. HTTP is rejected.

Required headers on Swap requests, from the overview and the quickstart:

| Header | Value |
| --- | --- |
| `0x-api-key` | API key from the 0x Dashboard (`https://dashboard.0x.org/apps`). Required. |
| `0x-version` | `v2`. Required. The version is no longer in the URL. |

Optional on quote, from the quickstart: `Accept-Signature`, to receive a signed response that can be checked against tampering. See the Response Signatures guide linked from that page. This header is not required to get a quote.

Exact HTTP paths for the recommended integration:

```text
GET https://api.0x.org/swap/allowance-holder/price
GET https://api.0x.org/swap/allowance-holder/quote
```

Permit2 equivalents, if chosen:

```text
GET https://api.0x.org/swap/permit2/price
GET https://api.0x.org/swap/permit2/quote
```

Base is `chainId=8453` (section 4).

### Price versus quote

[Get Started with Swap API](https://docs.0x.org/evm/0x-swap-api/guides/swap-tokens-with-0x-swap-api):

- `/swap/allowance-holder/price` is an indicative price. It "returns pricing information without creating a full order or transaction." The page calls `/price` the "read-only" version of `/quote`. The published price sample has no `transaction` object. It does return `allowanceTarget`, `issues`, `buyAmount`, `minBuyAmount`, `gas`, `gasPrice`, and `liquidityAvailable`.
- `/swap/allowance-holder/quote` is the firm quote, requested "when you're ready to execute." "The response includes a full 0x order, ready for submission to the network. The Market Maker is expected to have reserved the necessary assets, reducing the likelihood of order reversion."

The Next.js guide restates the same split ([Build a Token Swap App (AllowanceHolder)](https://docs.0x.org/evm/0x-swap-api/guides/build-token-swap-dapp-nextjs)):

- Indicative prices do not reserve liquidity and are for browsing. Avoid `/quote` until the user intends to trade.
- Firm quotes "Reserve liquidity from market makers" and "Contain a fully executable order."

`taker` is optional on `/price` and required on `/quote`. The upgrade FAQ: "Can I skip validation for the /quote endpoint by leaving the `taker` parameter blank? No, the `taker` parameter is required in v2 for `/quote`." The price FAQ on the same page says RFQ liquidity is still included in `/price` when `taker` is blank.

"One-time" is not the word the Swap API reference uses. What is documented:

- Firm quotes are for execution and market-maker inventory is expected to be reserved.
- [FAQ](https://docs.0x.org/docs/introduction/faq): "RFQ quotes from Market Makers are only valid for a short period (roughly 60s on mainnet)." Best practice stated there: refresh quotes about every 30 seconds. The 60-second figure is explicitly "on mainnet." A Base-specific RFQ TTL was not in the pages fetched. UNVERIFIED for chain 8453.
- RFQ orders that include `taker` are exclusive to that taker ([RFQ System Overview](https://docs.0x.org/evm/0x-swap-api/additional-topics/about-the-rfq-system)).
- UNVERIFIED: a general rule that AllowanceHolder `transaction.data` can be mined only once, or a Swap API error code equivalent to Gasless `TRADE_ALREADY_SUBMITTED`. That one-time error exists on Gasless submit (section 8), not in the Swap quote schema reviewed here.

Required quote query parameters from [getQuote (Allowance Holder)](https://docs.0x.org/api-reference/evm-ap-is/swap/allowanceholder-getquote), fetched 2026-10-29:

- `chainId` (integer, required)
- `buyToken` (address, required)
- `sellToken` (address, required)
- exactly one of `sellAmount` or `buyAmount` (base units as strings). Both together is an error.
- `taker` (address, required) — the address that holds `sellToken` and the allowance

`taker` is optional on [getPrice (Allowance Holder)](https://docs.0x.org/api-reference/evm-ap-is/swap/allowanceholder-getprice). `sellAmount` / `buyAmount` exclusivity is the same.

Slippage, do not use the deprecated parameter for a new integration. The quote reference says:

- `slippageBps` — "Deprecated: use `slippagePpm` instead. `slippageBps` accepts only whole numbers." If omitted, default tolerance is 100 bps. Range documented on [Troubleshooting Swap API](https://docs.0x.org/evm/0x-swap-api/guides/troubleshooting-swap-api) is `[0...10000]`. `0` means no slippage.
- `slippagePpm` — mutually exclusive with `slippageBps`. The reference example is `3000 PPM = 30 BPS = 0.30%`.

`minBuyAmount` is the floor; if the buy amount would fall below it, the transaction reverts. It is influenced by `slippagePpm` or `slippageBps`.

## 2. Integrator fee (0.25% = 25 bps)

Current parameter names, from the Allowance Holder quote reference and [Monetize Your App on EVM](https://docs.0x.org/evm/0x-swap-api/guides/monetize-your-app-using-swap):

| Name | Role |
| --- | --- |
| `swapFeeRecipient` | Wallet that receives the fee. Required together with the fee amount. Comma-separated for multiple recipients. |
| `swapFeeBps` | Fee in basis points of `swapFeeToken`. Mutually exclusive with `swapFeePpm`. |
| `swapFeePpm` | Same fee in parts per million. Use this when bps is too coarse. `5000 PPM = 50 BPS = 0.5%`. |
| `swapFeeToken` | Optional. Must be the `buyToken` address or the `sellToken` address. |

For 0.25% (25 bps), which is an integer number of bps, the documented call is:

```text
swapFeeRecipient=<integrator wallet>
swapFeeBps=25
swapFeeToken=<buyToken or sellToken address>
```

Equivalent finer form, same rate: `swapFeePpm=2500` and do not also send `swapFeeBps`. 1 bps = 100 ppm because the reference defines `5000 PPM = 50 BPS = 0.5%`.

`swapFeeBps` is not marked deprecated. `slippageBps` is. Do not confuse them.

### Constraints that are in the docs

- Both `swapFeeRecipient` and `swapFeeBps` (or `swapFeePpm`) must be sent. One without the other does not turn the fee on ([Multi-Fee Support](https://docs.0x.org/evm/0x-swap-api/additional-topics/multi-fee-support)).
- Default security cap is 1000 bps (10%) per recipient. The reference: "For security, this field has a default limit of 1000 Bps. If your application requires a higher value, please reach out to us." `swapFeePpm` values are integers from 0 to 1000000, with a default security limit of 100000 PPM (also 10%). 25 bps is inside the cap.
- Multiple recipients are positional and the lists must be the same length. `fees.integratorFee` is the first fee, kept for compatibility. `fees.integratorFees` is the full list.
- Affiliate fees are "Available on all pricing plans" (monetize guide). The Next.js guide says they are "available on both free and paid plan." A dashboard API key is still required on every request, and the create-key guide says you choose which products (Swap API and Gasless API) the key can call. That is not an extra "approved integrator" gate for the affiliate fee itself.
- Trade surplus is a different feature and is gated. `tradeSurplusRecipient` is "only available to selected integrators on a custom pricing plan." Do not use surplus collection as a substitute for the 25 bps affiliate fee unless support has enabled it. Surplus is always in the buy token.

### Fee token: sell, buy, USDC, or neither

There is no current "fee in buy token only" rule.

[FAQ](https://docs.0x.org/docs/introduction/faq): "In API v2, you can take fees on `buyToken` or `sellToken`." The monetize guide: `swapFeeToken` "must be set to either the value of `buyToken` or the `sellToken`." The quote reference repeats: "Each token must be set to the value of either the `buyToken` or the `sellToken`."

If `swapFeeToken` is omitted, 0x picks. [Multi-Fee Support](https://docs.0x.org/evm/0x-swap-api/additional-topics/multi-fee-support): "If omitted, 0x defaults to the buy token, unless the sell token has higher priority (e.g., stablecoins or a more liquid asset) or the buy token is ineligible." The quote reference short form is "preference to stablecoins and highly liquid assets." Omitting the token is not a guarantee of USDC, and it is not a guarantee of the buy token when the sell token is a stablecoin.

USDC as the fee token when it is only one side: yes, if that USDC address is `buyToken` or `sellToken`. Set `swapFeeToken` to that same address. The monetize guide's worked example takes the fee in the sell token (DAI) while buying ETH.

USDC when neither side is USDC: not allowed as `swapFeeToken`. The address would not be `buyToken` or `sellToken`. The monetize guide says: "If you would like to receive a specific type of token (e.g. USDC), you will need to convert those on your own."

The phrase "fee token must be in the pair" matches the documented rule. A third token, including USDC that is not the buy or sell token, is outside the rule.

### Names that are not v2 parameters

Checked against the v2 quote reference, the monetize guide, the multi-fee page, and the v1 sample in the upgrade guide:

| Candidate | Status |
| --- | --- |
| `swapFeeBps` | Current. |
| `swapFeeRecipient` | Current. |
| `swapFeeToken` | Current. |
| `swapFeePpm` | Current alternative to `swapFeeBps`. |
| `feeRecipient` | v1 name in the upgrade-guide sample curl. Not a v2 query parameter in the current reference. |
| `buyTokenFeePercentage` | v1 name in that same sample (`buyTokenFeePercentage=0.1`). Replaced by bps/ppm. |
| `buyTokenPercentageFee` | UNVERIFIED. This exact string does not appear in the pages fetched. Do not send it. |
| `affiliateAddress` | UNVERIFIED. This exact string does not appear in the pages fetched. Do not send it. |
| `feeRecipientTradeSurplus` | v1 sample name. v2 name is `tradeSurplusRecipient`, and it is plan-gated. |

### How the fee amount is reported, and a docs conflict

The response field is `fees.integratorFee` with `amount`, `token`, and `type: "volume"`. For several recipients, also read `fees.integratorFees`.

The FAQ gives a formula for the sell-token case: `amount = (swapFeeBps / 10000) * sellAmount` in sell-token base units. Its example is 1% of 100 USDC (`swapFeeBps=100`, `sellAmount=100000000`) producing `1000000`.

The monetize guide repeats that sell-amount formula, then shows a JSON fragment whose `token` is `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913` while the prose example sell token is Ethereum USDC `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`. Those two addresses are different chains. Treat the formula and the prose as the sell-token case, and treat `fees.integratorFee.token` plus `fees.integratorFee.amount` as the values to display. The multi-fee example omits `swapFeeToken` on an ETH-to-USDT style pair and the returned fee token is the buy token (USDT). So the sell-amount formula does not describe every omitted-token response.

The monetize sample comment also says `swapFeeBps=100` is a "Percentage of buyAmount" while `swapFeeToken` is set to the sell token (DAI). The parameter reference does not say the bps base flips with the comment. It says bps of `swapFeeToken`. Display the response amount rather than recomputing from the conflicting comment.

## 3. Quote transaction shape and how to submit it

From [getQuote (Allowance Holder)](https://docs.0x.org/api-reference/evm-ap-is/swap/allowanceholder-getquote), `transaction` is required on a successful firm quote and contains only:

| Field | Meaning in the reference |
| --- | --- |
| `to` | Contract to send `data` to. "Do NOT use this field when setting token allowances — doing so can result in lost funds. Always use `issues.allowance.spender` or `allowanceTarget`." |
| `data` | Calldata for `to`. |
| `gas` | Gas limit "that should be used to send the transaction to guarantee settlement." Nullable. |
| `gasPrice` | "The gas price (in wei) that should be used to send the transaction." Required in the schema. It can be null in an example payload in that same reference. |
| `value` | "The amount of ether (in wei) that should be sent with the transaction." For an ERC-20 sell the quickstart example is `"0"`. For a native sell, `value` carries the sell amount. |

EIP-1559 fields are not in this object. `maxFeePerGas`, `maxPriorityFeePerGas`, and `type` do not appear in the transaction schema. UNVERIFIED as response fields.

There is a real tension between the schema and the published client samples:

- The schema says `gasPrice` should be used to send the transaction.
- The viem quickstart sends only `to`, `data`, and `value` (value as `BigInt`).
- The Next.js guide sends `account`, `gas` (as `BigInt`), `to`, `data`, and `chainId`. It does not pass `value` or `gasPrice`.

[wagmi `estimateGas`](https://wagmi.sh/core/api/actions/estimateGas) says `gasPrice` "Only applies to Legacy Transactions." Forwarding `transaction.gasPrice` into wagmi/viem can therefore force a legacy (type 0) transaction. The 0x samples do not do that; they leave the fee fields to the wallet. For a native sell, `value` still has to be forwarded or the swap is not funded. The Next.js snippet's omission of `value` is safe only when `value` is `0`. The quickstart includes `value` for that reason.

`issues` on both price and quote:

- `issues.allowance` is null when no approval is needed. Otherwise the documented fields are `actual` (current allowance) and `spender` (the address to approve). There is no `expected` or recommended approval amount on `issues.allowance`.
- `issues.balance` is null when the taker has enough sell token. Otherwise `token`, `actual`, and `expected`.
- `issues.simulationIncomplete` is true when 0x could not fully validate, often because the taker balance is too low. The reference says this does not necessarily mean the trade will revert.
- `issues.invalidSourcesPassed` is an array.

`allowanceTarget` is also returned and is the same class of address as `issues.allowance.spender`. For native sells, wrapping, and unwrapping, no allowance is needed and `allowanceTarget` is null. [Set Token Allowances](https://docs.0x.org/evm/0x-swap-api/additional-topics/how-to-set-your-token-allowances).

Which contract that spender is:

| Endpoint | Approve | Send `transaction.data` to |
| --- | --- | --- |
| `/swap/allowance-holder` | AllowanceHolder (`issues.allowance.spender` or `allowanceTarget`) | `transaction.to`, which is AllowanceHolder, except a native sell, where `transaction.to` is the current Settler and no approval is required |
| `/swap/permit2` | Permit2 | `transaction.to`, which is the Settler. Do not approve the Settler. |

The upgrade guide is explicit: "NEVER set an allowance on the Settler contract." "ONLY set allowances on AllowanceHolder or Permit2 contracts, as indicated by the API responses." "You will never need to approve one contract and send swap calldata to another" in the AllowanceHolder flow, with the ETH exception above. AllowanceHolder addresses can change when a chain adopts a higher hardfork. Do not hardcode `transaction.to`. Sample addresses that appear in docs (AllowanceHolder `0x0000000000001ff3684f28c67538d4d072c22734`, Permit2 `0x000000000022d473030f116ddee9f6b43ac78ba3`) are examples, not a license to skip the response.

Approval amount: the schema does not return one. The allowances guide's Etherscan steps say set `_value` to the maximum uint256 (`2^256 - 1`). The wagmi snippet passes `MAX_ALLOWANCE`. The quickstart approves `maxUint256` to `price.issues.allowance.spender` via viem `write.approve`. A separate warning says to approve enough for the sell amount "as well as the gas" or gas estimation can fail. The upgrade guide's "sets allowances per trade" sentence is about 0x no longer using an unlimited allowance on the Exchange Proxy, not a field that tells the wallet the exact approve amount. UNVERIFIED: an API field named approval amount.

### sendTransaction versus writeContract

Two different calls:

1. ERC-20 approval is a contract write. 0x's wagmi section uses `useReadContract`, `useSimulateContract`, and `useWriteContract` on the sell token's `approve(spender, amount)`, with `spender` equal to `issues.allowance.spender`. That is `writeContract`, not `sendTransaction`.
2. The swap itself is opaque calldata. The quickstart says: "submit the transaction using your preferred web3 library. In this example, we use viem's `sendTransaction`" with `to`, `data`, and `value`. The Next.js guide says it uses wagmi `useSendTransaction` and shows `sendTransaction({ account, gas, to, data, chainId })`.

Do not ABI-encode the swap with `writeContract` unless you have the entry-point ABI. 0x returns `data` already encoded and warns against treating `transaction.to` as an allowance target. Permit2 adds `signTypedData` of `permit2.eip712` and a calldata append before the same `sendTransaction`. Gasless does not use `sendTransaction` for the swap at all (section 8).

## 4. Base mainnet

[Supported Chains and Providers](https://docs.0x.org/docs/introduction/supported-chains) lists Base with chain ID `8453` and marks both Swap API and Gasless API supported. The chain is selected with the `chainId` query parameter, not a `base.api.0x.org` host. The 30 September 2026 changelog still adds Base liquidity sources (BaiBai and Manta on 30 September; Forte on 31 August), so Base support was current on the latest changelog page fetched.

Native ETH versus WETH, from [Handle Native Tokens](https://docs.0x.org/evm/0x-swap-api/additional-topics/handling-native-tokens):

- For most supported EVM chains, the native token is the placeholder `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`.
- The documented exceptions are Mantle (MNT at `0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000`) and Arc (USDC as gas, with a different ERC-20 interface). Base is not an exception. A native ETH sell on Base uses `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`, not WETH.
- The FAQ says the same placeholder "is a standardized representation of native tokens (e.g., ETH, BNB, POL)."

WETH and USDC addresses that the docs actually name on chain 8453, inside samples rather than a token directory:

- [Get Started with Gasless API](https://docs.0x.org/evm/gasless-api/guides/get-started-with-gasless-api) sells "USDC" `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913` for "WETH" `0x4200000000000000000000000000000000000006` with `chainId=8453`.
- The [0x Cheat Sheet](https://docs.0x.org/docs/core-concepts/0x-cheat-sheet) gasless sample uses the same pair on `chainId=8453`. The response route labels `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913` as symbol `USDC` and `0x4200000000000000000000000000000000000006` as `WETH`. The EIP-712 domain in that sample is name `"USD Coin"`, version `"2"`, `chainId: 8453`, `verifyingContract` equal to that USDC address.

Those addresses are cited from 0x samples. This pass did not fetch Circle's or Base's own token lists. The monetize guide's JSON fragment uses the same USDC address next to an Ethereum mainnet USDC in the prose; do not treat that fragment as an Ethereum address.

The gasless getting-started cURL uses `sellAmount=100000` while the comment above it says 100 USDC, which at 6 decimals is `100000000`. The address labels are consistent. The amount in that cURL does not match its own comment. UNVERIFIED which amount the author intended; do not copy `100000` as 100 USDC.

One gasless pseudo-URL on that page still says `takerAddress`. The API reference and the cURL on the same page use `taker` plus `chainId`. Follow the reference.

## 5. wagmi, viem, Next.js App Router, Trust Wallet, Base chain object

Versions published when fetched on 2026-10-29:

| Package | Version found | Source |
| --- | --- | --- |
| `wagmi` | 3.7.9, "Published 8 days ago" on that page | [npm wagmi](https://www.npmjs.com/package/wagmi) |
| `viem` | 2.57.13, "Published 15 hours ago" on that page | [npm viem](https://www.npmjs.com/package/viem) |

Current wagmi install docs still pin viem 2.x, not a viem 3: [Installation](https://wagmi.sh/react/installation) and [Getting Started](https://wagmi.sh/react/getting-started) both say `npm install wagmi viem@2.x @tanstack/react-query`. Compatible majors for a new App Router app, as those pages and npm describe them today: wagmi 3 and viem 2. A wagmi v2 site still exists at `2.x.wagmi.sh`; the current docs are v3 ([Migrate from v2 to v3](https://wagmi.sh/core/guides/migrate-from-v2-to-v3)). UNVERIFIED: a wagmi peer-dependency range pasted from the npm registry JSON. The install command above is what the current docs tell you to run. UNVERIFIED: an official wagmi matrix that names a specific Next.js major. The SSR guide is written for the App Router and uses `await headers()`, which is the Next.js 15-and-later `headers()` signature. This pass did not fetch a Next.js release page.

### SSR cookie hydration

`cookieToInitialState` is still the documented helper. No successor is named.

[SSR](https://wagmi.sh/react/guides/ssr), current wagmi docs:

1. `createConfig({ ssr: true, storage: createStorage({ storage: cookieStorage }), chains, transports })`.
2. In the App Router server layout, `cookieToInitialState(getConfig(), (await headers()).get('cookie'))`.
3. Pass that value to a client `WagmiProvider` as `initialState`.

Import shown: `import { cookieToInitialState } from 'wagmi'`. The core package export is `import { cookieToInitialState } from '@wagmi/core'` ([cookieToInitialState](https://wagmi.sh/core/api/utilities/cookieToInitialState)). `ssr: true` alone still flashes empty account state until cookies are hydrated. The layout snippet on that page shows both a stale `<Providers>` line and the corrected `<Providers initialState={initialState}>`. Use the `initialState` form.

The page "Last updated" line had no date in the fetch.

### Trust Wallet

Current official Trust docs do not tell you to detect `window.ethereum.isTrust` or `window.trustwallet`. Those flags are absent from the Trust and wagmi pages fetched. UNVERIFIED as a current detection method. Do not use them as the architecture.

Browser extension, [Trust Ethereum and EVM chains](https://developer.trustwallet.com/developer/develop-for-trust/browser-extension/evm):

- Discover providers with EIP-6963 (`eip6963:requestProvider` / `eip6963:announceProvider`).
- Trust is the announcement whose `info.rdns === 'com.trustwallet.app'`.
- Trust then recommends Wagmi because it does "Automatic EIP-6963 discovery" of injected wallets, including Trust Wallet.

Wagmi's [injected connector](https://wagmi.sh/react/api/connectors/injected) is the EIP-1193 connector. It says "EIP-6963 supported via `createConfig`'s `multiInjectedProviderDiscovery` property." A custom `target` can point at one provider. The page does not list a `trustWallet` target id. UNVERIFIED: the default of `multiInjectedProviderDiscovery`.

Mobile and WalletConnect, [Trust Mobile (WalletConnect)](https://developer.trustwallet.com/developer/develop-for-trust/mobile): Trust supports WalletConnect v2. The page says Wagmi is a higher-level way to integrate it and that Wagmi has "built-in Trust Wallet support." It does not show a wagmi connector named `trustWallet`.

Wagmi's current [walletConnect connector](https://wagmi.sh/react/api/connectors/walletConnect) takes `projectId` ("WalletConnect Cloud project identifier") and optional `relayUrl` defaulting to `wss://relay.walletconnect.com`. [Connect Wallet](https://wagmi.sh/react/guides/connect-wallet) combines `injected()`, `walletConnect({ projectId })`, `metaMask()`, and `safe()`, and its chain example includes `base`. The current connector page fetched does not tell you to install Reown AppKit. The archived v2 page at `https://2.x.wagmi.sh/react/api/connectors/walletConnect` mentions `@reown/appkit` only as a transitive dependency of an older `@walletconnect/ethereum-provider`. For a new wagmi 3 app, the documented connector name is `walletConnect`, with a project id from the WalletConnect dashboard. Reown is the organization behind that dashboard and AppKit; it is not a separate connector name in the current wagmi page.

The 0x Next.js guide uses RainbowKit, which "relies on WalletConnect," and a `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`. That guide does not name Trust Wallet. RainbowKit can be the App Router wallet UI; Trust-specific detection still follows Trust's `rdns` rule if the injected provider must be distinguished from MetaMask and others. UNVERIFIED: RainbowKit's default wallet list includes a Trust button.

### viem chain object for Base

`wagmi/chains` "proxies all chains from `viem/chains`" ([Chains](https://wagmi.sh/react/api/chains)). That page, "as of `viem@2.56.9`", lists `` `base` `` as `8453 - ETH`.

The chain object shipped in viem 2.57.13, fetched from `https://unpkg.com/viem@2.57.13/chains/definitions/base.ts`:

```ts
import { base } from 'viem/chains'
// or: import { base } from 'wagmi/chains'

base = defineChain({
  id: 8453,
  name: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://mainnet.base.org'] } },
  blockExplorers: {
    default: { name: 'Basescan', url: 'https://basescan.org', apiUrl: 'https://api.basescan.org/api' },
  },
  sourceId: 1,
  // plus OP-stack chainConfig and the L1 portal, bridge, output oracle,
  // dispute game factory, and multicall3 addresses in that file
})
```

Import the export. Do not retype the object. `basePreconf` in the same file is a different RPC (`https://mainnet-preconf.base.org`) and is not the 0x chain id to send; 0x's chain id for Base mainnet is still `8453`.

## 6. Next.js App Router proxy so the 0x key stays off the browser

Official 0x guidance says the key must not be used from the browser.

[FAQ, CORS Errors](https://docs.0x.org/docs/introduction/faq): "Avoid making API calls directly from the browser to prevent CORS issues and exposing your API keys. Instead, use a backend server, serverless functions, or a full-stack framework." The sample browser error is that `0x-version` is not allowed by `Access-Control-Allow-Headers`. Recommended options named there include a backend proxy, serverless functions, and "Implement backend logic in Next.js or Remix."

[Create a 0x API Key](https://docs.0x.org/docs/introduction/quickstart/getting-started): "This key is unique and tied to your app. Do not share it." Requests send it as `0x-api-key`.

The AllowanceHolder Next.js guide routes price through `app/api/price/route.ts` and quotes through `app/api/quote/route.ts` "to avoid exposing your API key." The browser calls those routes. The server adds the key. The guide does not paste the route source.

Next.js's own [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) page, fetched 2026-10-29:

- A handler is `app/**/route.ts` exporting `GET`, `POST`, and the other HTTP methods. `export async function GET(request: Request) {}` is the documented signature.
- Route Handlers exist only in the `app` directory. They cannot share a segment with `page.js`. `app/api/route.js` beside `app/page.js` is the valid layout.
- They are not cached by default. `GET` can opt into caching with `export const dynamic = 'force-static'`. A quote proxy must not do that. The same page says prerendering stops when a `GET` handler reads the request (`req.url`, headers, cookies) or performs a network fetch, so a handler that reads the swap query and fetches `api.0x.org` stays request-time.
- The page's own caching example reads `process.env.DATA_API_KEY` on the server and never returns that header to the client. That is the same pattern 0x requires for `0x-api-key`.

Put `0x-api-key` and `0x-version` only in the server handler. Do not prefix the 0x key with `NEXT_PUBLIC_`. The WalletConnect project id in the 0x demo is `NEXT_PUBLIC_` because RainbowKit needs it in the browser. That is a different secret.

## 7. Security notes that are actually in the docs

From 0x:

- Do not call the API from the browser with the key. CORS plus key exposure are the stated reasons (FAQ).
- `taker` is required on `/quote`. It is how 0x builds calldata for that address and reports `issues`. The FAQ: pass `taker` "to validate quotes and avoid many revert cases."
- Slippage is your parameter. Default 100 bps if omitted. `0` disables tolerance. Too-low slippage is listed as a revert cause. New code should send `slippagePpm`, because `slippageBps` is marked deprecated. v1 `slippagePercentage` and `estimatedPriceImpact` are not v2 fields. A help-center page, [Slippage, price impact, and prices](https://help.0x.org/articles/3626232596-slippage-price-impact-and-prices-what-integrators-need-to-know), says v2 has no `estimatedPriceImpact` and no `priceImpactProtectionPercentage`.
- Quote freshness: refresh about every 30 seconds so RFQ quotes do not die. Documented window is roughly 60 seconds on mainnet (FAQ). UNVERIFIED as a Base-specific number.
- Approve only `issues.allowance.spender` or `allowanceTarget`. Never approve `transaction.to` when that address is the Settler. The quote reference says using `to` for the allowance "can result in lost funds."
- Do not hardcode Settler or AllowanceHolder addresses. `transaction.to` changes across deployments.
- `liquidityAvailable: false` means stop. Other fields may be absent.
- If `issues.balance` is not null, the upgrade guide says not to proceed from price to quote.
- If `issues.allowance` is not null, set the allowance before expecting a clean quote. The quote can still be returned without the allowance; `issues` reports it.
- Optional `Accept-Signature` to detect a quote altered in transit (quickstart).
- Chain id: every v2 swap request must send `chainId`. The Next.js sample passes that same `chainId` into `sendTransaction`. Trust's extension docs tell the dapp to read `eth_chainId` and to call `wallet_switchEthereumChain` when the wallet is on the wrong network. A single 0x page titled as a chain-id validation checklist was not found. UNVERIFIED: an 0x response field named `chainId` on the v2 AllowanceHolder quote. The v1 sample had top-level `chainId`. The v2 quickstart samples reviewed here do not show it. The app has to pin `8453` on the request and on the wallet transaction itself.
- `txOrigin` is documented only when `taker` is a smart contract.
- `swapFeeBps` above 1000 is rejected unless 0x raises the cap. That is a security limit in the reference, not just a pricing suggestion.
- Gasless submit errors include `INVALID_SIGNATURE`, `INVALID_SIGNER`, `META_TRANSACTION_EXPIRY_TOO_SOON`, and `TRADE_ALREADY_SUBMITTED` ([submit](https://docs.0x.org/api-reference/evm-ap-is/gasless/submit)). Those apply to the gasless path.

From wagmi, the installation page's security section is supply-chain guidance (pin versions, `min-release-age`, Content Security Policy). It is not swap-specific. The SSR guide is the hydration control that stops the server and client from disagreeing about the connected account.

## 8. Sunset status: Swap v1 and Gasless

Swap API v1, including `https://api.0x.org/swap/v1/quote` and chain-specific hosts such as `https://polygon.api.0x.org/swap/v1/quote`, is sunset. End-of-life date in the upgrade overview: 11 April 2025. The deprecated window was 13 December 2024 through 11 April 2025. The knowledge-base article [Upgrading to 0x API v2](https://help.0x.org/articles/9175390481-upgrading-to-0x-api-v2) uses the same sunset date; its table still says "Deprecated (Current Stage)" in one cell while the official docs overview, fetched the same day, says sunset is the current stage and the date has passed. Trust the docs overview and the changelog, not the stale "current stage" cell in the help center. There is no 2026 shutdown of v2 in the pages fetched.

Gasless is not sunset and is not the recommended default path.

- [Upgrading to Gasless API v2](https://docs.0x.org/docs/upgrading/upgrading-to-gasless-v2): v1 gasless is part of the same 11 April 2025 sunset. The v2 path is `/gasless/` instead of `tx-relay/`. Same `0x-api-key` and `0x-version: v2` headers. Same renames: `taker`, `sellToken`, `buyToken`. Chain is `chainId`, not a hostname.
- Live endpoints, from the API reference fetched 2026-10-29:
  - `GET https://api.0x.org/gasless/price` — indicative, not submittable. `sellToken` description: "Native token is not supported."
  - `GET https://api.0x.org/gasless/quote` — firm quote. Returns EIP-712 `trade` and maybe `approval` objects, not a `transaction` to send yourself.
  - `POST https://api.0x.org/gasless/submit` with JSON `chainId`, signed `trade`, and optional signed `approval`.
  - Status: `GET /gasless/status/{tradeHash}` as described in the gasless getting-started guide.
- Base (`8453`) is marked supported for Gasless on the supported-chains page.
- [Understanding Gasless API](https://docs.0x.org/evm/gasless-api/guides/understanding-gasless-api): the user signs; 0x submits and pays gas, recovered from the sell token. "Gasless swaps are now supported for selling all non-native tokens." Native sells are the unsupported case. The page says you can combine Gasless with Swap API and fall back to Swap for native tokens.
- A firm gasless trade can expire (`META_TRANSACTION_EXPIRY_TOO_SOON`) and can be rejected if submitted twice (`TRADE_ALREADY_SUBMITTED`). That is the documented one-time behavior. It belongs to Gasless submit, not to the AllowanceHolder `sendTransaction` flow.
- Changelog 31 July 2026 removed `/gasless-approval-token`. "Approval requirements are returned in the `issues.allowance` and `approval` fields of `/gasless/quote`." Do not call the removed endpoint. 31 August 2026 added `approval.type` of `erc7597Permit`.

For a new Base integrator whose users can pay ETH gas, the documented recommendation remains AllowanceHolder Swap API. Add Gasless only for ERC-20 sells where the user should not need ETH, and keep Swap API as the native-ETH path.

## UNVERIFIED checklist

- Context7 content for these libraries (quota exceeded; no comparison possible).
- `buyTokenPercentageFee` and `affiliateAddress` as 0x parameters (not in the fetched v2 reference or the v1 sample).
- A Swap API rule that quote calldata is single-use. Documented instead: firm quote, reserved maker liquidity, taker-bound RFQ, about 60 seconds on mainnet, refresh about every 30 seconds.
- Base-specific RFQ expiry. The 60-second figure is "on mainnet."
- `maxFeePerGas` / `maxPriorityFeePerGas` on the quote `transaction` object.
- An approval-amount field. Docs show `issues.allowance.actual` and `issues.allowance.spender` only, and examples approve max uint256.
- v2 AllowanceHolder quote response including `chainId`.
- `window.ethereum.isTrust` / `window.trustwallet` as the current Trust detection method.
- A wagmi connector literally named `trustWallet` on the current docs.
- Whether `multiInjectedProviderDiscovery` defaults to true.
- Whether RainbowKit's default list shows Trust.
- A Next.js major version pinned by wagmi.
- Circle's own registry for Base USDC. 0x samples on `chainId=8453` name `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913` as USDC and `0x4200000000000000000000000000000000000006` as WETH.
- The gasless getting-started cURL amount `100000` versus its "100 USDC" comment.

## Sources

- [Upgrading to Swap API v2](https://docs.0x.org/docs/upgrading/upgrading-to-swap-v2) (fetched 2026-10-29)
- [Upgrading overview](https://docs.0x.org/docs/upgrading/overview) (fetched 2026-10-29)
- [Upgrading to Gasless API v2](https://docs.0x.org/docs/upgrading/upgrading-to-gasless-v2) (fetched 2026-10-29)
- [Changelog](https://docs.0x.org/changelog) (fetched 2026-10-29; latest entry 30 September 2026)
- [Get Started with Swap API](https://docs.0x.org/evm/0x-swap-api/guides/swap-tokens-with-0x-swap-api) (fetched 2026-10-29)
- [getQuote (Allowance Holder)](https://docs.0x.org/api-reference/evm-ap-is/swap/allowanceholder-getquote) (fetched 2026-10-29)
- [getPrice (Allowance Holder)](https://docs.0x.org/api-reference/evm-ap-is/swap/allowanceholder-getprice) (fetched 2026-10-29)
- [getQuote (Permit2)](https://docs.0x.org/api-reference/evm-ap-is/swap/permit-2-getquote) (fetched 2026-10-29)
- [getPrice (Permit2)](https://docs.0x.org/api-reference/evm-ap-is/swap/permit-2-getprice) (fetched 2026-10-29)
- [Contracts](https://docs.0x.org/docs/core-concepts/contracts) (fetched 2026-10-29)
- [Set Token Allowances](https://docs.0x.org/evm/0x-swap-api/additional-topics/how-to-set-your-token-allowances) (fetched 2026-10-29)
- [Monetize Your App on EVM](https://docs.0x.org/evm/0x-swap-api/guides/monetize-your-app-using-swap) (fetched 2026-10-29)
- [Multi-Fee Support](https://docs.0x.org/evm/0x-swap-api/additional-topics/multi-fee-support) (fetched 2026-10-29)
- [FAQ](https://docs.0x.org/docs/introduction/faq) (fetched 2026-10-29)
- [API Overview](https://docs.0x.org/api-reference/api-overview) (fetched 2026-10-29)
- [Supported Chains and Providers](https://docs.0x.org/docs/introduction/supported-chains) (fetched 2026-10-29)
- [Handle Native Tokens](https://docs.0x.org/evm/0x-swap-api/additional-topics/handling-native-tokens) (fetched 2026-10-29)
- [Chain-Specific Native Tokens](https://docs.0x.org/evm/0x-swap-api/additional-topics/chain-specific-native-tokens) (fetched 2026-10-29)
- [0x Cheat Sheet](https://docs.0x.org/docs/core-concepts/0x-cheat-sheet) (fetched 2026-10-29)
- [Build a Token Swap App (AllowanceHolder)](https://docs.0x.org/evm/0x-swap-api/guides/build-token-swap-dapp-nextjs) (fetched 2026-10-29)
- [Create a 0x API Key](https://docs.0x.org/docs/introduction/quickstart/getting-started) (fetched 2026-10-29)
- [Troubleshooting Swap API](https://docs.0x.org/evm/0x-swap-api/guides/troubleshooting-swap-api) (fetched 2026-10-29)
- [RFQ System Overview](https://docs.0x.org/evm/0x-swap-api/additional-topics/about-the-rfq-system) (fetched 2026-10-29)
- [Understanding Gasless API](https://docs.0x.org/evm/gasless-api/guides/understanding-gasless-api) (fetched 2026-10-29)
- [Get Started with Gasless API](https://docs.0x.org/evm/gasless-api/guides/get-started-with-gasless-api) (fetched 2026-10-29)
- [Gasless getPrice](https://docs.0x.org/api-reference/evm-ap-is/gasless/getprice) (fetched 2026-10-29)
- [Gasless getQuote](https://docs.0x.org/api-reference/evm-ap-is/gasless/getquote) (fetched 2026-10-29)
- [Gasless submit](https://docs.0x.org/api-reference/evm-ap-is/gasless/submit) (fetched 2026-10-29)
- [Gasless technical appendix](https://docs.0x.org/evm/gasless-api/guides/gasless-api-technical-appendix) (fetched 2026-10-29)
- [Upgrading to 0x API v2 (Knowledge Base)](https://help.0x.org/articles/9175390481-upgrading-to-0x-api-v2) (fetched 2026-10-29)
- [Slippage, price impact, and prices (Knowledge Base)](https://help.0x.org/articles/3626232596-slippage-price-impact-and-prices-what-integrators-need-to-know) (fetched 2026-10-29)
- [wagmi Installation](https://wagmi.sh/react/installation) (fetched 2026-10-29)
- [wagmi Getting Started](https://wagmi.sh/react/getting-started) (fetched 2026-10-29)
- [wagmi SSR](https://wagmi.sh/react/guides/ssr) (fetched 2026-10-29)
- [cookieToInitialState](https://wagmi.sh/react/api/utilities/cookieToInitialState) (fetched 2026-10-29)
- [wagmi injected](https://wagmi.sh/react/api/connectors/injected) (fetched 2026-10-29)
- [wagmi walletConnect](https://wagmi.sh/react/api/connectors/walletConnect) (fetched 2026-10-29)
- [wagmi Connect Wallet](https://wagmi.sh/react/guides/connect-wallet) (fetched 2026-10-29)
- [wagmi useSendTransaction](https://wagmi.sh/react/api/hooks/useSendTransaction) (fetched 2026-10-29)
- [wagmi Chains](https://wagmi.sh/react/api/chains) (fetched 2026-10-29; chain list as of viem 2.56.9)
- [Migrate from v2 to v3](https://wagmi.sh/core/guides/migrate-from-v2-to-v3) (fetched 2026-10-29)
- [wagmi on npm](https://www.npmjs.com/package/wagmi) (fetched 2026-10-29; 3.7.9)
- [viem on npm](https://www.npmjs.com/package/viem) (fetched 2026-10-29; 2.57.13)
- [viem base chain source](https://unpkg.com/viem@2.57.13/chains/definitions/base.ts) (fetched 2026-10-29)
- [Trust Wallet EVM / EIP-6963](https://developer.trustwallet.com/developer/develop-for-trust/browser-extension/evm) (fetched 2026-10-29)
- [Trust Wallet mobile / WalletConnect](https://developer.trustwallet.com/developer/develop-for-trust/mobile) (fetched 2026-10-29)
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) (fetched 2026-10-29)

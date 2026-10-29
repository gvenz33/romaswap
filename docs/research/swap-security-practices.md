# RomaSwap plan constraints

Research date: 2026-10-29 (requester context date 2026-10-28). Planning only. Phase 1 is a mock. No production swap implementation and no contract deployment in that milestone.

Skills checked: no `SKILL.md` under `/workspace/.claude/skills`, `/workspace/.codex/skills`, `/workspace/.agents/skills`, `/home/ubuntu/.claude/skills`, `/home/ubuntu/.codex/skills`, or `/home/ubuntu/.agents/skills`. The only relevant skill is Vercel React best practices at `react-best-practices/SKILL.md`. Wallet-security skills were not present. Context7 MCP was unavailable (monthly quota exceeded); citations below are from official docs and the searches named in the method.

Only items that change sequencing or scope are included.

## Deprecation gate

| Candidate | Status | Plan effect |
| --- | --- | --- |
| 0x Swap API v2 | Current. v1 sunset 2025-04-11. | Use v2 only. Header `0x-version: v2` is required. Do not call `*.api.0x.org/swap/v1`. |
| `@0x/swap-ts-sdk` | Deprecated on npm. 0x says use the API directly. The migration repo treats the package as retired. | Do not depend on it. Later quote phase calls `https://api.0x.org` from the server, or a generated client if types are needed. |
| WalletConnect v2 protocol | Not shut down. Legacy native SDK repos (Swift, Kotlin, C#) were deprecated with end-of-life 2025-02-17. | A web app does not adopt those SDKs. |
| `@walletconnect/modal` | Deprecated. Reown docs say use `@reown/appkit`. | Do not add WalletConnect Modal. |
| Reown AppKit | Not deprecated. Published packages were at 1.8.24 on 2026-09-16; repo activity continued into 2026-10. What retired on 2026-06-30 was legacy Reown **plans**, not the SDK. Wallet-connection-only use can stay on the free WalletConnect dashboard. | Eligible later, when a wallet is actually connected. Not a phase-1 dependency. |
| RainbowKit | No official sunset. Maintainer said on 2026-01-20 it is not abandoned, and on 2026-01-09 that wagmi v3 was not supported yet. A third-party issue (2026-03-13) calls it maintenance mode. | Do not block the mock on RainbowKit. Do not assume it tracks current wagmi. 0x’s own Next.js sample still uses it; that sample is not a deprecation. |

Sources: [Upgrading to 0x API v2](https://docs.0x.org/docs/upgrading/overview.mdx), [npm `@0x/swap-ts-sdk`](https://www.npmjs.com/package/@0x/swap-ts-sdk), [0x swap-ts-sdk migration](https://github.com/0xProject/0x-swap-ts-sdk-migration), [WalletConnect Swift v2 deprecation](https://github.com/WalletConnect/WalletConnectSwiftV2), [Reown WalletConnect deprecations target](https://docs.reown.com/advanced/walletconnect-deprecations), [Dapp usage: modal deprecated](https://docs.reown.com/advanced/api/sign/dapp-usage), [Reown legacy plans, 2026-06-25](https://reown.com/blog/retiring-our-legacy-plans-on-june-30), [RainbowKit discussion #2623](https://github.com/rainbow-me/rainbowkit/discussions/2623), [RainbowKit discussion #2610](https://github.com/rainbow-me/rainbowkit/discussions/2610). The 1.8.24 date is from a third-party repo review ([Hysen Labs AppKit note](https://hysenlabs.com/projects/reown-com-appkit)); treat the exact patch as **Community**, the “not archived / still shipping” conclusion as sufficient to avoid a sunset call.

## A. Where the 0x key lives

**Official docs.** The key lives only in server environment (`ZEROX_API_KEY` or equivalent), read by a Route Handler or other server module. 0x tells integrators not to call the API from the browser: custom headers such as `0x-version` are blocked by CORS, and a browser call exposes the key. Next.js inlines any `NEXT_PUBLIC_` value into the client bundle. OWASP Next.js: prefix `NEXT_PUBLIC_` only for intentionally public values; a Route Handler is a public HTTP endpoint even if only the UI calls it. Mark the module that reads the key with `server-only`.

The browser must be forbidden from sending:

- the raw `0x-api-key` (and must not receive it in any response, error, or log)
- a mutated quote (`transaction.to`, `transaction.data`, `transaction.value`, `transaction.gas`, fee fields, or `zid` rewritten after the server fetched them)
- an arbitrary spender (any approval target other than the spender on that quote)

The browser may send a proposed sell token, buy token, and amount. The server discards client-supplied `chainId`, `swapFeeRecipient`, `swapFeeBps`, `swapFeeToken`, and calldata. Optional later hardening: request `Accept-Signature` and verify the RFC 9421 signature so the quote cannot be altered in transit. Reject signatures whose `created` time is more than 60 seconds from the server clock. That verification is not required to ship the mock.

`transaction.to` is the entry point for the swap. The same field must not be used as an ERC-20 spender. AllowanceHolder on Base (Cancun set) is documented as `0x0000000000001fF3684f28c67538d4D072C22734`. The server still checks the returned `issues.allowance.spender` or `allowanceTarget` against that address before the user is asked to approve. Never approve the Settler.

**Skill.** `server-auth-actions`: a `"use server"` quote action is a public POST. Validate allowlist, chain, and fee inputs inside the action. `server-no-shared-module-state`: do not keep the key, the active taker, or the latest quote in a module-level variable.

Sources: [0x FAQ, CORS](https://docs.0x.org/docs/introduction/faq.mdx), [0x Next.js swap guide](https://docs.0x.org/docs/0x-swap-api/guides/build-token-swap-dapp-nextjs.md), [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables), [Next.js data security](https://nextjs.org/docs/app/guides/data-security), [OWASP Next.js cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nextjs_Security_Cheat_Sheet.html), [0x response signatures](https://docs.0x.org/docs/developer-resources/response-signatures.md), [getQuote `transaction.to`](https://docs.0x.org/api-reference/evm-ap-is/swap/permit-2-getquote.md), [Set token allowances](https://docs.0x.org/evm/0x-swap-api/additional-topics/how-to-set-your-token-allowances), [0x contracts](https://docs.0x.org/docs/core-concepts/contracts.md).

## B. Allowlist enforcement

**Official docs / OWASP.** 0x does not provide an integrator token allowlist. Filtering the picker is display only. The quote route is independently callable, so a caller can request calldata for any sell, buy, or fee token the API will route. That includes tokens the UI hid: honeypots, lookalikes, and fee-on-transfer tokens. OWASP: “Client Component checks only control what the user interface shows,” and protecting a page does not protect the Route Handler.

Enforcement that changes the plan: the server rejects the request unless `sellToken`, `buyToken`, and `swapFeeToken` are all on one server-side allowlist. The fee token must also be one of the two legs (see C). The mock picker and the later server list are the same list. Phase 1 does not need a live check; the list still has to be the source the later route will enforce, or the mock will teach a catalog the server then refuses.

Canonical USDC on Base is `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (6 decimals). Bridged USDbC (`0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA`) is not that token. Native ETH, if the product allows it, is the 0x sentinel `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`, which needs no allowance.

Sources: [OWASP Next.js cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nextjs_Security_Cheat_Sheet.html), [Circle USDC addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses), [Circle native USDC on Base](https://www.circle.com/blog/need-to-know-native-usdc-on-base), [0x FAQ, native sentinel](https://docs.0x.org/docs/introduction/faq.mdx). No 0x allowlist API was found.

## C. USDC-first 25 bps, and Trust Wallet

**Official docs.** `swapFeeToken` must be the `buyToken` or the `sellToken`. If it is omitted, 0x picks, preferring the buy token unless the sell token is a higher-priority stable or more liquid asset, or the buy token is ineligible. 0x’s own guidance when the integrator wants a specific asset such as USDC and the fee did not come in that asset: “you will need to convert those on your own.” `swapFeeBps` is capped at 1000 bps by default. 25 bps (0.25%) is inside that cap; the rate is the product’s number, not a 0x schedule. The fee is paid to `swapFeeRecipient` inside the swap. The quote returns `fees.integratorFee` (and `fees.integratorFees` when there is more than one recipient). 0x’s displayed example calculates `(swapFeeBps/10000) * sellAmount` for a fee taken in the sell token. Do not reuse that formula for a buy-token fee; show the returned `amount` and `token`.

Safe fallback when neither leg is Base USDC:

- Do not send USDC as `swapFeeToken`. That request violates the pair rule.
- Do not add a second swap, a treasury pull, or a wrap step in the user flow to manufacture USDC.
- Server sets `swapFeeToken` to one allowlisted leg and shows that token, the 25 bps, and `fees.integratorFee.amount` before any signature. Prefer setting the token explicitly rather than omitting it, so the disclosure matches the request.
- Converting inventory to USDC later is an operator action on the fee recipient’s own balance. It is outside the user transaction.

What must be disclosed on a real quote: fee rate, fee token contract (not just a ticker), fee amount from `fees.integratorFee`, and that the amount is part of the swap the wallet will sign. Positive slippage is not a RomaSwap fee. `tradeSurplusRecipient` is a custom-plan feature; 0x’s monetize page says that for integrators not on that plan, surplus is collected by 0x, while also saying an unset recipient sends surplus to the taker. Do not set `tradeSurplusRecipient`. Do not promise the user the surplus. The two sentences in that section disagree; treat user-visible surplus as **UNVERIFIED** until 0x support confirms the default for this key.

**Trust Wallet gap.** Trust’s developer docs cover the extension (EIP-1193 / EIP-6963), mobile WalletConnect, the dApp browser, and deeplinks (including a send-payment `address`). They do not document an integrator fee, a referral parameter, or a per-wallet fee recipient. 0x’s Trust case study is Trust using 0x inside Trust’s own product, not an API RomaSwap can call to collect Trust-specific fees. DeFiLlama’s Trust fee adapter tracks Trust’s own collector addresses. Sending fees there would pay Trust, not RomaSwap.

No public 0x or Trust Wallet document states “Trust Wallet fee collection rules” for a third-party aggregator. A different `swapFeeRecipient` when EIP-6963 reports Trust is a **product choice** implemented with the same `swapFeeRecipient` parameter. It is not a Trust Wallet API. Until those rules are supplied, the plan has one server-pinned recipient and one 25 bps rate for every wallet. Do not invent a second rate. Do not collect the Trust case with a deeplink payment; that is a separate user-signed transfer, which is a different product and a custodial-shaped design (see E).

Sources: [Monetize your app](https://docs.0x.org/evm/0x-swap-api/guides/monetize-your-app-using-swap), [getPrice fee parameters](https://docs.0x.org/api-reference/evm-ap-is/swap/permit-2-getprice.md), [Multi-fee support](https://docs.0x.org/evm/0x-swap-api/additional-topics/multi-fee-support.md), [0x multi-fee post, 2026-03-26](https://0x.org/post/multi-fee-support), [Trust: developing for the platform](https://developer.trustwallet.com/developer/develop-for-trust), [Trust deeplinks](https://developer.trustwallet.com/developer/develop-for-trust/deeplinking), [0x / Trust case study](https://0x.org/case-study/trust).

## D. Phase order

Phase 1 mock, derived from the constraints above (there is no 0x “mock swap” spec; the prohibitions are so the screen cannot be mistaken for a live swap):

- Must: persistent label that the screen is a mock and not a live swap; fixture prices only; the same token list the later server will allow; Base shown as a label; fee copy that states 25 bps and that USDC is used only when it is one leg.
- Must not: import wagmi, viem wallet clients, RainbowKit, or AppKit; call `api.0x.org`; read or embed an API key; call `eth_requestAccounts`, `eth_sendTransaction`, `wallet_switchEthereumChain`, `wallet_addEthereumChain`, or `personal_sign`; prompt Base or mainnet; broadcast or ask a wallet to simulate.

Later phases, in this order:

1. Wallet connect, read-only. Chain config is Base only. No quote, no approval, no swap signature.
2. Indicative `/price`, then a firm `/quote` only after an explicit review action. Both go through the server proxy. Firm quotes reserve market-maker liquidity; do not request them on each keystroke. `/price` does not require a taker; `/quote` does. The taker must be the connected address, not an unchecked body field.
3. Signing. User approves only the documented spender, then submits the unmodified `quote.transaction` from their wallet. AllowanceHolder is the default path (one approval signature plus the swap). Permit2 adds a second EIP-712 signature; do not start there.

Prefer AllowanceHolder because 0x recommends it for most integrators, including teams that want one UX across wallets. **Official docs.**

Sources: [0x Next.js guide (price vs firm quote, review then place order)](https://docs.0x.org/docs/0x-swap-api/guides/build-token-swap-dapp-nextjs.md), [0x contracts, AllowanceHolder recommended](https://docs.0x.org/docs/core-concepts/contracts.md), [0x FAQ, Permit2 double signature](https://docs.0x.org/docs/introduction/faq.mdx).

## E. Noncustodial invariants

**Official docs.** The user is the `taker`: they hold the sell token and sign the approval and the swap. If `recipient` is omitted, the buy token defaults to the taker. The affiliate fee is a swap parameter settled to `swapFeeRecipient` by the route. The app does not take custody of the principal or the fee.

Designs that become custodial and are out of scope:

- The server holds a user key, session key, or hot wallet and submits the swap.
- `recipient` is the app, so bought tokens land in the app.
- The fee is a second `transfer` or `transferFrom` into the app, or a Trust deeplink payment, instead of `swapFee*`.
- The app asks for an allowance to its own address or to the Settler.

Gasless submit (0x relayers broadcast a user-signed meta-transaction) is a different product. Leave it out of these phases.

Sources: [Swap and send (`recipient`)](https://docs.0x.org/evm/0x-swap-api/additional-topics/swap-and-send.md), [Monetize your app](https://docs.0x.org/evm/0x-swap-api/guides/monetize-your-app-using-swap), [Set token allowances](https://docs.0x.org/evm/0x-swap-api/additional-topics/how-to-set-your-token-allowances).

## F. Slippage, expiry, spender, chain, review copy

**Official docs.**

- Pin `chainId` to Base `8453` on the server. Ignore any client chain id. 0x lists Base `8453` for Swap and Gasless. When a wallet exists, the wagmi `chains` array is Base only, so the app does not request another network.
- `slippageBps` is 0–10000 and applies to the buy token. Omitted, it defaults to 100 bps (1%). The server chooses the value; the client does not. Show `minBuyAmount` as the floor. A product-specific slippage default other than 100 bps was not in the request; leaving the 0x default until the product picks one is the honest gap. Do not invent a tighter default here.
- RFQ quotes are typically valid about 60 seconds **on mainnet**. 0x’s best practice is to refresh about every 30 seconds. A Base-specific TTL was not stated. Use the 30-second refresh, and fetch a new firm quote if the user pauses before signing. Submitting the previous calldata after a pause is how RFQ expiry reverts.
- Approval spender is only `issues.allowance.spender` or `allowanceTarget`, and only if it matches the documented AllowanceHolder. No allowance for native wrap/unwrap (`allowance` is null).
- Review copy before the wallet opens: sell amount, buy amount, `minBuyAmount`, fee bps, fee token, `fees.integratorFee.amount`, chain name Base, and the spender address. The wallet is the confirmation surface. Pass `to`, `data`, `value`, and gas through from `quote.transaction` with the app’s chain id. For AllowanceHolder, do not rewrite `data`. Permit2 is the exception 0x documents (append the EIP-712 signature); that path is not the default.

Sources: [Supported chains](https://docs.0x.org/docs/introduction/supported-chains.mdx), [Troubleshooting slippage](https://docs.0x.org/evm/0x-swap-api/guides/troubleshooting-swap-api.md), [0x FAQ, RFQ expiry](https://docs.0x.org/docs/introduction/faq.mdx), [getQuote transaction fields](https://docs.0x.org/api-reference/evm-ap-is/swap/permit-2-getquote.md), [0x Next.js guide, `sendTransaction` of `quote.transaction`](https://docs.0x.org/docs/0x-swap-api/guides/build-token-swap-dapp-nextjs.md).

## G. React and Next.js choices that move the plan

**Official docs.** Use the App Router. The 0x boundary is a Route Handler (or a server-only module called from one). Secrets are unprefixed env vars. `NEXT_PUBLIC_` is for public values only; a WalletConnect / Reown project id is public, the 0x key is not.

**Official docs.** Wagmi SSR: set `ssr: true`, persist with `cookieStorage`, and in the server layout pass `cookieToInitialState(config, (await headers()).get('cookie'))` into a client `WagmiProvider`. Without that, the server render and the client wallet store disagree. This work starts in the connect phase, not the mock. `headers()` must be awaited on current Next.js.

**Skill.** `bundle-dynamic-imports`: the wallet UI is a heavy client-only chunk. The mock does not import it. The connect phase loads it with `next/dynamic` and `ssr: false` around the modal only; the provider still follows the wagmi cookie recipe above so the session does not flicker. `rendering-hydration-no-flicker` warns that reading `localStorage` during render breaks SSR. Do not paper over wallet state with that rule’s inline script; use wagmi’s cookie hydration. `server-auth-actions` and `server-no-shared-module-state` apply to the quote action as in A.

Sources: [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables), [Next.js data security](https://nextjs.org/docs/app/guides/data-security), [Wagmi SSR](https://wagmi.sh/react/guides/ssr), [cookieToInitialState](https://wagmi.sh/react/api/utilities/cookieToInitialState), skill files `rules/bundle-dynamic-imports.md`, `rules/rendering-hydration-no-flicker.md`, `rules/server-auth-actions.md`, `rules/server-no-shared-module-state.md` in the Vercel React best-practices skill.

## Unverified or unresolved

- Trust Wallet fee-collection rules for this product: not in any public 0x or Trust document found. Scope stays one recipient and 25 bps until the product supplies the rule.
- Whether an unset `tradeSurplusRecipient` pays the taker or 0x, for a standard key: both appear on the monetize page.
- Exact RFQ lifetime on Base: documented figure is mainnet, about 60 seconds.
- A RomaSwap slippage default other than 0x’s 100 bps default: not specified.
- Context7 was not queried successfully.

## Sources

- [Upgrading to 0x API v2](https://docs.0x.org/docs/upgrading/overview.mdx)
- [Upgrading to Swap API v2](https://docs.0x.org/docs/upgrading/upgrading-to-swap-v2.mdx)
- [0x FAQ](https://docs.0x.org/docs/introduction/faq.mdx)
- [Supported chains](https://docs.0x.org/docs/introduction/supported-chains.mdx)
- [Monetize your app on EVM](https://docs.0x.org/evm/0x-swap-api/guides/monetize-your-app-using-swap)
- [Multi-fee support](https://docs.0x.org/evm/0x-swap-api/additional-topics/multi-fee-support.md)
- [Split swap fees, 2026-03-26](https://0x.org/post/multi-fee-support)
- [getPrice (Permit2)](https://docs.0x.org/api-reference/evm-ap-is/swap/permit-2-getprice.md)
- [getQuote (Permit2)](https://docs.0x.org/api-reference/evm-ap-is/swap/permit-2-getquote.md)
- [Set token allowances](https://docs.0x.org/evm/0x-swap-api/additional-topics/how-to-set-your-token-allowances)
- [Contracts](https://docs.0x.org/docs/core-concepts/contracts.md)
- [Response signatures](https://docs.0x.org/docs/developer-resources/response-signatures.md)
- [Swap and send](https://docs.0x.org/evm/0x-swap-api/additional-topics/swap-and-send.md)
- [Troubleshooting Swap API](https://docs.0x.org/evm/0x-swap-api/guides/troubleshooting-swap-api.md)
- [Build a token swap app (Next.js)](https://docs.0x.org/docs/0x-swap-api/guides/build-token-swap-dapp-nextjs.md)
- [npm `@0x/swap-ts-sdk`](https://www.npmjs.com/package/@0x/swap-ts-sdk)
- [0x swap-ts-sdk migration](https://github.com/0xProject/0x-swap-ts-sdk-migration)
- [Circle USDC contract addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses)
- [Native USDC on Base](https://www.circle.com/blog/need-to-know-native-usdc-on-base)
- [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables)
- [Next.js data security](https://nextjs.org/docs/app/guides/data-security)
- [Wagmi SSR](https://wagmi.sh/react/guides/ssr)
- [OWASP Next.js cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nextjs_Security_Cheat_Sheet.html)
- [Trust developers](https://developer.trustwallet.com/developer/develop-for-trust)
- [Trust deeplinking](https://developer.trustwallet.com/developer/develop-for-trust/deeplinking)
- [Reown: modal deprecated](https://docs.reown.com/advanced/api/sign/dapp-usage)
- [Reown legacy plans, 2026-06-25](https://reown.com/blog/retiring-our-legacy-plans-on-june-30)
- [RainbowKit discussion #2623, 2026-01-20](https://github.com/rainbow-me/rainbowkit/discussions/2623)
- [RainbowKit discussion #2610, 2026-01-09](https://github.com/rainbow-me/rainbowkit/discussions/2610)

# RomaSwap fee collection: USDC first

## Policy
- On completed trades collect RomaSwap's **integrator fee of 25 basis points (0.25%)**, subject to 0x terms and quote eligibility.
- Fee recipient: a **dedicated business-controlled EVM address on Base**, separate from the owner's personal Trust Wallet. Public address must be supplied and independently confirmed by owner; NEVER invent an address.
- Preferred fee token: **native Circle USDC on Base** (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`; verify against Circle before production).
- If either buyToken or sellToken equals Base USDC, request USDC fees. Otherwise fee must be a supported **sell or buy token**, following preapproved token priority (e.g., verified WETH/native ETH where API supports, then vetted cbBTC) or fail closed if neither permitted. Do not attempt to request fee payment in third-party USDC when USDC is not traded.
- Confirm 0x API version and exact supported fields: `swapFeeRecipient`, `swapFeeBps`, `swapFeeToken`; verify `fees.integratorFee` in returned quote. Use current provider documentation and handle any API plan limitations or provider charges.
- Apply identical pricing policy to indicative price and executable quote, and present the actual fee quantity/token, not simply an assumed USD amount.
- Backend must enforce immutable revenue address and fee settings, not trust browser-submitted ones.

## Treasury model
**Wallet A — collection:** New separate Trust Wallet *wallet with a separate seed*, used for receiving integrator fees on Base. Trust Wallet compatibility must be tested on intended mobile/extension clients. Use address only in backend; never expose seed/private key to developers, Cursor, source control or environment variables. Keep small Base ETH for gas when transferring/converting fee tokens.
**Wallet B — treasury:** Prefer hardware-backed or multisig Base-compatible wallet (independent security domain) to hold accumulated USDC. No automatic private-key automation in MVP.

## Reconciliation and conversion
- Daily: reconcile actual successful swap receipts onchain by transaction hash, token, gross amount, integrator fee, receipt status and USD reference at receipt time.
- Non-USDC fees: review daily, consider manual conversion to native Base USDC at roughly $100 equivalent if liquidity/gas acceptable; block conversions above 0.5% estimated price impact unless specially approved.
- Periodically sweep USDC to treasury (e.g. weekly or at $1,000); manual owner approval, log tx hash and accountant-ready records.
- These are suggested thresholds, not automatic rules or live trading authorization.
- Never derive commission solely from quoted swap volume. Fees accrue only when confirmed, and actual fee amounts may be affected by token, rounding, API policy, other provider fees.

## Example nonsecret env keys
`ZEROX_API_KEY` (server secret); `ROMASWAP_CHAIN_ID=8453`; `ROMASWAP_FEE_BPS=25`; `ROMASWAP_TREASURY_ADDRESS=0x...` (public wallet address; set by owner); `ROMASWAP_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`.

## Business reminder
Receiving commission in USDC does not convert it into USD in a bank. Custody, depeg and accounting risks remain. Do not mislead customers that fees are always USDC.

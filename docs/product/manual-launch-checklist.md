# Manual launch checklist

The app implements the engineering surface from the 28 October 2026 roadmap. These items stay outside the repository because they need a person, a vendor account, or a signature. Do not set `SWAP_LIVE=true` and `SWAP_EXECUTION_ENABLED=true` until G1 through G4 are done.

## Accounts and secrets

- [ ] Create a 0x Dashboard app and a Swap API key. Put it in `ZEROX_API_KEY` on the server only.
- [ ] Confirm the live fee parameters in the 0x dashboard: `swapFeeBps=25`, `swapFeeRecipient`, `swapFeeToken` equal to the buy or sell token.
- [ ] Create the fee-collection wallet as a multisig. Put that address in `SWAP_FEE_RECIPIENT`. Dual control for any later change.
- [ ] Create a Reown / WalletConnect Cloud project and set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.
- [ ] MetaMask on desktop is discovered through the injected connector. The MetaMask mobile SDK is not bundled; its React Native storage dependency breaks the Next.js build. Add it only after that dependency resolves.
- [ ] Replace `https://mainnet.base.org` with a production Base RPC and a fallback provider.
- [ ] Set `ADMIN_ACCESS_TOKEN` for the read-only analytics page. Replace this shared token with SSO and MFA before production.
- [ ] Store secrets in the host’s secret manager. Do not commit `.env.local`.

## Product decisions still open

- [ ] Confirm the company name, domain, and brand rights for “RomaSwap”.
- [ ] Counsel decides the target territories. The app does not geofence yet.
- [ ] Keep the allowlist at ETH, WETH, and native USDC until each new contract is reviewed. Bridged USDbC stays blocked.
- [ ] Decide whether the non-USDC fee leg stays the sell token. That is the current rule.
- [ ] Choose the production history indexer. Today, history is a local JSONL file plus the browser for simulated swaps.

## Regulatory gate (G1)

- [ ] Written activity-by-activity memo: FinCEN money transmission / MSB, California DFAL, other states, OFAC, AML/KYC, securities and commodities, consumer disclosures, privacy, and tax.
- [ ] Decide whether to geofence or postpone live swaps for restricted jurisdictions.
- [ ] Publish the privacy notice and the retention schedule the memo approves.
- [ ] Sign the go-live record: date, network, token list, and fee schedule.

## Security and operations (G2–G4)

- [ ] Independent review of a real Base approval and swap, the fee wallet, and production configuration.
- [ ] Fix every critical and high finding and retest.
- [ ] Turn on GitHub branch protection, secret scanning, and dependency review.
- [ ] Add production monitoring for 0x errors, revert spikes, fee-recipient changes, and RPC health.
- [ ] Write the incident roster, support channel, and vendor contacts.
- [ ] Run the pilot behind the kill switch (`SWAP_QUOTES_ENABLED=false` stops new quotes; it cannot unwind a transaction already sent).
- [ ] Reconcile collected fees from onchain receipts. Do not treat quote volume as revenue.

## Infrastructure the MVP still does not include

- [ ] PostgreSQL, if more than one server process must share quotes, history, and audit records.
- [ ] A second RPC endpoint and a documented failover.
- [ ] Load testing and a hosted production deploy.
- [ ] Customer support tooling and status page.

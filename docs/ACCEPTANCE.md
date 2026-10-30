# Acceptance criteria and test matrix

1. Wallet connect/disconnect works on desktop and mobile with MetaMask, Coinbase Wallet, WalletConnect/Trust Wallet where supported; connected wallet only signs its own requests.
2. On chain mismatch, prompt Base switch; never issue Base swap while wallet reports another chain.
3. Token picker displays only allowlisted verified addresses; deceptive tickers and arbitrary pasted contracts are blocked in MVP.
4. Price, quote, fees, min received and slippage show values returned from validated API quote; no silent changes at signing.
5. For ETH→USDC, USDC→ETH and cbBTC↔USDC, RomaSwap `swapFeeToken` is native Base USDC and fee recipient is owner-configured address; verify onchain receipt after successful settlement.
6. For ETH↔cbBTC and non-USDC pairs, fallback token must be one of the traded assets and must meet allowlist policy; otherwise reject.
7. Tampering with fee bps, fee recipient, selected chain or injected swap destination from client is rejected by server.
8. Invalid amounts, insufficient balance, stale quote, unsupported token, missing gas, RPC failure, restricted regions and 0x API downtime fail gracefully.
9. Any ERC-20 allowance is requested only for verified AllowanceHolder spender, never Settler. Validate approval and swap separate transaction statuses.
10. Simulations/estimates show slippage, gas and min received. User wallet approves final transaction; server never sees private keys.
11. Pending/reverted/confirmed statuses are correct after page reload and chain transaction receipts; no duplicate executed swap from repeated clicks.
12. Reconciliation records fees only after confirmed success with correct onchain asset and amount, not estimated volume.
13. Admin analytics are properly authenticated, show aggregate activity, and do not disclose secrets or unnecessary PII.
14. Responsive UI meets accessibility baseline, legible numbers and token names, strong contrast and clear network labels.
15. Unit, integration, end-to-end and independent security review complete; legal launch gate met.

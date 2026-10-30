# Development plan — deliver in gated increments

## Phase 0: Discovery and verification (1–2 weeks)
Confirm existing code, product ownership, naming, design assets, jurisdiction/legal counsel, current 0x API version/terms, Base chain/token contract addresses, supported wallet connectors. Document architecture and unresolved decisions; security threat model. No live trading.

## Phase 1: Scaffold + mock UI (1–2 weeks)
Next.js App Router, TypeScript strict, responsive RomaSwap black/gold UI, token selector with mock token allowlist, swap preview using sample values labeled demo, navigation, Sentry-style integration plan, tests/CI. Acceptance: all screens mock-only; no transaction prompts.

## Phase 2: Wallets + read-only Base data (1–2 weeks)
MetaMask/Coinbase Wallet/WalletConnect Trust Wallet QA, chain switch, balances and explorer history. Acceptance: no wallet seed collection, correct chain/address behavior.

## Phase 3: 0x quotes + approvals + trading integration (2–4 weeks)
Server 0x API, strict validation, AllowanceHolder approved spender, live preview, user signing, tx status, reorg/refetch logic, and tests. Start controlled/internal under legal and security limitations. No public live trading before gate.

## Phase 4: Revenue + admin + controls (1–2 weeks)
Server-locked 25 bps fee, USDC-first fallbacks, receipt reconciliation, protected operational dashboard, allowlist updates and alerting. Pen tests, review business treasury procedures.

## Phase 5: Audit, legal gate and launch (2–4+ weeks)
Independent security review, fix critical findings, terms/privacy/sanctions readiness, written counsel clearance, limited production rollout, monitoring, incident runbook and support.

Timing is indicative and can overlap. Legal approval or security findings may delay launch. Avoid promises or fixed deployment dates without review.

## Cost planning (USD, very approximate)
Technical MVP: ~$17,500–$54,000. Initial legal/regulatory analysis: ~$5,000–$25,000+. Combined with contingency: ~$25,000–$87,000+ depending on provider rates and scope. Excludes unusual licensing, liquidity provision, ongoing infra/marketing and audit expansion. Do not treat figures as vendor bids.

## First developer task
Read everything and propose implementation plan; implement only Phase 1 after owner approval. No production execution shortcuts.

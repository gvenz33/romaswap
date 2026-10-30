# RomaSwap — Persistent instructions for coding agents

RomaSwap is a **noncustodial, Base-only swap aggregator MVP**. Start by reading `docs/PROJECT_OVERVIEW.md`, `docs/ARCHITECTURE.md`, `docs/FEE_AND_TREASURY.md`, `docs/SECURITY.md`, `docs/REGULATORY.md`, `docs/ACCEPTANCE.md`, and `docs/ROADMAP.md` before major changes. Confirm library/API details against current official documentation instead of trusting examples blindly.

Rules:
1. No user private keys, seed phrases, custodial wallets, or server-side user signing. User signs using their wallet.
2. Launch only on Base chain ID 8453. Fail closed if chain, token, contract, fee policy, quote, or slippage is invalid.
3. Use Next.js/TypeScript, wagmi/viem for EVM interactions, and 0x Swap API v2 unless the owner approves a change.
4. Server controls the 0x API key, fee recipient, 25 bps fee, approved tokens, and execution parameters. Reject client overrides.
5. Prefer *native Base USDC* for RomaSwap fee collection when it is the sell or buy token; otherwise collect only an approved fee asset. Never assume 0x can pay a fee in an unrelated third token.
6. An allowance must be given only to the approved spender verified from the 0x API response and documentation. Never approve the Settler as ERC-20 spender.
7. Clearly disclose integrator/provider fees, slippage, minimum received, gas, token and network before wallet signing.
8. Avoid logging sensitive identifiers unnecessarily. Never log secrets, auth tokens, signed raw transactions or seed phrases.
9. No production live trading or real-fee rollout until documented legal/regulatory review, security testing, and explicit owner sign-off.
10. Build in small phases; propose plan, list files to change, implement, run tests, report results and remaining risks.

When project documentation contradicts code or third-party docs, flag the discrepancy; do not silently choose or invent implementation details.

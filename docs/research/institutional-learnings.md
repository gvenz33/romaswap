## Institutional Learnings Search Results

### Search Context

- **Activity:** Plan RomaSwap, a noncustodial Base swap aggregator (Next.js, TypeScript, wagmi, viem, 0x Swap API v2; Phase 1 mock interface; no production trading or contract deployment in first execution).
- **Concepts queried:** noncustodial swap, affiliate fee, USDC-first commission, Trust Wallet, token allowlist, 0x Swap API v2, wagmi, viem, Base.
- **Decision areas:** whether to proxy 0x server-side; how fees are collected; mock-first vs live quotes.
- **Search roots (only):** `/workspace/docs/solutions/` (repo-relative: `<root>/solutions/`).
- **Packs:** none.
- **Step 0 — CONCEPTS.md:** Checked `/workspace/CONCEPTS.md` — **not present**.
- **Solutions directory:** `/workspace/docs/solutions/` — **does not exist** (no files to scan).

Per learnings-researcher method: when the solutions directory is missing, no institutional learnings are available from this repository; search stopped after confirming CONCEPTS.md absence.

### Relevant Learnings

**None.** No documented solutions, patterns, or prior decisions exist under the authorized search root. No pack files were cited.

### Recommendations

- **Proxy 0x server-side:** No repo precedent; decide from 0x API key handling, CORS, rate limits, and commission parameter requirements outside this knowledge base.
- **Fee collection (0.25% USDC-first, Trust Wallet):** No institutional guidance in-repo; plan from 0x affiliate/fee API docs and Trust Wallet integration requirements independently.
- **Mock-first vs live quotes:** No prior mock-phase learnings here; default to product directive (Phase 1 mock) unless external constraints dictate otherwise.

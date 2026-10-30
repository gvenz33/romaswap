# Paste this into Cursor Agent (use Plan mode first)

I am developing **RomaSwap**, a Base-mainnet noncustodial crypto swap aggregator, using this repository. Read `AGENTS.md` and every file under `docs/` first, and treat these as the product requirements. The `assets/` folder contains background references. Inspect the existing codebase before suggesting changes.

FIRST: Produce a technical plan (no code yet) showing the current project state, missing dependencies, architecture, directory structure, token registry, wallet integration, 0x quote/price/allowance workflow, fee recipient/USDC-first selection, transaction lifecycle, security mitigations, test plan, and phased milestones. Identify any specifications needing clarification and any current API documentation that differs from these notes. Favor stable, actively maintained library versions.

THEN, after I approve the plan: Implement milestone 1 only: Next.js/TypeScript application scaffold, Roman black/gold brand styling, responsive swap screen (mock data only), environment validation, logging foundation, and unit tests. No real onchain approvals, no private keys, and no production transaction functionality yet. Show each changed file and tests run.

All work must follow the `.cursor/rules/` requirements. Do not install speculative packages or deploy contracts before approval.

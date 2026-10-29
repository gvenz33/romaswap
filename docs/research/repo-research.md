## Repository Research Summary

Research target: `/workspace` on branch `main`. Scope requested: **patterns** only (implementation patterns, naming conventions, code organization). Technology and infrastructure sections are omitted per contract.

### Probe note

Patterns could not be inferred from application or library code because the working tree contains no tracked files. A root-and-git probe was run: `git log -1`, `git ls-tree -r HEAD`, and workspace listing. Result: single commit `fd475ff` (“Initialize project”) with an empty tree; only `.git/` exists on disk.

### Requested documentation paths

| Path | Status |
|------|--------|
| `AGENTS.md` | **Absent** — not in repository |
| `docs/` | **Absent** — no directory or files |
| `STRATEGY.md` | **Absent** (consistent with planning context) |
| `CONCEPTS.md` | **Absent** (consistent with planning context) |

There are **no official repository guidelines** (no contributor docs, no agent instructions, no architecture decision records in-tree).

### What is absent (implementation-relevant)

| Expected artifact | Present |
|-------------------|---------|
| `package.json` / lockfile | No |
| `src/` or `app/` (Next.js) | No |
| `tests/` or test config | No |
| ESLint / Prettier / Biome config | No |
| CI workflows (`.github/`) | No |
| Environment templates (`.env.example`) | No |
| Any TypeScript, React, or wagmi/viem usage | No |

**Conclusion:** This is a **greenfield** repository. There are **no observed implementation patterns**, naming conventions, or folder layouts to follow or extend.

---

### Implementation Patterns

#### Official guidelines

None found. The repository does not define:

- File or module naming (kebab-case vs PascalCase components, colocation rules)
- Layering (features vs pages vs shared `lib/`)
- State management or data-fetching conventions
- Wallet/Web3 hook organization
- Error handling, logging, or API client patterns
- Testing layout (unit vs integration vs e2e)

Planners should treat all of the above as **decisions to be made**, not constraints from this repo.

#### Observed patterns

**None.** With zero source files and an empty initial commit, there is nothing to cite as established practice. Any future RomaSwap structure (e.g. Next.js App Router under `app/`, wagmi `WagmiProvider` wiring, 0x API client modules, allowlist config) would be **introducing** patterns rather than matching existing ones.

#### Implications for RomaSwap (patterns scope only)

- **No merge conflicts with legacy layout** — folder structure and naming can follow Next.js/wagmi community defaults or team preference without refactoring.
- **No repo-level enforcement** — lint/format/test conventions must be chosen at bootstrap (not inherited).
- **No precedent for** commission routing, Trust Wallet fee rules, or allowlist representation in code; those product rules from planning context are **external directives**, not patterns visible in this tree.
- **Risk if planners assume conventions:** Any assumption that `AGENTS.md`, `docs/`, or existing `src/` patterns exist would be wrong; bootstrap must include explicit project docs if the team wants agent/human alignment later.

#### Evidence

- Commit: `fd475ff` — message “Initialize project”; tree empty at `HEAD`.
- Branch: `main` (`refs/heads/main` → `fd475ff3f937095f92f1e021e3bed6d1018c3369`).
- Workspace listing: `.git/` only; no other files.

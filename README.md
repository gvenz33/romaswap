# RomaSwap

Noncustodial swap interface for Base (chain 8453). The wallet signs every approval and swap. RomaSwap prices through the 0x Swap API v2 AllowanceHolder endpoints and takes a disclosed 0.25% integrator fee.

Live trading is off unless `SWAP_LIVE` and `SWAP_EXECUTION_ENABLED` are both set, and a server-side 0x key and fee recipient exist. Without those, the app serves labeled sample quotes and can simulate a swap without broadcasting.

## Run locally

```bash
npm install
npm run dev
```

The app listens on [http://127.0.0.1:43123](http://127.0.0.1:43123).

```bash
npm test
npm run lint
```

## Environment

Copy `apps/web/.env.example` to `apps/web/.env.local`.

| Variable | Role |
| --- | --- |
| `ZEROX_API_KEY` | Server only. Never prefix it with `NEXT_PUBLIC_`. |
| `SWAP_FEE_RECIPIENT` | Checksummed address that receives the 0.25% fee. |
| `SWAP_LIVE` | `true` calls 0x. Default is sample quotes. |
| `SWAP_EXECUTION_ENABLED` | `true` returns a transaction the wallet can sign. |
| `SWAP_QUOTES_ENABLED` | `false` is the quote kill switch. |
| `ADMIN_ACCESS_TOKEN` | Unlocks the read-only analytics page. |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Reown / WalletConnect Cloud project id. |
| `NEXT_PUBLIC_BASE_RPC_URL` | Base RPC. Defaults to `https://mainnet.base.org`. |

## Layout

- `apps/web` — Next.js interface, wallet connectors, and API routes
- `packages/config` — Base chain id and the ETH / WETH / USDC allowlist
- `packages/swap` — amount math, USDC-first fee rule, quote validation, 0x client
- `packages/telemetry` — local quote and swap event log
- `packages/ui` — black and gold tokens
- `docs/product` — approved roadmap and the manual launch checklist

The fee is 25 bps. If native Base USDC is either token, the fee is taken in that USDC. Otherwise it is taken in the sell token. Bridged USDbC is rejected. An ERC-20 approval is accepted only when the spender and the swap target are the same contract from that quote.

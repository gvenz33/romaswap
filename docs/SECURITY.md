# Security requirements — non-negotiable

- No seed phrases/private keys in code, chat, Cursor, CI, DB, logs, third-party API payloads, or telemetry. The application never signs users' swaps.
- All wallet approvals are user-authorized; follow allowance target returned by 0x API and **never authorize Settler** as an allowance spender. Validate contract address against verified documentation and allowlist.
- Explicit chain ID 8453; prevent wrong-network spending and spoofed token symbols; pin token addresses by chain ID and provenance.
- Input validation with strong schema, token decimals as bigint, safe slippage limits, minimum-received and transaction simulation. Quote request fields and fee policy are server-locked.
- No unlimited approvals by default; support token approval best practices and clear allowance UX.
- Protect 0x credentials and provider secrets server-side; deployment secret manager; no browser bundles with secrets. Rotate credentials.
- Mitigate XSS/CSRF, malicious redirects, dependency and supply chain compromises; CSP and security headers; basic DDoS/rate limits.
- Transaction reliability: onchain status check, duplicate click protection, expiry handling, notification on failed/reverted tx, state recovery after refresh.
- Admin requires real authentication and least privilege. Never use wallet connection alone as admin authorization.
- Data privacy by design: minimize storage of IP, wallet associations and user behavior. Retention policy and access audit.
- Maintain incident response runbook: rollback/disable quoting, revoke compromised API keys, warn users, preserve forensic logs.
- Independent review/audit before handling real users, including front-end allowance and onchain route assumptions. Automated tests alone insufficient.
- No live public trading until security checklist and legal/regulatory signoff completed.

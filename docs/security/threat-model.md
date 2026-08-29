# Security baseline and threat model

This project handles crypto transaction proposals, Telegram identities, optional AI API keys, market data, and untrusted token/social content. Security is a product requirement, not a later hardening pass.

## Security target

Use OWASP ASVS 5.0 Level 2 as the baseline, with selected Level 3 controls for secrets, cryptography and transaction authorization where practical. The project must not claim to be "secure" merely because it passes tests; releases require a documented threat-model review and security checklist.

## Assets

- User wallet private keys / seed phrases: MUST NEVER enter the application.
- Wallet session/authentication state.
- User Telegram identity and chat authorization.
- Optional user AI API keys.
- Transaction payloads before signing.
- Watchlists and portfolio metadata.
- Bot/admin credentials.

## Primary threats

1. Malicious token or program causes a user to sign an unintended transaction.
2. Compromised Telegram account triggers actions as the user.
3. X/CT or market-data content attempts prompt injection against AI analysis.
4. API-key leakage through logs, errors, telemetry, browser storage or source maps.
5. Supply-chain compromise of npm dependencies.
6. SSRF or malicious URLs through token/social metadata.
7. Replay or stale transaction approval.
8. Phishing or fake wallet deep links.
9. Bot callback tampering / unauthorized chat access.
10. Rate-limit abuse and denial of service.

## Non-negotiable wallet rules

- Never accept, generate, import, or store seed phrases or private keys.
- Before connection, require a clear warning to use a dedicated trading wallet, not a main wallet.
- Never auto-sign or auto-submit a transaction.
- Never hide recipient/program IDs, token mint, amount, slippage or fees from the user.
- Rebuild/validate the transaction immediately before signing; do not trust a stale serialized transaction.
- Simulate before signing when supported.
- Bind transaction approval to the intended wallet address and an expiry.
- Reject unexpected programs/accounts and enforce an explicit transaction policy.
- Do not treat an AI recommendation as authorization.

## BYOK AI rules

- API keys are never accepted in Telegram messages.
- Prefer direct browser-to-provider key use where architecture permits; otherwise use a dedicated secrets service.
- Never persist plaintext API keys in databases, logs, analytics, error reports, URLs or client bundles.
- Provide immediate key removal/revocation guidance.
- Strip secrets from exception messages.
- Treat all market/social text as untrusted data. Delimit it from system instructions and never let external content override security policy.

## Telegram rules

- Validate every callback against the authenticated Telegram user/chat.
- Never use a callback payload as authorization by itself.
- Rate-limit commands and external API calls.
- Keep admin commands on a separate authorization path.
- Avoid sensitive data in Telegram messages; assume chat history may be exposed if the user's account is compromised.

## Web/mobile rules

- HTTPS only in production.
- Strict Content Security Policy and secure headers.
- No wallet secrets in localStorage, IndexedDB, URLs or analytics.
- Validate origin and wallet identity during connection/authentication.
- Do not trust client-side amounts or destination addresses; recompute server-side.
- Minimize third-party scripts.
- Never render untrusted token/social text as HTML.

## Supply chain

- Pin production dependency versions and review upgrades.
- Run lockfile integrity checks.
- Enable automated dependency and secret scanning.
- Use GitHub Actions with least-privilege permissions.
- Do not expose repository secrets to untrusted pull requests.
- Build from clean CI environments.

## Logging

Log security-relevant events without secrets: authentication failures, transaction proposal ID, policy decision, simulation result, and final transaction signature where available.

Never log: seed phrases, private keys, API keys, authorization headers, full wallet session tokens, or raw sensitive payloads.

## Release gate

A release that enables transactions must pass:

- typecheck/build
- unit tests for transaction policy and address validation
- dependency audit
- secret scan
- static analysis
- security headers/CSP test
- Telegram authorization tests
- transaction simulation tests
- stale/replay transaction tests
- malicious-token fixture tests
- manual wallet review on mobile
- threat-model review

No transaction capability is enabled until all required checks pass.

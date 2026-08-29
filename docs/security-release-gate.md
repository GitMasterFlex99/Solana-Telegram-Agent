# Security release gate

Real trading must remain disabled until every item below is implemented and independently tested.

## Wallet boundary

- [ ] Wallet Standard / current Solana Kit connection is used.
- [ ] Main-wallet warning is shown before first connection.
- [ ] No seed phrase/private key import exists anywhere in the application.
- [ ] Public keys are treated as untrusted input and validated before use.
- [ ] No wallet secrets are stored in localStorage, Telegram messages, URLs, analytics, or logs.

## Transaction safety

- [ ] Quote is fetched from a pinned/approved Jupiter endpoint.
- [ ] Exact input, output, mint addresses, slippage and fee estimate are shown before signing.
- [ ] Transaction intent expires quickly (60 seconds maximum).
- [ ] Slippage is bounded by policy.
- [ ] Program/instruction allowlist is enforced.
- [ ] Simulation is mandatory and failure blocks signing.
- [ ] The transaction is rebuilt from validated intent immediately before handoff.
- [ ] No arbitrary transaction bytes supplied by AI, social data, Telegram, or a remote user are accepted.
- [ ] The user signs in the wallet; the server never receives a private key.
- [ ] Transaction confirmation is verified against the intended transaction, not merely a client callback.

## Application security

- [ ] Telegram callback data is authenticated to the initiating user/chat.
- [ ] Rate limits exist for Telegram actions and external APIs.
- [ ] All external text is treated as untrusted content and cannot become executable instructions.
- [ ] API keys are never logged or returned in errors.
- [ ] BYOK AI keys are never used for wallet authorization.
- [ ] Dependency lockfile and automated dependency/security scanning are enabled.
- [ ] Production secrets exist only in the deployment secret store.
- [ ] Security headers and HTTPS are enforced on the mobile web app.
- [ ] CSP is restrictive and does not permit arbitrary script sources.

## Operational security

- [ ] Separate development, staging and production credentials.
- [ ] Minimal service-account permissions.
- [ ] Audit logs exclude secrets and unnecessary wallet data.
- [ ] Incident/revocation procedure documented.
- [ ] Backups do not contain wallet secrets.
- [ ] A real-world test is performed with a tiny amount before launch.

**Policy:** if a required control is missing, trading stays disabled. Public scanning and analysis remain available without a wallet.

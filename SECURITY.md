# Security Policy

## Scope

This project is currently a read-only Solana research assistant. Wallet connection and transaction execution remain gated and mainnet trading is disabled.

## Reporting a vulnerability

Do not open a public issue for a suspected security vulnerability.

Report security issues privately to the repository maintainers with:

- A clear description of the vulnerability.
- The affected component or file, if known.
- Reproduction steps or a minimal proof of concept.
- The potential impact.
- Any suggested mitigation.

Do not include seed phrases, private keys, API keys, access tokens, or other secrets in a report.

## Security boundaries

- The application must never request or store seed phrases or private keys.
- AI, social, Telegram, URL, and market-data content is untrusted input.
- Mainnet transaction execution stays disabled until the full release gate is satisfied.
- Transaction signing must occur in the user's wallet after explicit approval.
- Security controls are documented under `docs/security/`.

## Release policy

Security-sensitive changes must preserve the fail-closed behavior documented in the release gate and CI gates. A missing required control blocks transaction execution rather than weakening the gate.

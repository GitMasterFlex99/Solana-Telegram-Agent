# Security Policy

## Scope

This project is intentionally read-only. It does not request seed phrases, private keys, wallet signatures or transaction approval.

## Reporting a vulnerability

Please do not open a public issue for a vulnerability that could expose credentials, user data or bot access.

Use GitHub's private security reporting for the repository when available. Include:

- a clear description of the issue
- affected files or components
- reproduction steps
- potential impact
- a suggested mitigation, if known

Do not include real API keys, bot tokens, private keys or seed phrases in a report.

## Secrets

The following values must never be committed:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID` when used as an access restriction
- `AI_KEY_ENCRYPTION_KEY`
- `X_BEARER_TOKEN`
- user-provided AI API keys
- wallet seed phrases or private keys

User-provided AI keys are encrypted at rest and are not intended to be logged or displayed by the application.

## Safe usage

The bot's market, social and AI outputs are research aids. They are not guarantees of token safety, profitability or authenticity.

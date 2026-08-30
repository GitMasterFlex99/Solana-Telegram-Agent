# Security Policy

## Scope

This project is intentionally read-only. It does not request seed phrases, private keys, wallet signatures or transaction approval.

## Hosting safety boundaries

The application is designed for legitimate market research only. It must not be used to host, distribute, facilitate or conceal:

- cryptocurrency mining software or unauthorized mining workloads
- phishing pages, credential theft or impersonation campaigns
- payment-card fraud, card testing or stolen payment data
- spam, bulk unsolicited messaging or abuse of Telegram/API services
- pirated or unauthorized copyrighted content
- malware, credential stealers or other illegal content/activity

The bot contains no wallet signing, transaction execution, mining, phishing, card-processing or content-distribution functionality. Its market, social and optional AI features are limited to research and analysis.

If a future feature would materially enable one of the prohibited activities above, it should not be added without first redesigning the feature to remove that capability.

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

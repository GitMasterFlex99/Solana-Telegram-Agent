# Solana Telegram Agent

A simple, Telegram-only Solana research assistant.

## Principles

- Free core research features; no artificial paywall.
- Optional AI through the user's own API key.
- Keep the product small and easy to use.
- Never request or store a seed phrase or private key.
- Transaction execution requires explicit user approval and remains disabled until the security release gate passes.

## Current status

Read-only Telegram MVP. The bot scans public Solana market data and provides research/risk information. Trading and wallet signing are not enabled yet.

## Repository layout

- `src/core/` — market, AI, Jupiter, risk, social, and transaction-intent logic.
- `src/security/` — authorization, rate limiting, transaction policy, and security boundaries.
- `tests/` — automated security and transaction-intent tests.
- `docs/` — architecture, integration, roadmap, and security documentation.
- `.github/workflows/` — CI security checks.

There is intentionally no web application in the MVP. A web/mobile wallet interface may be added later as a separate feature.

## Security

The Telegram bot fails closed unless `TELEGRAM_ALLOWED_USER_IDS` contains the user's Telegram ID. `TELEGRAM_CHAT_ID` can further restrict access to one chat. Rate limiting is applied per user/chat pair.

Never put a seed phrase, private key, or wallet credentials in Telegram, `.env`, URLs, logs, or source code.

Mainnet transaction execution is blocked. The security release gate is the authority for enabling it; a missing required control keeps trading disabled.

See `SECURITY.md` and `docs/security/` for the security model and release criteria.

## Run the Telegram bot

1. Create a Telegram bot with BotFather.
2. Copy `.env.example` to `.env`.
3. Set `TELEGRAM_BOT_TOKEN`.
4. Set `TELEGRAM_ALLOWED_USER_IDS` to your Telegram user ID(s).
5. Optionally set `TELEGRAM_CHAT_ID` to restrict the bot to one chat.
6. Run `npm install`.
7. Run `npm start`.

## Quality and security checks

```bash
npm run typecheck
npm test
npm audit --audit-level=high
```

CI runs typechecking, tests, dependency auditing, and secret scanning.

## Roadmap

See `docs/roadmap.md` for the implementation roadmap and `docs/security/release-gate.md` for the mainnet transaction release criteria.

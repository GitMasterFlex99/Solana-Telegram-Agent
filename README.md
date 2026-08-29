# Solana Telegram Agent

A simple, mobile-first Solana research assistant with Telegram as the primary interface.

## Principles

- Free core research features; no artificial paywall.
- Optional AI through the user's own API key.
- Use an existing mainstream Solana wallet rather than forcing users into a separate wallet.
- Wallet keys stay with the wallet; the bot never asks for a seed phrase/private key.
- Mobile-first UI for analysis and future transaction approval.
- Keep the product small: scan, analyze, watch, wallet, settings.

## Current status

Read-only MVP. Telegram scans public Solana market data. The mobile web shell contains the wallet UX and security scaffolding, but transaction execution remains disabled until the devnet, simulation, authorization, and security release gates pass.

## Repository layout

- `src/core/` — market, AI, Jupiter, risk, social, and transaction-intent logic.
- `src/security/` — authorization, rate limiting, transaction policy, and other security boundaries.
- `src/web/` — web-facing integration code.
- `web/` — mobile-first Vite application.
- `tests/` — automated security and transaction-intent tests.
- `docs/` — architecture, integration, testing, roadmap, and security documentation.
- `.github/workflows/` — CI security checks.

## Security

The Telegram bot fails closed unless `TELEGRAM_ALLOWED_USER_IDS` contains the user's Telegram ID. `TELEGRAM_CHAT_ID` can further restrict access to one chat. Rate limiting is applied per user/chat pair.

Never put a seed phrase or private key in Telegram, `.env`, browser storage, URLs, logs, or source code.

Mainnet transaction execution is currently blocked. The security release gate is the authority for enabling it; a missing required control keeps trading disabled.

See `SECURITY.md` for vulnerability reporting and `docs/security/` for the technical security controls and release gates.

## Run the Telegram bot

1. Create a Telegram bot with BotFather.
2. Copy `.env.example` to `.env`.
3. Set `TELEGRAM_BOT_TOKEN`.
4. Set `TELEGRAM_ALLOWED_USER_IDS` to your Telegram user ID(s).
5. Optionally set `TELEGRAM_CHAT_ID` to restrict the bot to one chat.
6. Run `npm install`.
7. Run `npm start`.

## Run the mobile web shell

The web UI is in `web/` and is designed for a phone first.

```bash
npm run web:build
```

The wallet button is intentionally non-functional until the real Wallet Standard integration has passed the devnet and security gates. The UI must never imply that a wallet is connected when it is not.

## Quality and security checks

```bash
npm run typecheck
npm run web:build
npm test
npm audit --audit-level=high
```

CI runs the typecheck, production web build, tests, high-severity dependency audit, and secret scanning. Because the repository does not yet commit a lockfile, CI currently resolves the dependency tree into a temporary lockfile before running `npm ci`. A committed lockfile should be added before production release for fully reproducible installs.

## Roadmap

See `docs/roadmap.md` for the current implementation roadmap and `docs/security/release-gate.md` for the mainnet transaction release criteria.

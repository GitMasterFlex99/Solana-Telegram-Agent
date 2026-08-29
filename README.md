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

Read-only MVP. Telegram scans public Solana market data. The mobile web shell contains the wallet UX, but real wallet connection, trading and signing remain disabled until the security and devnet gates pass.

## Security

The Telegram bot fails closed unless `TELEGRAM_ALLOWED_USER_IDS` contains the user's Telegram ID. `TELEGRAM_CHAT_ID` can further restrict access to one chat. Rate limiting is applied per user/chat pair.

Never put a seed phrase or private key in Telegram, `.env`, browser storage, URLs, logs or source code.

## Run the Telegram bot

1. Create a Telegram bot with BotFather.
2. Copy `.env.example` to `.env`.
3. Set `TELEGRAM_BOT_TOKEN`.
4. Set `TELEGRAM_ALLOWED_USER_IDS` to your Telegram user ID(s).
5. Optionally set `TELEGRAM_CHAT_ID` to restrict the bot to one chat.
6. Run `npm install`.
7. Run `npm start`.

## Run the mobile web shell

The web UI is in `web/` and is designed for a phone first. Build it with Vite from the repository root:

```bash
npx vite build --config web/vite.config.ts
```

The wallet button is intentionally non-functional until the real Wallet Standard integration has passed the devnet and security gates. The UI must never imply that a wallet is connected when it is not.

## Security CI

The security workflow resolves the pinned direct dependencies into a temporary lockfile, installs that exact resolved tree with `npm ci`, then runs TypeScript checks, tests, a high-severity dependency audit and secret scanning.

A committed lockfile should be added before production release so dependency resolution is reproducible across machines and CI runs.

## Roadmap

1. Better token discovery and risk filters.
2. Useful social/CT signals.
3. Real mobile wallet connection using Wallet Standard/mobile wallet flows.
4. Optional BYOK AI analysis.
5. Jupiter quote + transaction preparation.
6. Simulation and explicit wallet approval.

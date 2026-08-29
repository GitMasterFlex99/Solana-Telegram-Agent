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

Read-only MVP. Telegram scans public Solana market data. A mobile web shell provides the intended wallet/token UX. Trading and signing are not enabled yet.

## Run the Telegram bot

1. Create a Telegram bot with BotFather.
2. Copy `.env.example` to `.env` and set `TELEGRAM_BOT_TOKEN`.
3. Optionally set `TELEGRAM_CHAT_ID` to restrict access.
4. `npm install`
5. `npm start`

## Run the mobile web shell

The web UI is in `web/` and is designed for a phone first. Build it with Vite from the repository root.

```bash
npx vite build --config web/vite.config.ts
```

The current wallet button is a UI placeholder. Real Wallet Standard/mobile-wallet integration will be added before any transaction flow is enabled.

## Roadmap

1. Better token discovery and risk filters.
2. Useful social/CT signals.
3. Real mobile wallet connection using Wallet Standard/mobile wallet flows.
4. Optional BYOK AI analysis.
5. Jupiter quote + transaction preparation.
6. Simulation and explicit wallet approval.

Never put a seed phrase or private key in Telegram or environment variables.

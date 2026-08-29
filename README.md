# Solana Telegram Agent

A deliberately simple Telegram interface for a small Solana meme-coin research experiment.

## Current status

The bot is read-only. It scans public Solana market data through DexScreener and ranks candidates using simple liquidity, volume, activity, age and valuation checks.

Trading/signing is intentionally disabled. No seed phrase or private key is ever required by the bot.

## Run locally

```bash
npm install
cp .env.example .env
npm start
```

Set `TELEGRAM_BOT_TOKEN` in `.env`. `TELEGRAM_CHAT_ID` is optional but recommended for a private bot.

## Bot interface

- `/start` — main menu
- `/scan` — scan current candidates
- `/portfolio` — portfolio placeholder
- `/help` — safety/help

The interface is intentionally button-first and minimal rather than trying to replicate a full-featured trading terminal.

## Roadmap

1. Stronger token safety checks.
2. Token detail analysis.
3. Jupiter quotes and transaction simulation.
4. Explicit wallet approval/signing.
5. Portfolio and trade history.
6. Optional alerts.

Never put a seed phrase or private key in source code, `.env`, Telegram, or chat.

# Solana Telegram Agent

A deliberately simple, read-only Telegram bot for researching Solana meme-coin markets.

The project is built around one workflow:

**Scan → investigate → optionally use AI → watch**

It is intentionally not a trading terminal. Wallet connection, signing and automated trading are disabled.

## What it does

### Market scanning

`/scan` pulls public Solana market data through DexScreener, filters weak candidates and ranks the remaining tokens using:

- liquidity
- 24h volume
- buy/sell activity
- price movement
- pair age
- FDV/liquidity relationship
- basic risk flags

The research score is designed to favor market structure rather than raw hype. Very new or structurally risky pairs are penalized.

### X/social signals

X signals are optional. If `X_BEARER_TOKEN` is configured, the bot checks recent public posts and looks for:

- independent accounts mentioning the token
- early mentions
- evidence-style language such as docs, GitHub, contracts, audits or announcements

Social evidence can improve discovery, but it contributes only a small part of the final research score. The bot does not treat Twitter/X attention as proof that a token is good.

Without an X token, the rest of the bot works normally.

### Token analysis

Each candidate can be opened for a deeper view containing:

- research score
- underlying market score
- liquidity and volume
- price change
- pair age
- risk flags
- social signal
- optional AI analysis

### Optional user-provided AI

AI is deliberately optional. Users can connect their own OpenAI API key from the private-chat Settings menu.

The key is:

- encrypted at rest
- never shown back to the user
- deleted from the Telegram chat after processing
- accepted only during a short five-minute setup window
- removable from Settings

The default model is `gpt-5.6-luna`, with `AI_MODEL` available for overriding it. AI is used for evidence-based bull case, bear case, uncertainty and invalidation analysis rather than price predictions.

### Watchlist and alerts

Use:

```text
/watch <solana-token-address>
/unwatch <solana-token-address>
```

Watched tokens are checked approximately every five minutes. Alerts trigger only when meaningful thresholds are crossed, with hysteresis to avoid repeated notifications when a value jitters around a boundary.

The monitor does not automatically remove tokens when market data temporarily disappears.

## Safety boundaries

- Read-only by design.
- No seed phrase is required.
- No private key is required.
- No wallet signing.
- No automated trading.
- AI output is analysis of supplied evidence, not financial advice.
- X/social data is supporting evidence, not a trading signal.

Never put a seed phrase, private key or API key in source code, commits or `.env` files that are uploaded to GitHub.

## Run locally

```bash
npm install
cp .env.example .env
npm start
```

Set at least:

```text
TELEGRAM_BOT_TOKEN=...
AI_KEY_ENCRYPTION_KEY=...
```

`TELEGRAM_CHAT_ID` is optional but recommended when running a private bot. It restricts access to the configured Telegram chat.

Optional:

```text
AI_MODEL=gpt-5.6-luna
AI_KEY_STORE_PATH=./data/ai-keys.json
X_BEARER_TOKEN=...
```

`AI_KEY_ENCRYPTION_KEY` is required for user-provided AI keys to work. Keep it outside the repository and use a strong random value.

## Bot commands

- `/start` — open the main menu
- `/scan` — find current candidates
- `/watch <address>` — add a token to the watchlist
- `/unwatch <address>` — remove a token
- `/settings` — configure optional AI and X signals
- `/portfolio` — currently a read-only placeholder
- `/help` — show safety/help information

The interface is intentionally button-first and minimal rather than trying to replicate a full-featured trading terminal.

## Development

Run the checks locally:

```bash
npm run typecheck
npm test
```

CI runs the same typecheck and test commands.

## Current roadmap

1. Continue improving research/safety scoring with real-world testing.
2. Improve token detail analysis and evidence presentation.
3. Add more useful alert conditions without increasing alert noise.
4. Add richer historical research if the data source supports it reliably.
5. Consider transaction simulation only after the research workflow is solid.
6. Keep wallet signing/trading as a separate, explicit future layer rather than mixing it into the research MVP.

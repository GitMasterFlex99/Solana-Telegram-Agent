# Solana Telegram Agent

A deliberately simple, read-only Telegram bot for researching Solana meme-coin markets.

**Workflow:** Scan → investigate → optionally use AI → watch.

The project is intentionally not a trading terminal. Wallet connection, signing and automated trading are disabled.

## What it does

### Market research

`/scan` uses public Solana market data to filter and rank candidates using liquidity, 24h volume, buy/sell activity, price movement, pair age, FDV/liquidity relationship and structural risk flags.

The research score favors market structure over raw hype. The strongest market pair is used when a token is investigated.

### Social research

X signals are optional. With `X_BEARER_TOKEN`, recent public posts are evaluated for independent accounts, early mentions, evidence-backed language, credible accounts, promotional language and repeated/copied posts.

Social evidence is deliberately supporting evidence only and contributes a small part of the final research score. Without X access, the rest of the bot continues to work.

### Token investigation

A candidate can be opened for research showing its score, market metrics, age, risk flags and social signal. AI analysis is available only when the user has connected their own key.

### Optional user-provided AI

Users can connect their own OpenAI API key from the private-chat Settings flow. The key is encrypted at rest, never displayed back, and the Telegram message containing it is deleted after processing. Setup expires after five minutes and keys can be removed from Settings.

AI is used for evidence-based bull/bear analysis, uncertainty and invalidation conditions. It is not used to promise price targets or guarantee outcomes.

### Watchlist and alerts

Use `/watch <solana-token-address>` and `/unwatch <solana-token-address>`. Watched tokens are checked approximately every five minutes.

Alerts use threshold hysteresis and monitor meaningful changes in research score, momentum, price, volume and liquidity. The monitor has bounded API retries, timeouts, concurrency limits and protection against overlapping cycles.

Watchlists and alert state persist across restarts using validated JSON state with atomic writes.

## Reliability and safety

- Read-only by design.
- No seed phrase, private key or wallet signing is required.
- No automated trading.
- Market requests have timeouts and bounded retries for transient failures.
- Individual token failures do not stop the alert monitor.
- Persistent state is validated before use and written atomically.
- Production configuration is validated during startup.
- Optional AI and X integrations fail independently of the core research workflow.

Never put secrets, seed phrases or private keys in source code or commits.

## Configuration

Required:

```text
TELEGRAM_BOT_TOKEN=...
AI_KEY_ENCRYPTION_KEY=...
```

`AI_KEY_ENCRYPTION_KEY` must be a base64-encoded 32-byte key when user-provided AI keys are enabled.

Optional:

```text
TELEGRAM_CHAT_ID=...
AI_MODEL=gpt-5.6-luna
AI_KEY_STORE_PATH=./data/ai-keys.json
X_BEARER_TOKEN=...
```

`TELEGRAM_CHAT_ID` restricts the bot to the configured chat when supplied.

Keep encryption keys and API tokens outside the repository and configure them through the deployment environment.

## Run locally

```bash
npm install
cp .env.example .env
npm run typecheck
npm test
npm start
```

## Bot commands

- `/start` — open the main menu
- `/scan` — find current candidates
- `/watch <address>` — add a token to the watchlist
- `/unwatch <address>` — remove a token
- `/settings` — configure optional AI and X signals
- `/portfolio` — read-only placeholder; wallet trading is disabled
- `/help` — show safety/help information

The interface stays intentionally small. Most of the complexity lives behind the scenes in the research, scoring, social-analysis and alert systems.

## Development

```bash
npm run typecheck
npm test
```

CI runs the same checks on changes.

## Architecture

```text
Telegram
   │
   ▼
Bot handlers ────────────────┐
   │                         │
   ▼                         ▼
Market discovery          User state
   │                    watchlists/alerts
   ▼                         │
Scoring ◄── X signals        │
   │                         │
   └──────────┬──────────────┘
              ▼
        Token investigation
              │
        optional user AI
              │
              ▼
          Telegram alert
```

The core research path does not depend on AI or X. This keeps the bot useful for users who do not want to pay for additional APIs.

## Project status

The research MVP is read-only and production-oriented. The current focus is reliability, research quality and low-noise alerts rather than adding trading features or a large UI.

Future work should be evaluated against that constraint: improvements should make the existing workflow smarter, safer or more reliable before adding new surface area.

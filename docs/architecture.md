# Product architecture

## Principles

1. Telegram first: keep the initial product small and easy to use.
2. Read-only first: scanning and analysis ship before wallet connection or trading.
3. Existing-wallet first later: never require a new custodial wallet.
4. Free core: scanning and basic analysis do not require AI or payment.
5. AI is optional BYOK and never controls funds.
6. No seed phrases or private keys are accepted by the bot.
7. Prefer a small number of clear actions over feature-heavy trading UI.

## Product surface

Telegram: Scan, Analyze, Watchlist, Portfolio placeholder, Settings, Help.

There is intentionally no web application in the current MVP. A richer web/mobile wallet interface can be added later without changing the Telegram security boundary.

Wallet: future integration uses the user's existing mainstream Solana wallet; the application never takes custody.

## Current read-only flow

Telegram -> Scan -> unified market/Pump.fun candidates -> momentum/opportunity ranking -> optional X intelligence -> on-chain safety analysis -> safety gate -> informational result.

Watchlist flow: Scan -> Watch -> persistent watchlist -> periodic rescan -> meaningful signal-change alert.

No transaction execution, wallet signing, or autonomous trading is enabled.

## Future trading flow

Token -> Analyze -> Buy/Sell -> show exact quote, slippage and estimated fees -> simulate -> open user's wallet -> user reviews and signs -> return transaction status.

## AI flow

Core market/risk engine produces structured facts first. Optional user-provided AI key can turn those facts into a short explanation. AI cannot directly sign or submit transactions.

## Security checklist

- Never log API keys, wallet secrets, or transaction secrets.
- Never store seed phrases/private keys.
- Validate token addresses and transaction destinations server-side.
- Treat market, social, AI, and Pump.fun feed content as untrusted input.
- Use timeouts and bounded results for external API calls.
- Rate-limit Telegram actions.
- Persist local state with restrictive permissions and atomic writes.
- Treat social/AI output as untrusted analysis, never as authorization.
- Keep transaction execution behind the release gate.
- Keep admin controls separate from user controls.

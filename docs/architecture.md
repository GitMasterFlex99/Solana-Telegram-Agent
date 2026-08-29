# Product architecture

## Principles

1. Mobile first.
2. Existing-wallet first: never require a new custodial wallet.
3. Free core: scanning and basic analysis do not require AI or payment.
4. AI is optional BYOK and never controls funds.
5. Every real transaction is explicitly reviewed and signed by the user's wallet.
6. No seed phrases or private keys are accepted by the bot.
7. Prefer a small number of clear actions over feature-heavy trading UI.

## Product surface

Telegram: Scan, Analyze, Watch, Portfolio, Settings.

Mobile web: richer analysis and wallet connection/signing handoff.

Wallet: the user's existing mainstream Solana wallet; the application never takes custody.

## Trading flow

Token -> Analyze -> Buy/Sell -> show exact quote, slippage and estimated fees -> simulate -> open user's wallet -> user reviews and signs -> return transaction status.

No autonomous trading in the initial release.

## AI flow

Core market/risk engine produces structured facts first. Optional user-provided AI key can turn those facts into a short explanation. AI cannot directly sign or submit transactions.

## Security checklist

- Never log API keys, wallet addresses beyond intended telemetry, or transaction secrets.
- Never store seed phrases/private keys.
- Validate all token addresses and transaction destinations server-side.
- Use allowlisted RPC/Jupiter endpoints.
- Simulate transactions before presenting them for signing.
- Display exact spend, expected output, slippage and fees before signing.
- Treat social/AI output as untrusted analysis, never as authorization.
- Rate-limit Telegram callbacks and external API calls.
- Keep admin controls separate from user controls.

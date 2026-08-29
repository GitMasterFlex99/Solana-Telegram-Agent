# Jupiter integration

Jupiter is used only as a quote/route source. A quote is not authorization to trade.

## Required flow

1. User chooses token and amount.
2. Validate mint addresses and integer base-unit amount.
3. Request a fresh quote from the current official Jupiter API.
4. Reject quotes outside the application's slippage policy.
5. Build a transaction only from the validated user intent and validated quote.
6. Decode/inspect the transaction locally before signing.
7. Allow only expected programs/accounts and expected input/output mints.
8. Simulate the transaction.
9. If simulation fails, stop.
10. Display spend, expected output, minimum output, slippage, fees and expiry.
11. Hand the transaction to the user's connected wallet for review/signing.
12. Never sign or submit using a server-side private key.
13. Verify the resulting signature and transaction status after signing.

## Security rules

- Do not accept serialized transactions from Telegram messages, AI output, social posts or arbitrary URLs.
- Never let an AI model construct transaction bytes.
- Never silently increase amount or slippage.
- Do not cache quotes for later execution.
- Treat a quote as stale after a short TTL and require a fresh quote.
- Keep trading disabled until transaction simulation and wallet review are implemented and tested.

Reference: use the current official Jupiter developer documentation for exact endpoints and transaction-building details. This repository intentionally does not hard-code a swap endpoint until that contract has been verified against the current official documentation.

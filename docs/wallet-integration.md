# Mobile wallet integration contract

This document defines the implementation boundary for wallet connection. It is intentionally implementation-light until the frontend is wired to the current Solana Kit/Wallet Standard APIs.

## Requirements

- Use `@solana/kit` and the current Wallet Standard integration for new frontend work.
- Discover compatible wallets instead of maintaining a hard-coded adapter list.
- Prefer mobile wallet handoff/deep-link behavior supplied by the wallet/provider.
- Never request a seed phrase, private key, or exported secret.
- Before first connection, require acknowledgement that a dedicated trading wallet should be used.
- Store only the public wallet address needed for portfolio/transaction context.
- Do not place wallet secrets in Telegram, localStorage, URL query parameters, analytics, or logs.
- Disconnect must clear application-side wallet state.

## Transaction boundary

The mobile client may request a transaction prepared by the server, but it must treat returned transaction data as untrusted until it passes local policy checks.

Before the wallet is opened, display:

- input token and amount
- output token
- minimum expected output
- slippage
- estimated network/priority fees
- destination/program context where available
- quote expiry

Then:

1. Validate the intended trade against the quote.
2. Validate allowed programs/accounts and spending limits.
3. Simulate the transaction.
4. Refuse to open the wallet if validation or simulation fails.
5. Open the wallet for user review/signing.
6. Verify the resulting signature/transaction against the intended operation.

## Mobile UX

The primary action is `Connect trading wallet`. Do not present a wallet address field as the primary connection mechanism.

Keep the wallet screen to:

- connected wallet name/address (shortened)
- SOL balance
- `Disconnect`
- `Trade`

Avoid exposing RPC configuration, transaction serialization, private signing details, or developer diagnostics to ordinary users.

# Mobile Wallet Integration

This document defines the wallet boundary for the mobile web client.

## Stack

Use Solana Kit and `@solana/kit-plugin-wallet` with Wallet Standard discovery. Do not add wallet-specific adapter packages unless a compatibility gap is demonstrated.

## Connection rules

1. Show the separate-trading-wallet warning before connection.
2. Connect only through the wallet provider's standard interface.
3. Store only the public address required for portfolio and transaction display.
4. Never request or persist a recovery phrase, seed, private key, or raw signing capability.
5. Do not put wallet credentials in Telegram messages, URLs, query strings, localStorage, sessionStorage, analytics, or logs.
6. Verify the requested cluster is the intended cluster before any signing operation.
7. On mobile, allow the wallet to remain the signing authority; the application only requests a signature.

## Transaction boundary

The web client receives a validated trade intent and a transaction produced by the trusted transaction service. Before asking the wallet to sign, the UI must display:

- input token and exact amount
- output token and expected minimum output
- slippage
- network fee estimate
- destination/program information where practical
- quote timestamp/expiry

The client must reject a transaction if it does not match the approved trade intent. Simulation must succeed before signing.

## Mainnet policy

The integration may be developed against devnet first. Mainnet signing remains disabled until automated tests and manual security review pass the release gate.

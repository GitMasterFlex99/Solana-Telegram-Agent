# Mobile wallet integration

## Target stack

Use Solana Kit and Wallet Standard discovery for new wallet work. Do not add legacy wallet-adapter packages.

## Connection flow

1. User opens the mobile web app.
2. Before connection, show the dedicated trading-wallet warning.
3. User acknowledges the warning.
4. Discover Wallet Standard wallets exposed by the environment.
5. Display the wallet name and official icon supplied by the wallet standard.
6. Request only the minimum public-account capability required.
7. Store only the public address in application state.
8. Never put wallet authorization material, session secrets, seed phrases, or private keys in localStorage, URLs, Telegram messages, analytics, or logs.
9. On disconnect, clear wallet-derived application state.

## Transaction flow

1. Build a server-side trade intent from validated user input.
2. Fetch a fresh Jupiter quote.
3. Validate the quote against the intent.
4. Construct the transaction using the current official Jupiter interface.
5. Decode/inspect the resulting transaction locally before signing.
6. Require simulation success.
7. Show mint, direction, exact input, minimum output, slippage, network, fee estimate and destination/program information.
8. Ask the wallet to sign only after explicit user confirmation.
9. Never auto-sign or silently submit.
10. Verify the resulting signature and intended post-trade state.

## Mobile behavior

Prefer the wallet's standard mobile connection/deep-link mechanism when available. The app must remain usable without a wallet connection for scanning and analysis.

## Security boundary

The browser/mobile app is untrusted input. The backend must revalidate trade intent and policy. AI/social content is untrusted data and cannot modify transaction instructions or authorization state.

## Devnet gate

The first live wallet transaction path must target devnet only. Mainnet transaction release stays disabled until automated tests, manual wallet tests, simulation checks and security review pass.

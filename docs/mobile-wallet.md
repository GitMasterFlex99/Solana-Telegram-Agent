# Mobile wallet integration

This document is the single source of truth for the mobile wallet design and implementation direction.

## Target stack

Use the current Solana Kit stack:

- `@solana/kit`
- `@solana/react`
- `@solana/kit-plugin-wallet`
- Wallet Standard discovery

Do not add legacy wallet-adapter packages or maintain custom adapters for individual wallets when Wallet Standard provides the required integration.

## User safety

Before connection, show a dedicated trading-wallet warning:

> Use a separate trading wallet.
>
> Do not connect your main wallet. Create a dedicated wallet in Phantom, Solflare, Backpack, or another compatible wallet and fund it only with what you are comfortable losing.
>
> We never need your recovery phrase or private key.

The user must acknowledge the warning before the connect action becomes available.

## Mobile connection flow

1. User opens the mobile web app, including from Telegram.
2. Show the separate-wallet warning before connection.
3. Discover compatible Wallet Standard wallets exposed by the environment.
4. Display the wallet name and official icon supplied by the wallet standard.
5. Request only the minimum public-account/signing capability required.
6. Store only the public address in application state.
7. Display the shortened public address and selected cluster clearly.
8. Prefer the wallet's official mobile handoff/deep-link mechanism when the wallet is not embedded in the browser.
9. On disconnect, clear wallet-derived application state.

The app must remain usable without a wallet connection for scanning and analysis.

## Transaction flow

1. Build a server-side trade intent from validated user input.
2. Fetch a fresh Jupiter quote from an approved endpoint.
3. Validate the quote against the original intent.
4. Construct the transaction using the current approved Jupiter/Kit interface.
5. Decode and inspect the resulting transaction locally before signing.
6. Require simulation success immediately before signing.
7. Show mint, direction, exact input, minimum output, slippage, network, fee estimate, and important destination/program information.
8. Ask the wallet to sign only after explicit user confirmation.
9. Never auto-sign or silently submit.
10. Verify the resulting signature and intended post-trade state.

## Network and security requirements

- The active cluster must be shown before any signing request.
- Never silently switch clusters.
- The first live wallet transaction path must target devnet only.
- Mainnet transaction release stays disabled until the security release gate passes.
- Wallet discovery is not wallet trust; validate the network, public key, transaction contents, program/account policy, and current server-side intent before signing.
- The frontend is an untrusted input boundary. The backend must revalidate trade intent and policy.
- AI, social content, Telegram callbacks, URL parameters, and arbitrary remote input cannot supply transaction bytes or authorize a transaction.
- Never put wallet authorization material, session secrets, seed phrases, or private keys in localStorage, URLs, Telegram messages, analytics, crash reports, or logs.
- Never imitate a wallet login page or request wallet credentials directly.
- Handle cancellation, wallet-not-installed, disconnect, and stale-session states without exposing internal errors.

## Implementation source of truth

Use the official Solana, Wallet Standard, and Solana Kit references listed in `docs/official-solana-references.md` when changing the integration.

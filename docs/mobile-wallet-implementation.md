# Mobile wallet implementation

## Stack

Use the current Solana Kit stack:

- `@solana/kit`
- `@solana/react`
- `@solana/kit-plugin-wallet`

Solana's official frontend template demonstrates Wallet Standard discovery, connect/disconnect hooks and transaction sending with this stack.

## UX

Before connection:

> Use a separate trading wallet
>
> Do not connect your main wallet. Create a dedicated wallet in Phantom, Solflare, Backpack or another compatible wallet and fund it only with what you are comfortable losing.
>
> We never need your recovery phrase or private key.

The user must acknowledge this warning before the connect action becomes available.

After connection, display only the public address in shortened form and the wallet name. Never persist secret material.

## Mobile requirements

- Use Wallet Standard discovery rather than wallet-specific key handling.
- Prefer the wallet's official mobile handoff/deep-link behavior when the wallet is not embedded in the browser.
- Never attempt to open or imitate a wallet's login page.
- Show the official wallet/provider domain before connection where applicable.
- Return to the app after signing and verify the resulting signature on-chain.
- Handle cancellation, wallet-not-installed and stale-session states without exposing internals.

## Network safety

The app must show the active cluster before any signing request. Production trading is mainnet-only after explicit configuration; development uses devnet. Never silently switch clusters.

## Signing boundary

The frontend may request a signature from the connected wallet, but it cannot access the private key. Transaction bytes must come only from the validated transaction builder. AI, social content, Telegram callbacks and URL parameters cannot supply transaction bytes.

## References

Use the official Solana frontend, Wallet Standard and Kit documentation listed in `docs/official-solana-references.md` as the implementation source of truth.

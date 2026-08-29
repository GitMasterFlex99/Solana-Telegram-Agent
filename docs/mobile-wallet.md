# Mobile wallet integration

Use the current Solana Kit wallet plugin / Wallet Standard path for new development. Modern wallets such as Phantom, Solflare and Backpack expose themselves through Wallet Standard, so the app should not maintain a custom adapter for each wallet.

## Mobile flow

1. User opens the mobile web app from Telegram.
2. Before connection, show the separate-trading-wallet warning.
3. User chooses a detected compatible wallet.
4. App requests only the minimum public identity/signing capabilities required.
5. App reads the public address and displays it clearly.
6. Trading remains disabled until the transaction security release gate is satisfied.
7. For a future trade, show a short transaction review screen.
8. The wallet performs the actual signature.
9. App verifies the resulting transaction against the original intent.

Never put a wallet secret in Telegram, a URL, localStorage, analytics, crash reports or application logs.

Wallet discovery is not wallet trust. The application must still validate the network, public key and transaction contents before every signing handoff.

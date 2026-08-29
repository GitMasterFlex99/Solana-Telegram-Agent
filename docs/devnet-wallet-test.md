# Devnet wallet integration test

The first live wallet test must run on Solana devnet.

1. Create a disposable test wallet in an official wallet application.
2. Do not use the user's main wallet or the funded trading wallet.
3. Open the mobile web app over HTTPS.
4. Confirm the separate-wallet warning.
5. Discover a Wallet Standard wallet and connect it.
6. Display only the shortened public address and selected cluster.
7. Verify disconnect clears in-memory wallet state.
8. Test a harmless devnet SOL transfer using the official Kit transaction path.
9. Confirm the wallet shows the exact recipient and amount before signing.
10. Verify the resulting signature and on-chain status.

Mainnet trading must remain disabled until this test and the transaction simulation/review tests pass.

Reference implementation: Solana's official Next.js Kit template uses `@solana/kit-plugin-wallet`, Wallet Standard discovery, `@solana/react`, and devnet testing. See the official Solana frontend/template documentation before changing the integration.

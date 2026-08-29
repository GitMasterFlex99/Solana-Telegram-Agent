# Transaction review checklist

No mainnet transaction should reach a wallet-signing request unless every check passes.

1. User selected the token mint from an in-app verified token record.
2. Connected wallet matches the wallet session and is the dedicated trading wallet.
3. Active cluster is explicitly mainnet-beta for production trading.
4. Quote is fresh and tied to the requested input mint, output mint and exact amount.
5. Slippage is within the product maximum of 1%.
6. Transaction lifetime is within the short intent window.
7. Every writable account and executable program is validated against the expected swap route.
8. Simulation succeeds.
9. UI shows spend amount, expected output, minimum output, slippage, fees and destination/token accounts in human-readable form.
10. User explicitly chooses to open the wallet and sign.
11. After signing, the app verifies the returned signature on the expected cluster and reports success/failure without assuming submission equals confirmation.

Any failed check blocks the trade.

## Development

Use devnet or a local validator for transaction-path tests. Never use a real wallet or real funds in automated tests.

The first mainnet release should use a small manual test amount and a dedicated trading wallet only.

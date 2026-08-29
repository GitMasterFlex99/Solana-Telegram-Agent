# Devnet wallet test

The first live wallet and transaction path must run on Solana devnet with a disposable test wallet. Mainnet signing remains disabled until the complete release gate passes.

## Preconditions

- Use a disposable test wallet created in an official wallet application.
- Do not use the user's main wallet or any funded production/trading wallet.
- Open the mobile web app over HTTPS.
- Confirm the separate-wallet warning before connection.

## Connection test

1. Discover a Wallet Standard-compatible wallet.
2. Connect it using the current Solana Kit wallet path.
3. Confirm the wallet reports the Solana devnet cluster.
4. Display only the shortened public address and selected cluster.
5. Disconnect and verify that wallet-derived application state is cleared.

## Transaction test

1. Use a fixed, audited recipient controlled by the test environment.
2. Use a fixed micro-amount.
3. Construct the transfer from typed instructions; never accept raw transaction bytes from Telegram, AI, social data, query parameters, or arbitrary serialized user input.
4. Validate the transaction intent and allowed program/account policy.
5. Simulate immediately before signing.
6. Display the exact recipient, amount, network, and estimated fee.
7. Require explicit wallet approval.
8. Verify the resulting signature and on-chain status on devnet.
9. Record only non-sensitive test metadata.

## Failure cases

Verify that the path fails closed when:

- The wallet reports the wrong cluster.
- The transaction intent is stale or expired.
- Simulation fails.
- The destination or program policy is invalid.
- The wallet identity does not match the current intent.
- The wallet is disconnected or unavailable.
- The user cancels signing.

## Release gate

The UI must not send arbitrary transactions. The guarded devnet path should throw or block until the fixed recipient, typed instruction construction, policy validation, simulation, and result verification are wired and tested.

Mainnet signing stays disabled until code review, automated tests, manual wallet tests, simulation, and transaction-result verification all pass.

# Devnet wallet test

The wallet integration is implemented with Solana Kit + Wallet Standard. The first signing test must remain devnet-only.

## Required test

1. Connect a dedicated test wallet.
2. Confirm the wallet reports the Solana devnet chain.
3. Use a fixed, audited recipient controlled by the test environment.
4. Use a fixed micro-amount.
5. Construct the transfer from typed instructions; never accept raw transaction bytes from Telegram, AI, social data, query parameters, or user-provided arbitrary serialized transactions.
6. Simulate before signing.
7. Display recipient, amount, network and estimated fee.
8. Require explicit wallet approval.
9. Verify the resulting signature on devnet.
10. Record only non-sensitive test metadata.

## Release gate

The UI component intentionally throws instead of sending until the fixed recipient and instruction construction are wired and tested. Do not replace this guard with an arbitrary destination field.

Mainnet signing stays disabled until the same path passes code review, automated tests, simulation, and transaction-result verification.

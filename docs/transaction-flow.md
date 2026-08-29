# Secure transaction flow

## Target flow

1. User scans/analyzes a token.
2. User chooses a fixed simple trade amount.
3. Server obtains a current quote from the approved swap provider.
4. Server constructs a transaction for the exact wallet and requested trade.
5. Server decodes/validates the transaction against the user's intent.
6. Simulation is required and must succeed before signing is offered.
7. Mobile web shows exact input, expected output, slippage, fees, destination/program information, and expiry.
8. User opens their existing dedicated trading wallet.
9. Wallet performs the actual signing.
10. Server verifies the resulting signature/status and reports the outcome.

## Hard stops

- Wallet is not connected: no transaction.
- Wallet is not acknowledged as a dedicated trading wallet: no transaction.
- Quote is stale/expired: no transaction.
- Transaction does not match the intended input/output/mint/amount: no transaction.
- Unknown or unexpected program/account: no transaction.
- Simulation fails or is unavailable: no transaction.
- Slippage exceeds policy: no transaction.
- User cancels/rejects: no transaction.

## Never

- Never request a seed phrase or private key.
- Never store a signing secret.
- Never silently sign.
- Never accept arbitrary serialized transactions from Telegram, AI output, social posts, or user-controlled URLs.
- Never let an AI model choose a destination or alter transaction bytes.
- Never make a trade solely because a social account or model says BUY.

## Official references

Use the official Solana documentation in `docs/official-solana-references.md` and the current official Jupiter developer documentation for exact swap interfaces.

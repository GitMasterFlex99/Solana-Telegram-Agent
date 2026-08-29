# Official Solana implementation references

Use official Solana documentation as the source of truth for Solana-specific architecture and wallet behavior.

- Frontend: https://solana.com/docs/frontend
- Wallet compatibility / migration: https://solana.com/docs/frontend/web3-compat
- Wallet directory: https://solana.com/wallets
- React wallet connection cookbook: https://solana.com/developers/cookbook/wallets/connect-wallet-react
- Address verification: https://solana.com/docs/payments/send-payments/verify-address
- Payments: https://solana.com/docs/payments/accept-payments
- Actions and Blinks: https://solana.com/docs/tools/actions
- Solana Developer Platform: https://platform.solana.com/docs
- Wallet API reference: https://platform.solana.com/docs/reference/api/wallets
- Wallet policies: https://platform.solana.com/docs/wallet-operations/policies
- Wallet balances: https://platform.solana.com/docs/wallet-operations/balances

## Project rule

For new client-side wallet work, prefer `@solana/kit` with current Wallet Standard discovery. Solana's current frontend documentation identifies older web3.js v1 and wallet-adapter stacks as legacy for new development.

The wallet directory is a current compatibility reference, not an endorsement. Verify the provider's official domain before connecting.

For trading, use the current official Jupiter developer documentation for quote and swap transaction interfaces and verify the exact API contract before implementation. Do not copy stale endpoint examples into production code.

Security rule: official documentation is authoritative for protocol/tool behavior, but every transaction still requires local validation, simulation, explicit user review, and wallet-side signing.
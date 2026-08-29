# Official Solana implementation references

This project should use official Solana documentation as the source of truth for Solana-specific architecture and wallet behavior.

- Solana Frontend: https://solana.com/docs/frontend
- Solana Wallet Standard / Kit compatibility: https://solana.com/docs/frontend/web3-compat
- Solana Wallet Directory: https://solana.com/wallets
- Solana React wallet connection cookbook: https://solana.com/developers/cookbook/wallets/connect-wallet-react
- Solana Mobile Stack / Mobile Wallet Adapter background: https://solana.com/news/solana-mobile-stack-reveal
- Solana address verification: https://solana.com/docs/payments/send-payments/verify-address
- Solana payments: https://solana.com/docs/payments/accept-payments
- Solana Developer Platform: https://platform.solana.com/docs
- Solana wallet API reference: https://platform.solana.com/docs/reference/api/wallets
- Solana wallet policies: https://platform.solana.com/docs/wallet-operations/policies
- Solana wallet balances: https://platform.solana.com/docs/wallet-operations/balances

For new client-side wallet work, prefer Solana Kit with Wallet Standard discovery. Solana's current frontend documentation identifies older web3.js v1 and wallet-adapter stacks as legacy for new development.

For trading, use the current official Jupiter developer documentation for quote and swap transaction interfaces. Verify the exact current API contract before implementation; do not copy stale endpoint examples into production code.

Security rule: official documentation is authoritative for protocol/tool behavior, but every transaction still requires local validation, simulation, explicit user review, and wallet-side signing.

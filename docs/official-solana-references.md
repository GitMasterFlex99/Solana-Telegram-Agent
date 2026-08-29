# Official Solana implementation references

This project should use official Solana documentation as the source of truth for Solana-specific architecture and wallet behavior.

- Solana Developer Platform: https://platform.solana.com/docs
- Solana wallet API reference: https://platform.solana.com/docs/reference/api/wallets
- Solana wallet policies: https://platform.solana.com/docs/wallet-operations/policies
- Solana wallet balances: https://platform.solana.com/docs/wallet-operations/balances
- Solana IDL Explorer: https://idl.solana.com/docs

For client-side wallet compatibility, use current Solana-supported Wallet Standard / mobile-wallet patterns rather than implementing proprietary key handling.

For trading, use the current official Jupiter developer documentation for the quote and swap transaction interfaces, and verify the exact API contract before implementation. Do not copy stale endpoint examples into production code.

Security rule: official documentation is authoritative for protocol/tool behavior, but every transaction still requires local validation, simulation, explicit user review, and wallet-side signing.

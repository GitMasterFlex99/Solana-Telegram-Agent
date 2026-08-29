# Transaction intent security

Every future trade starts as a short-lived server-validated intent with:

- intent ID generated with a CSPRNG
- authenticated user/session ID
- exact connected wallet public key
- network/cluster
- exact action (buy/sell)
- exact input mint and output mint
- exact spend amount
- maximum slippage
- creation time and hard expiry
- policy version
- hash of the approved quote/transaction representation

## Hard policy

- Maximum intent lifetime: 60 seconds.
- Maximum slippage: 100 bps (1%).
- Intents are single-use.
- Mainnet execution remains disabled until the complete devnet path passes review and release-gate checks.
- The connected wallet must exactly match the intent wallet.
- The intent must be revalidated immediately before signing.
- AI, Telegram callback payloads and social content cannot create transaction authorization by themselves.
- Serialized transaction bytes are never accepted as authorization input.

Before signing, reconstruct or revalidate the transaction from the intent and compare the resulting critical accounts, programs and amounts against the policy. Simulation must pass immediately before signing. A stale, replayed, modified, or mismatched intent fails closed.

This is defense in depth and does not replace wallet review, program/account allowlisting, simulation or post-transaction verification.

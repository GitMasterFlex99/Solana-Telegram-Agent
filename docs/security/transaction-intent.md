# Transaction intent security

Every transaction must originate from a server-side validated intent with:

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

The intent is single-use. A successful signing/verification consumes it. Any mismatch between the wallet presented for signing and the wallet bound to the intent blocks the transaction.

Never accept arbitrary serialized transaction bytes from Telegram, AI output, social content, URL parameters, or an untrusted frontend field.

Before signing, reconstruct or revalidate the transaction from the intent and compare the resulting critical accounts/programs/amounts against the policy. Simulation must pass immediately before signing. A stale, replayed, modified, or mismatched intent fails closed.

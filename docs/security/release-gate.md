# Transaction release gate

No production transaction execution until all items below are checked off.

- [ ] Dedicated trading-wallet warning shown and acknowledged.
- [ ] Main-wallet connection is discouraged before any signing flow.
- [ ] Wallet identity is cryptographically bound to the current session.
- [ ] Transaction intent is generated from server-side validated parameters.
- [ ] Spend amount is bounded by a hard per-transaction limit.
- [ ] Slippage has a hard maximum.
- [ ] Allowed program/account policy is enforced.
- [ ] Transaction expires quickly and stale payloads are rejected.
- [ ] Simulation is performed immediately before signing.
- [ ] UI displays exact spend, expected output, slippage, fees and important accounts/programs.
- [ ] User explicitly initiates and approves every transaction.
- [ ] No transaction can be triggered from an AI response or social signal.
- [ ] Failed simulation blocks signing.
- [ ] RPC/Jupiter failures fail closed.
- [ ] Telegram callbacks cannot authorize a wallet transaction by themselves.
- [ ] Security logging contains no secrets.
- [ ] Dependency, secret and static scans pass in CI.
- [ ] Mobile wallet flow manually tested on supported wallets.
- [ ] Adversarial token fixtures tested.
- [ ] Threat model reviewed before release.

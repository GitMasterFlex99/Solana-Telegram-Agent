# Focused roadmap

## Phase 1 — Telegram scanner MVP
- [x] Telegram-only product surface
- [x] Basic market and momentum ranking
- [x] Combined risk engine and on-chain safety checks
- [x] Optional BYOK AI/social intelligence
- [x] Pump.fun discovery adapter and risk-aware filtering
- [x] Unified DexScreener + Pump.fun pipeline
- [x] Telegram authorization and rate limiting
- [x] Risk-profile settings
- [x] Persistent watchlist
- [x] Periodic watchlist monitoring and meaningful-change alerts
- [x] Security test suite and CI security gates
- [ ] Final CI verification of the latest hardening commits

## Phase 2 — paper trading
- [ ] Simulated entries and exits
- [ ] Position and P&L tracking
- [ ] Historical/performance statistics
- [ ] Slippage and fee simulation
- [ ] Paper-trading safety limits

## Phase 3 — existing wallet integration
- [ ] Public balance/portfolio view
- [ ] Jupiter quote service
- [ ] Transaction simulation
- [ ] Wallet handoff/signing
- [ ] Transaction status

## Phase 4 — release hardening
- [ ] Replay/staleness protection
- [ ] Program/account validation
- [ ] Adversarial transaction fixtures
- [ ] Manual devnet gates
- [ ] Deployment documentation

## Security release rule

Mainnet transaction execution remains blocked until the complete transaction path has passed the wallet, transaction-policy, simulation, replay/staleness, program/account validation, adversarial-fixture, and manual devnet gates documented under `docs/security/`.

## Explicitly out of scope for the read-only MVP
- Web application
- Custodial wallet
- Seed phrase/private-key import
- Autonomous trading
- Leverage
- Copy trading
- Paid tiers
- Complex trading terminal
- Points/referrals

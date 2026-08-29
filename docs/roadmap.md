# Focused roadmap

## Phase 1 — safe core
- [x] Telegram scanner MVP
- [x] Basic risk engine
- [x] Mobile-first product architecture
- [x] Optional BYOK AI interface
- [ ] Real token-address lookup for Analyze
- [ ] Social signal adapter
- [ ] Watchlist persistence

## Phase 2 — existing wallet
- [ ] Wallet Standard-compatible connection on mobile web
- [ ] Public balance/portfolio view
- [ ] Jupiter quote service
- [ ] Transaction simulation
- [ ] Wallet handoff/signing
- [ ] Transaction status

## Phase 3 — polish and release hardening
- [ ] Better scanner ranking
- [ ] Minimal alerts
- [x] Telegram authorization and rate-limit controls
- [x] Security test suite and CI security gates
- [ ] CSP/security-header tests for the mobile web app
- [ ] Deployment documentation

## Security release rule

Mainnet transaction execution remains blocked until the complete transaction path has passed the wallet, transaction-policy, simulation, replay/staleness, program/account validation, adversarial-fixture, and manual devnet gates documented under `docs/security/`.

## Explicitly out of scope for v1
- Custodial wallet
- Seed phrase/private-key import
- Autonomous trading
- Leverage
- Copy trading
- Paid tiers
- Complex trading terminal
- Points/referrals

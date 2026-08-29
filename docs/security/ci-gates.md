# Security CI gates

A release candidate must fail closed if any required gate fails.

1. TypeScript typecheck.
2. Production build.
3. Unit tests for transaction policy, address validation, expiry and replay protection.
4. Dependency audit with a documented exception process.
5. Secret scanning over source and generated artifacts.
6. Static analysis/linting.
7. Lockfile integrity and reproducible install check.
8. Test that untrusted token/social text cannot alter security policy.
9. Telegram authorization and rate-limit tests.
10. CSP/security-header tests.
11. Wallet-bound transaction-intent tests.
12. Simulation failure/stale quote/mismatched wallet tests.
13. Adversarial token/program fixtures.

No CI secret is exposed to untrusted pull requests. Production credentials are never used in tests.

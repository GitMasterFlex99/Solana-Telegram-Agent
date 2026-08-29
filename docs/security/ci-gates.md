# Security CI gates

A release candidate must fail closed if any required gate fails.

1. TypeScript typecheck.
2. Production web build.
3. Unit tests for transaction policy, address validation, expiry, replay protection, and Telegram authorization.
4. Dependency audit with a documented exception process.
5. Secret scanning over source and generated artifacts.
6. Static analysis/linting when the project has an enabled static-analysis toolchain.
7. Reproducible dependency installation from the resolved lockfile; commit the lockfile before production release.
8. Test that untrusted token/social text cannot alter security policy.
9. Telegram authorization and rate-limit tests.
10. CSP/security-header tests.
11. Wallet-bound transaction-intent tests.
12. Simulation failure/stale quote/mismatched wallet tests.
13. Adversarial token/program fixtures.

No CI secret is exposed to untrusted pull requests. Production credentials are never used in tests.

## Current CI implementation

The workflow currently generates a temporary lockfile because `package-lock.json` is not yet committed. It then installs that resolved tree with `npm ci`. This is acceptable for development CI but is not the final production reproducibility gate.

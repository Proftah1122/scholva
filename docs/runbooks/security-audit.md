# Security Audit Notes

## Current Result

`npm audit --omit=dev` reports advisories through `next@14.2.35` and its pinned `postcss` dependency.

## Constraint

The build specification requires Next.js 14. The npm-proposed automated fix upgrades to Next.js 16, which is a breaking stack change and must be approved as an architectural deviation before applying.

## Current Mitigation

- No remote image domains are configured in `next.config.mjs`.
- No middleware rewrites, CSP nonce handling, or WebSocket upgrade routes are present in the phase 1 frontend.
- Re-run the audit before production deployment and either apply a compatible Next 14 security release if available or approve an ADR for a Next major-version upgrade.

# Phase 1 Foundation

## Package Layout

- `apps/api`: Express API, delivery middleware, application ports, domain interfaces, Prisma schema.
- `apps/worker`: BullMQ worker shell and job/queue constants.
- `apps/web`: Next.js 14 App Router shell.
- `packages/shared-types`: Shared enums and DTO-level contracts.
- `packages/shared-utils`: Shared mapping and validation helpers.

## Dependency Rule

Domain modules do not import infrastructure, delivery, Express, Prisma, BullMQ, or framework code. Use cases depend on domain repositories and application ports.

## Verification

Phase 1 is considered healthy when these pass:

```bash
npm run typecheck
npm run prisma:validate
npm test
```

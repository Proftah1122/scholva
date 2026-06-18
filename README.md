# Scholva

Scholva is a two-sided intelligence platform connecting Nigerian university research projects to industry problems and employers.

This repository is scaffolded as a TypeScript monorepo following Corridor Principles v3.1:

- Clean Architecture dependency rule across domain, application, infrastructure, and delivery.
- Six DDD bounded contexts: Identity, Scholar, Industry, Suggestion, Matching, Engagement.
- Express API and BullMQ worker as separate deployable processes.
- Prisma/PostgreSQL/pgvector as the persistence and semantic-search foundation.

## Phase 1 Scope

Phase 1 creates the foundation only:

- npm workspaces and strict TypeScript project references.
- API, worker, web, shared-types, and shared-utils packages.
- Full Prisma schema plus a reversible initial SQL migration.
- Docker Compose for local PostgreSQL with pgvector and Redis.
- ADR-001 through ADR-006.

## Local Commands

```bash
npm install
npm run typecheck
npm run prisma:validate
docker compose up -d
```

Copy `.env.example` to `.env` before running services that need external providers.

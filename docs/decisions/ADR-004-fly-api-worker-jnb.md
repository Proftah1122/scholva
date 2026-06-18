# ADR-004: Fly.io for API and Worker in Johannesburg

## Status

Accepted

## Context

Scholva targets Nigerian students and companies. The API and worker should run close to users where practical, while staying deployable as separate processes.

## Decision

Deploy the Express API and BullMQ worker as separate Fly.io apps in the `jnb` region.

## Consequences

- API and worker can scale independently.
- Shared code remains in the monorepo and is built into each deployable.
- Redis and database network latency must be considered in staging smoke tests.

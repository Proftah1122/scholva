# ADR-005: Modular Monolith with Separate Worker Process

## Status

Accepted

## Context

Scholva has six bounded contexts but does not yet need independently deployed domain services. Premature microservices would increase operational complexity.

## Decision

Use a modular monolith API with clean bounded-context boundaries and a separate BullMQ worker process for asynchronous jobs.

## Consequences

- Cross-context communication happens through domain events and application ports.
- The worker handles PDF extraction, embeddings, matching, suggestions, and digest jobs.
- Future service extraction remains possible if a bounded context develops distinct scaling needs.

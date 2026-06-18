# ADR-001: TypeScript Throughout, Node.js/Express for API

## Status

Accepted

## Context

Scholva needs one language across API, worker, shared contracts, and frontend to reduce contract drift and support strict compile-time checks.

## Decision

Use TypeScript in strict mode throughout the monorepo. Use Node.js 18 and Express 5 for the API.

## Consequences

- Domain and application layers remain framework-free TypeScript.
- Runtime validation is still required at delivery boundaries because TypeScript does not validate external input.
- Express handlers must remain thin and delegate business behavior to application use cases.

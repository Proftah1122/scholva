# ADR-003: Voyage AI voyage-large-2 for All Embeddings

## Status

Accepted

## Context

The build prompt requires Voyage AI as the only embedding provider and explicitly forbids OpenAI for this product.

## Decision

Use Voyage AI `voyage-large-2` for document and query embeddings. Store vectors at 1536 dimensions.

## Consequences

- All embedding ports expose provider-neutral methods, but production adapters target Voyage.
- Database schema uses `vector(1536)`.
- Tests should mock the embedding port rather than call Voyage directly.

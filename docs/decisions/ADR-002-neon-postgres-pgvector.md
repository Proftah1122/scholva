# ADR-002: Neon PostgreSQL with pgvector, No Separate Vector DB

## Status

Accepted

## Context

Scholva requires relational integrity, semantic search, and matching over project/problem embeddings. Running a separate vector database would add operational overhead and duplicate data ownership early in the product.

## Decision

Use PostgreSQL 16 with the pgvector extension for embeddings and semantic search. Neon is the production PostgreSQL provider.

## Consequences

- Project, problem, and topic suggestion embeddings live beside relational records.
- Matching can combine vector similarity with consent, status, and ownership filters in one database.
- Vector indexes and query plans must be monitored as data volume grows.

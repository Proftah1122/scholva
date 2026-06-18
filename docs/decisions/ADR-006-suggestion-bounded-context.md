# ADR-006: Topic Suggestion Engine as Dedicated Bounded Context

## Status

Accepted

## Context

The Topic Suggestion Engine is structurally central to Scholva because it influences student research choices upstream, not just archive discovery downstream.

## Decision

Model Suggestion as its own bounded context with `SuggestionBatch`, `TopicSuggestion`, and `ProblemSurfacing` concepts.

## Consequences

- Suggestion logic owns topic generation, novelty checks, and surfaced industry problems.
- Scholar and Industry contexts communicate with Suggestion through events and repositories, not internal imports.
- The context can evolve independently as AI evaluation and ranking mature.

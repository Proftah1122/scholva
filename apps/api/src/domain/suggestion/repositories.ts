import type { UUID } from "@scholva/shared-types";
import type { ProblemSurfacing, SuggestionBatch, TopicSuggestion } from "./entities.js";

export interface ISuggestionRepository {
  createBatch(batch: SuggestionBatch, suggestions: readonly TopicSuggestion[]): Promise<void>;
  markSuggestionViewed(suggestionId: UUID): Promise<void>;
}

export interface IProblemSurfacingRepository {
  createMany(surfacings: readonly ProblemSurfacing[]): Promise<number>;
}

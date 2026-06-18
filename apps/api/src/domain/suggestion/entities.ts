import type { Discipline, UUID } from "@scholva/shared-types";

export interface SuggestionBatch {
  readonly id: UUID;
  readonly scholarId: UUID;
  readonly triggeredBy: "SCHOLAR_REGISTERED" | "PROBLEM_POSTED" | "WEEKLY_DIGEST";
  readonly createdAt: Date;
}

export interface TopicSuggestion {
  readonly id: UUID;
  readonly batchId: UUID;
  readonly scholarId: UUID;
  readonly relatedProblemId: UUID | null;
  readonly title: string;
  readonly rationale: string;
  readonly discipline: Discipline;
  readonly relevanceScore: number;
}

export interface ProblemSurfacing {
  readonly id: UUID;
  readonly scholarId: UUID;
  readonly problemId: UUID;
  readonly relevanceScore: number;
  readonly surfacedAt: Date;
}

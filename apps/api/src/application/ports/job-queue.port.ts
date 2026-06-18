import type { UUID } from "@scholva/shared-types";

export interface JobQueuePort {
  enqueueEmbedProject(projectId: UUID): Promise<void>;
  enqueueEmbedProblem(problemId: UUID): Promise<void>;
  enqueueRunMatch(problemId: UUID): Promise<void>;
  enqueueGenerateSuggestions(scholarId: UUID): Promise<void>;
  enqueueSurfaceProblem(problemId: UUID): Promise<void>;
}

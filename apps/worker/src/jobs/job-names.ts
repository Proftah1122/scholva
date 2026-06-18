import { JobName } from "@scholva/shared-types";

export const JOBS = {
  EMBED_PROJECT: JobName.EmbedProject,
  EMBED_PROBLEM: JobName.EmbedProblem,
  RUN_MATCH: JobName.RunMatch,
  GENERATE_SUGGESTIONS: JobName.GenerateSuggestions,
  SURFACE_PROBLEM: JobName.SurfaceProblem,
  WEEKLY_DIGEST: JobName.WeeklyDigest
} as const;

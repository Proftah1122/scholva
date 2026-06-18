import type { UUID } from "@scholva/shared-types";

export interface Match {
  readonly id: UUID;
  readonly problemId: UUID;
  readonly projectId: UUID;
  readonly similarityScore: number;
  readonly explanation: string;
}

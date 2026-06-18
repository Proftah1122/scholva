import type { Sector, UUID } from "@scholva/shared-types";
import type { Problem } from "./entities.js";

export interface IProblemRepository {
  findById(id: UUID): Promise<Problem | null>;
  findRecentOpenToStudentsBySectors(sectors: readonly Sector[], limit: number): Promise<readonly Problem[]>;
  save(problem: Problem): Promise<void>;
}

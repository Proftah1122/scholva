import type { UUID } from "@scholva/shared-types";
import type { Project, Scholar } from "./entities.js";

export interface IScholarRepository {
  findById(id: UUID): Promise<Scholar | null>;
  save(scholar: Scholar): Promise<void>;
}

export interface IProjectRepository {
  findById(id: UUID): Promise<Project | null>;
  save(project: Project): Promise<void>;
}

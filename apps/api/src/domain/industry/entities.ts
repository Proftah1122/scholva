import type { Sector, UUID } from "@scholva/shared-types";

export interface Company {
  readonly id: UUID;
  readonly userId: UUID;
  readonly name: string;
  readonly sector: Sector;
  readonly contactEmail: string;
}

export interface Problem {
  readonly id: UUID;
  readonly companyId: UUID;
  readonly title: string;
  readonly description: string;
  readonly sector: Sector;
  readonly skillsRequired: readonly string[];
  readonly isOpenToStudents: boolean;
}

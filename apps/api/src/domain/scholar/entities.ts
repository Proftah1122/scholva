import type { ConsentLevel, Discipline, UUID } from "@scholva/shared-types";

export interface Scholar {
  readonly id: UUID;
  readonly userId: UUID;
  readonly fullName: string;
  readonly institution: string;
  readonly department: string;
  readonly graduationYear: number;
  readonly disciplineFocus: Discipline;
  readonly bio: string | null;
}

export interface Project {
  readonly id: UUID;
  readonly scholarId: UUID;
  readonly title: string;
  readonly abstract: string;
  readonly fileUrl: string;
  readonly discipline: Discipline;
  readonly year: number;
  readonly consentLevel: ConsentLevel;
  readonly allowsContact: boolean;
  readonly allowsCommercialUse: boolean;
  readonly isPublished: boolean;
}

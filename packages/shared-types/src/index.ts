export type UUID = string;

export enum UserType {
  Student = "STUDENT",
  Industry = "INDUSTRY",
  Admin = "ADMIN"
}

export enum Discipline {
  Engineering = "Engineering",
  ComputerScience = "Computer Science",
  Agriculture = "Agriculture",
  Medicine = "Medicine",
  Pharmacy = "Pharmacy",
  Economics = "Economics",
  Law = "Law",
  Education = "Education",
  Architecture = "Architecture",
  SocialSciences = "Social Sciences",
  EnvironmentalSciences = "Environmental Sciences",
  Other = "Other"
}

export enum Sector {
  Engineering = "Engineering",
  Manufacturing = "Manufacturing",
  Construction = "Construction",
  Energy = "Energy",
  Logistics = "Logistics",
  Fintech = "Fintech",
  Technology = "Technology",
  Healthcare = "Healthcare",
  Education = "Education",
  Agriculture = "Agriculture",
  FoodAndBeverage = "Food & Beverage",
  Environmental = "Environmental",
  Pharma = "Pharma",
  Legal = "Legal",
  Finance = "Finance",
  Government = "Government",
  UrbanDevelopment = "Urban Development",
  NGO = "NGO"
}

export enum ConsentLevel {
  Public = "PUBLIC",
  Gated = "GATED",
  Private = "PRIVATE"
}

export enum PlanTier {
  Explorer = "EXPLORER",
  Professional = "PROFESSIONAL",
  Enterprise = "ENTERPRISE"
}

export enum JobName {
  EmbedProject = "embed-project",
  EmbedProblem = "embed-problem",
  RunMatch = "run-match",
  GenerateSuggestions = "generate-suggestions",
  SurfaceProblem = "surface-problem",
  WeeklyDigest = "weekly-digest"
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  correlation_id: string;
}

import type { PlanTier, UUID } from "@scholva/shared-types";

export interface ContactRequest {
  readonly id: UUID;
  readonly companyId: UUID;
  readonly projectId: UUID;
  readonly scholarId: UUID;
  readonly message: string;
}

export interface Subscription {
  readonly id: UUID;
  readonly companyId: UUID;
  readonly planTier: PlanTier;
  readonly currentPeriodStart: Date;
  readonly currentPeriodEnd: Date;
}

import type { UUID, PlanTier } from "@scholva/shared-types";

export interface IEmailPort {
  sendOTP(to: string, otp: string, purpose: string): Promise<void>;
  sendTopicSuggestions(
    to: string,
    scholarName: string,
    suggestions: readonly { readonly title: string; readonly rationale: string }[]
  ): Promise<void>;
  sendProblemSurfacing(
    to: string,
    scholarName: string,
    problem: { readonly title: string; readonly sector: string; readonly companyName: string }
  ): Promise<void>;
  sendContactRequest(to: string, companyName: string, message: string, requestId: UUID): Promise<void>;
  sendMatchNotification(to: string, problemTitle: string, matchCount: number): Promise<void>;
}

export interface IPaymentPort {
  initiateSubscription(
    companyId: UUID,
    planTier: PlanTier,
    email: string
  ): Promise<{ readonly authorizationUrl: string }>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
  cancelSubscription(paystackSubscriptionId: string): Promise<void>;
}

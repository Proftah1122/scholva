import type { ProblemDetails } from "@scholva/shared-types";

export class ProblemDetailError extends Error {
  readonly status: number;
  readonly type: string;

  constructor(params: { readonly type: string; readonly title: string; readonly status: number; readonly detail: string }) {
    super(params.detail);
    this.name = "ProblemDetailError";
    this.type = params.type;
    this.status = params.status;
  }

  toProblemDetails(correlationId: string): ProblemDetails {
    return {
      type: this.type,
      title: this.name,
      status: this.status,
      detail: this.message,
      correlation_id: correlationId
    };
  }
}

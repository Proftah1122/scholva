import type { Request } from "express";
import type { ZodSchema } from "zod";
import { ProblemDetailError } from "./problem-detail-error.js";

export function parseBody<T>(schema: ZodSchema<T>, req: Request): T {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    throw new ProblemDetailError({
      type: "https://scholva.ng/problems/invalid-request-body",
      title: "Invalid Request Body",
      status: 400,
      detail: result.error.issues.map((issue) => issue.message).join("; ")
    });
  }

  return result.data;
}

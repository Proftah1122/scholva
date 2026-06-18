import type { NextFunction, Request, Response } from "express";
import type { ProblemDetails } from "@scholva/shared-types";
import { ApplicationError } from "../../application/shared/application-error.js";
import { ProblemDetailError } from "../http/problem-detail-error.js";
import { getCorrelationId } from "./correlation-id.js";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new ProblemDetailError({
    type: "https://scholva.ng/problems/not-found",
    title: "Not Found",
    status: 404,
    detail: `No route exists for ${req.method} ${req.path}`
  }));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const correlationId = getCorrelationId(res);

  if (error instanceof ProblemDetailError) {
    res.status(error.status).json(error.toProblemDetails(correlationId));
    return;
  }

  if (error instanceof ApplicationError) {
    const body: ProblemDetails = {
      type: error.type,
      title: error.title,
      status: error.status,
      detail: error.message,
      correlation_id: correlationId
    };
    res.status(error.status).json(body);
    return;
  }

  const body: ProblemDetails = {
    type: "https://scholva.ng/problems/internal-server-error",
    title: "Internal Server Error",
    status: 500,
    detail: "An unexpected error occurred.",
    correlation_id: correlationId
  };
  res.status(500).json(body);
}

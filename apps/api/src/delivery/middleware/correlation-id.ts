import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.header("x-correlation-id");
  const correlationId = header && header.length > 0 ? header : randomUUID();
  res.locals["correlationId"] = correlationId;
  res.setHeader("x-correlation-id", correlationId);
  next();
}

export function getCorrelationId(res: Response): string {
  const value = res.locals["correlationId"];
  return typeof value === "string" ? value : randomUUID();
}

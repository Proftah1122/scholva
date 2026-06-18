import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedUserClaims, TokenIssuer } from "../../application/ports/auth.port.js";
import { ProblemDetailError } from "../http/problem-detail-error.js";

export function authenticate(tokenIssuer: TokenIssuer) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const header = req.header("authorization");
    if (header === undefined || !header.startsWith("Bearer ")) {
      next(unauthorized());
      return;
    }

    try {
      const claims = await tokenIssuer.verifyAccessToken(header.slice("Bearer ".length));
      res.locals["auth"] = claims;
      next();
    } catch {
      next(unauthorized());
    }
  };
}

export function getAuth(res: Response): AuthenticatedUserClaims {
  const auth = res.locals["auth"];
  if (isAuthClaims(auth)) {
    return auth;
  }

  throw unauthorized();
}

function isAuthClaims(value: unknown): value is AuthenticatedUserClaims {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<AuthenticatedUserClaims>;
  return typeof candidate.userId === "string" && typeof candidate.userType === "string";
}

function unauthorized(): ProblemDetailError {
  return new ProblemDetailError({
    type: "https://scholva.ng/problems/unauthorized",
    title: "Unauthorized",
    status: 401,
    detail: "A valid bearer token is required."
  });
}

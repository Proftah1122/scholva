import type { UUID, UserType } from "@scholva/shared-types";

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, passwordHash: string): Promise<boolean>;
}

export interface TokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
}

export interface AuthenticatedUserClaims {
  readonly userId: UUID;
  readonly userType: UserType;
}

export interface TokenIssuer {
  issuePair(claims: AuthenticatedUserClaims): Promise<TokenPair>;
  verifyAccessToken(token: string): Promise<AuthenticatedUserClaims>;
}

export interface RandomTokenGenerator {
  generateOtp(): string;
  generateRefreshToken(): string;
  hashToken(token: string): string;
}

export interface Clock {
  now(): Date;
}

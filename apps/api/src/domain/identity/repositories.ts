import type { UUID } from "@scholva/shared-types";
import type { User } from "./entities.js";

export interface CreateUserInput {
  readonly email: string;
  readonly passwordHash: string;
  readonly userType: User["userType"];
}

export interface IUserRepository {
  findById(id: UUID): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  markVerified(id: UUID): Promise<void>;
  recordFailedLogin(id: UUID, lockedUntil: Date | null): Promise<void>;
  resetFailedLogins(id: UUID): Promise<void>;
}

export interface OTPTokenRecord {
  readonly id: UUID;
  readonly userId: UUID;
  readonly tokenHash: string;
  readonly purpose: "EMAIL_VERIFY" | "PASSWORD_RESET";
  readonly expiresAt: Date;
  readonly usedAt: Date | null;
}

export interface IOTPTokenRepository {
  create(input: {
    readonly userId: UUID;
    readonly tokenHash: string;
    readonly purpose: OTPTokenRecord["purpose"];
    readonly expiresAt: Date;
  }): Promise<void>;
  findActiveByUserAndPurpose(userId: UUID, purpose: OTPTokenRecord["purpose"]): Promise<OTPTokenRecord | null>;
  markUsed(id: UUID): Promise<void>;
}

export interface RefreshTokenRecord {
  readonly id: UUID;
  readonly userId: UUID;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
}

export interface IRefreshTokenRepository {
  create(input: { readonly userId: UUID; readonly tokenHash: string; readonly expiresAt: Date }): Promise<void>;
  findByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revokeByHash(tokenHash: string): Promise<void>;
}

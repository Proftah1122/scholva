import type { UUID, UserType } from "@scholva/shared-types";

export interface User {
  readonly id: UUID;
  readonly email: string;
  readonly passwordHash: string;
  readonly userType: UserType;
  readonly isVerified: boolean;
  readonly failedLoginAttempts: number;
  readonly lockedUntil: Date | null;
}

export interface RefreshToken {
  readonly id: UUID;
  readonly userId: UUID;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
}

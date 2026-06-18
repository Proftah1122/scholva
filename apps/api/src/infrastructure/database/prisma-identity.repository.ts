import type { UserType } from "@scholva/shared-types";
import type { PrismaDatabase } from "./prisma-client.js";
import type {
  CreateUserInput,
  IOTPTokenRepository,
  IRefreshTokenRepository,
  IUserRepository,
  OTPTokenRecord,
  RefreshTokenRecord
} from "../../domain/identity/repositories.js";
import type { User } from "../../domain/identity/entities.js";

type PrismaUser = Awaited<ReturnType<PrismaDatabase["user"]["findUnique"]>>;
type PrismaOTPToken = Awaited<ReturnType<PrismaDatabase["oTPToken"]["findFirst"]>>;
type PrismaRefreshToken = Awaited<ReturnType<PrismaDatabase["refreshToken"]["findUnique"]>>;

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async findById(id: string): Promise<User | null> {
    return this.mapUser(await this.db.user.findUnique({ where: { id } }));
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.mapUser(await this.db.user.findUnique({ where: { email } }));
  }

  async create(input: CreateUserInput): Promise<User> {
    return this.mapRequiredUser(await this.db.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        userType: input.userType
      }
    }));
  }

  async markVerified(id: string): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: { isVerified: true }
    });
  }

  async recordFailedLogin(id: string, lockedUntil: Date | null): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: {
        failedLoginAttempts: { increment: 1 },
        lockedUntil
      }
    });
  }

  async resetFailedLogins(id: string): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });
  }

  private mapUser(user: PrismaUser): User | null {
    return user === null ? null : this.mapRequiredUser(user);
  }

  private mapRequiredUser(user: NonNullable<PrismaUser>): User {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      userType: user.userType as UserType,
      isVerified: user.isVerified,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil
    };
  }
}

export class PrismaOTPTokenRepository implements IOTPTokenRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async create(input: {
    readonly userId: string;
    readonly tokenHash: string;
    readonly purpose: OTPTokenRecord["purpose"];
    readonly expiresAt: Date;
  }): Promise<void> {
    await this.db.oTPToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        purpose: input.purpose,
        expiresAt: input.expiresAt
      }
    });
  }

  async findActiveByUserAndPurpose(userId: string, purpose: OTPTokenRecord["purpose"]): Promise<OTPTokenRecord | null> {
    return this.mapToken(await this.db.oTPToken.findFirst({
      where: {
        userId,
        purpose,
        usedAt: null
      },
      orderBy: { createdAt: "desc" }
    }));
  }

  async markUsed(id: string): Promise<void> {
    await this.db.oTPToken.update({
      where: { id },
      data: { usedAt: new Date() }
    });
  }

  private mapToken(token: PrismaOTPToken): OTPTokenRecord | null {
    if (token === null) {
      return null;
    }

    return {
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      purpose: token.purpose as OTPTokenRecord["purpose"],
      expiresAt: token.expiresAt,
      usedAt: token.usedAt
    };
  }
}

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async create(input: { readonly userId: string; readonly tokenHash: string; readonly expiresAt: Date }): Promise<void> {
    await this.db.refreshToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt
      }
    });
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return this.mapToken(await this.db.refreshToken.findUnique({ where: { tokenHash } }));
  }

  async revokeByHash(tokenHash: string): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  private mapToken(token: PrismaRefreshToken): RefreshTokenRecord | null {
    if (token === null) {
      return null;
    }

    return {
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt
    };
  }
}

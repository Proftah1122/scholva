import { AuthService } from "./application/identity/auth.service.js";
import type { TokenIssuer } from "./application/ports/auth.port.js";
import { PlatformService } from "./application/platform/platform.service.js";
import { BcryptPasswordHasher } from "./infrastructure/auth/bcrypt-password-hasher.js";
import { CryptoRandomTokenGenerator } from "./infrastructure/auth/random-token-generator.js";
import { RS256TokenIssuer } from "./infrastructure/auth/rs256-token-issuer.js";
import { SystemClock } from "./infrastructure/auth/system-clock.js";
import { prisma } from "./infrastructure/database/prisma-client.js";
import {
  PrismaOTPTokenRepository,
  PrismaRefreshTokenRepository,
  PrismaUserRepository
} from "./infrastructure/database/prisma-identity.repository.js";
import { BullMQJobQueue, InlineNoopJobQueue } from "./infrastructure/queue/bullmq-job-queue.js";
import type { ApiConfig } from "./config.js";

export interface Container {
  readonly bootedAt: Date;
  readonly config: ApiConfig;
  readonly authService: AuthService;
  readonly platformService: PlatformService;
  readonly tokenIssuer: TokenIssuer;
}

export function createContainer(config: ApiConfig): Container {
  const tokenGenerator = new CryptoRandomTokenGenerator();
  const tokenIssuer = new RS256TokenIssuer(
    config.JWT_PRIVATE_KEY,
    config.JWT_PUBLIC_KEY,
    () => tokenGenerator.generateRefreshToken()
  );
  const jobQueue = config.NODE_ENV === "test" ? new InlineNoopJobQueue() : new BullMQJobQueue(config.REDIS_URL);

  return {
    bootedAt: new Date(),
    config,
    tokenIssuer,
    authService: new AuthService(
      new PrismaUserRepository(prisma),
      new PrismaOTPTokenRepository(prisma),
      new PrismaRefreshTokenRepository(prisma),
      new BcryptPasswordHasher(),
      tokenIssuer,
      tokenGenerator,
      new SystemClock(),
      config.NODE_ENV !== "production"
    ),
    platformService: new PlatformService(prisma, jobQueue, config.PAYSTACK_SECRET_KEY, config.VOYAGE_API_KEY)
  };
}

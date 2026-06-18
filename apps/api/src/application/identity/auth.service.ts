import type { UserType } from "@scholva/shared-types";
import type { IOTPTokenRepository, IRefreshTokenRepository, IUserRepository } from "../../domain/identity/repositories.js";
import { ApplicationError } from "../shared/application-error.js";
import type { Clock, PasswordHasher, RandomTokenGenerator, TokenIssuer, TokenPair } from "../ports/auth.port.js";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const OTP_TTL_MINUTES = 15;
const REFRESH_TOKEN_DAYS = 30;

export interface RegisterInput {
  readonly email: string;
  readonly password: string;
  readonly userType: UserType;
}

export interface RegisterOutput {
  readonly userId: string;
  readonly verificationRequired: true;
  readonly developmentOtp?: string;
}

export interface LoginInput {
  readonly email: string;
  readonly password: string;
}

export interface AuthSessionOutput extends TokenPair {
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly userType: UserType;
    readonly isVerified: boolean;
  };
}

export class AuthService {
  constructor(
    private readonly users: IUserRepository,
    private readonly otpTokens: IOTPTokenRepository,
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenIssuer: TokenIssuer,
    private readonly tokenGenerator: RandomTokenGenerator,
    private readonly clock: Clock,
    private readonly exposeOtpInDevelopment: boolean
  ) {}

  async register(input: RegisterInput): Promise<RegisterOutput> {
    this.assertPasswordStrength(input.password);
    const existing = await this.users.findByEmail(input.email);
    if (existing !== null) {
      throw new ApplicationError({
        status: 409,
        type: "https://scholva.ng/problems/email-already-registered",
        title: "Email Already Registered",
        detail: "A user already exists for this email address."
      });
    }

    const user = await this.users.create({
      email: input.email.toLowerCase().trim(),
      passwordHash: await this.passwordHasher.hash(input.password),
      userType: input.userType
    });

    const otp = this.tokenGenerator.generateOtp();
    await this.otpTokens.create({
      userId: user.id,
      tokenHash: this.tokenGenerator.hashToken(otp),
      purpose: "EMAIL_VERIFY",
      expiresAt: this.addMinutes(this.clock.now(), OTP_TTL_MINUTES)
    });

    return {
      userId: user.id,
      verificationRequired: true,
      ...(this.exposeOtpInDevelopment ? { developmentOtp: otp } : {})
    };
  }

  async verifyEmail(input: { readonly userId: string; readonly otp: string }): Promise<{ readonly verified: true }> {
    const token = await this.otpTokens.findActiveByUserAndPurpose(input.userId, "EMAIL_VERIFY");
    if (token === null || token.expiresAt <= this.clock.now()) {
      throw new ApplicationError({
        status: 400,
        type: "https://scholva.ng/problems/invalid-otp",
        title: "Invalid OTP",
        detail: "The verification code is invalid or expired."
      });
    }

    if (token.tokenHash !== this.tokenGenerator.hashToken(input.otp)) {
      throw new ApplicationError({
        status: 400,
        type: "https://scholva.ng/problems/invalid-otp",
        title: "Invalid OTP",
        detail: "The verification code is invalid or expired."
      });
    }

    await this.users.markVerified(input.userId);
    await this.otpTokens.markUsed(token.id);
    return { verified: true };
  }

  async login(input: LoginInput): Promise<AuthSessionOutput> {
    const user = await this.users.findByEmail(input.email.toLowerCase().trim());
    if (user === null) {
      throw this.invalidCredentials();
    }

    if (user.lockedUntil !== null && user.lockedUntil > this.clock.now()) {
      throw new ApplicationError({
        status: 423,
        type: "https://scholva.ng/problems/account-locked",
        title: "Account Locked",
        detail: "This account is temporarily locked after repeated failed login attempts."
      });
    }

    const passwordMatches = await this.passwordHasher.verify(input.password, user.passwordHash);
    if (!passwordMatches) {
      const attempts = user.failedLoginAttempts + 1;
      const lockedUntil = attempts >= MAX_FAILED_LOGIN_ATTEMPTS ? this.addMinutes(this.clock.now(), LOCKOUT_MINUTES) : null;
      await this.users.recordFailedLogin(user.id, lockedUntil);
      throw this.invalidCredentials();
    }

    await this.users.resetFailedLogins(user.id);
    const tokens = await this.createTokenPair(user.id, user.userType);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        isVerified: user.isVerified
      }
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const tokenHash = this.tokenGenerator.hashToken(refreshToken);
    const stored = await this.refreshTokens.findByHash(tokenHash);
    if (stored === null || stored.revokedAt !== null || stored.expiresAt <= this.clock.now()) {
      throw new ApplicationError({
        status: 401,
        type: "https://scholva.ng/problems/invalid-refresh-token",
        title: "Invalid Refresh Token",
        detail: "The refresh token is invalid or expired."
      });
    }

    const user = await this.users.findById(stored.userId);
    if (user === null) {
      throw new ApplicationError({
        status: 401,
        type: "https://scholva.ng/problems/invalid-refresh-token",
        title: "Invalid Refresh Token",
        detail: "The refresh token is invalid or expired."
      });
    }

    await this.refreshTokens.revokeByHash(tokenHash);
    return this.createTokenPair(user.id, user.userType);
  }

  async logout(refreshToken: string): Promise<{ readonly loggedOut: true }> {
    await this.refreshTokens.revokeByHash(this.tokenGenerator.hashToken(refreshToken));
    return { loggedOut: true };
  }

  private async createTokenPair(userId: string, userType: UserType): Promise<TokenPair> {
    const refreshToken = this.tokenGenerator.generateRefreshToken();
    await this.refreshTokens.create({
      userId,
      tokenHash: this.tokenGenerator.hashToken(refreshToken),
      expiresAt: this.addDays(this.clock.now(), REFRESH_TOKEN_DAYS)
    });

    const pair = await this.tokenIssuer.issuePair({ userId, userType });
    return {
      accessToken: pair.accessToken,
      refreshToken
    };
  }

  private assertPasswordStrength(password: string): void {
    if (password.length < 12) {
      throw new ApplicationError({
        status: 400,
        type: "https://scholva.ng/problems/weak-password",
        title: "Weak Password",
        detail: "Password must be at least 12 characters long."
      });
    }
  }

  private invalidCredentials(): ApplicationError {
    return new ApplicationError({
      status: 401,
      type: "https://scholva.ng/problems/invalid-credentials",
      title: "Invalid Credentials",
      detail: "Email or password is incorrect."
    });
  }

  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60_000);
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60_000);
  }
}

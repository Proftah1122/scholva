import { createHash, randomBytes, randomInt } from "node:crypto";
import type { RandomTokenGenerator } from "../../application/ports/auth.port.js";

export class CryptoRandomTokenGenerator implements RandomTokenGenerator {
  generateOtp(): string {
    return randomInt(100_000, 1_000_000).toString();
  }

  generateRefreshToken(): string {
    return randomBytes(48).toString("base64url");
  }

  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}

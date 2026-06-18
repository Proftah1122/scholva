import bcrypt from "bcryptjs";
import type { PasswordHasher } from "../../application/ports/auth.port.js";

const BCRYPT_COST = 12;

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_COST);
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}

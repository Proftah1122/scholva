import { generateKeyPairSync, type KeyObject } from "node:crypto";
import { importPKCS8, importSPKI, jwtVerify, SignJWT } from "jose";
import { UserType } from "@scholva/shared-types";
import type { AuthenticatedUserClaims, TokenIssuer, TokenPair } from "../../application/ports/auth.port.js";

const ISSUER = "scholva-api";
const ACCESS_EXPIRY = "15m";

export class RS256TokenIssuer implements TokenIssuer {
  private readonly privateKeyPem: string;
  private readonly publicKeyPem: string;

  constructor(privateKeyPem: string | undefined, publicKeyPem: string | undefined, private readonly refreshTokenFactory: () => string) {
    if (privateKeyPem !== undefined && publicKeyPem !== undefined && privateKeyPem.length > 0 && publicKeyPem.length > 0) {
      this.privateKeyPem = privateKeyPem.replace(/\\n/g, "\n");
      this.publicKeyPem = publicKeyPem.replace(/\\n/g, "\n");
      return;
    }

    const keyPair = generateKeyPairSync("rsa", { modulusLength: 2048 });
    this.privateKeyPem = exportPKCS8Sync(keyPair.privateKey);
    this.publicKeyPem = exportSPKISync(keyPair.publicKey);
  }

  async issuePair(claims: AuthenticatedUserClaims): Promise<TokenPair> {
    const privateKey = await importPKCS8(this.privateKeyPem, "RS256");
    const accessToken = await new SignJWT({
      user_type: claims.userType
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(ISSUER)
      .setSubject(claims.userId)
      .setIssuedAt()
      .setExpirationTime(ACCESS_EXPIRY)
      .sign(privateKey);

    return {
      accessToken,
      refreshToken: this.refreshTokenFactory()
    };
  }

  async verifyAccessToken(token: string): Promise<AuthenticatedUserClaims> {
    const publicKey = await importSPKI(this.publicKeyPem, "RS256");
    const result = await jwtVerify(token, publicKey, { issuer: ISSUER });
    const userType = result.payload["user_type"];

    if (typeof result.payload.sub !== "string" || !isUserType(userType)) {
      throw new Error("Invalid access token claims");
    }

    return {
      userId: result.payload.sub,
      userType
    };
  }
}

function isUserType(value: unknown): value is UserType {
  return typeof value === "string" && Object.values(UserType).includes(value as UserType);
}

function exportPKCS8Sync(key: KeyObject): string {
  return key.export({ format: "pem", type: "pkcs8" }).toString();
}

function exportSPKISync(key: KeyObject): string {
  return key.export({ format: "pem", type: "spki" }).toString();
}

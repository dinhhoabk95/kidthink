import {
  createHash,
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import argon2 from "argon2";

const scrypt = promisify(scryptCb);

const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "11111111",
  "00000000",
  "qwertyui",
  "qwertyuiop",
  "abcdefgh",
]);

export interface PasswordValidationResult {
  valid: boolean;
  reason?: string;
}

export function validatePasswordStrength(
  password: string
): PasswordValidationResult {
  if (!password || password.length < 8) {
    return {
      valid: false,
      reason: "Mật khẩu phải có ít nhất 8 ký tự.",
    };
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return {
      valid: false,
      reason: "Mật khẩu quá phổ biến. Vui lòng chọn mật khẩu khác.",
    };
  }

  return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    hashLength: 32,
  });
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (!hash) {
    return false;
  }
  if (hash.startsWith("$argon2id$")) {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }
  if (!hash.startsWith("scrypt$")) {
    return false;
  }
  const parts = hash.split("$");
  if (parts.length !== 3) {
    return false;
  }
  const salt = parts[1];
  const originalKeyHex = parts[2];
  const originalBuffer = Buffer.from(originalKeyHex, "hex");

  try {
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return timingSafeEqual(originalBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Generates a cryptographically secure 32-byte base64url token (BR-EVF-01, BR-PWR-02).
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Computes sha256 hash hex string of a raw token to store in verification_tokens (BR-EVF-01, BR-PWR-02).
 */
export function hashSecureToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

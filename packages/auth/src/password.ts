import {
  createHash,
  pbkdf2 as pbkdf2Cb,
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { isCloudflareRuntime } from "@mindkid/config";

const scrypt = promisify(scryptCb);
const pbkdf2Async = promisify(pbkdf2Cb);

export const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_MAX_ITERATIONS = 1_000_000;
const PBKDF2_KEYLEN_BYTES = 32;
const HEX_STRING_PATTERN = /^[0-9a-f]+$/i;

const DUMMY_ARGON2_HASH =
  "$argon2id$v=19$m=19456,p=1,t=2$Zmx0piJSIcdd2b8oaF8ZUg$U60ArJk0sNteiIdlfZyr7G0shEXA+IqCyWIKs1La4WE";
const DUMMY_PBKDF2_HASH =
  "pbkdf2$100000$0123456789abcdef0123456789abcdef$4fc1115a50a569179c26ba51bc52313c885eaf76908c93f75bce685ba9637568";

export function getDummyPasswordHash(): string {
  return isCloudflareRuntime() ? DUMMY_PBKDF2_HASH : DUMMY_ARGON2_HASH;
}

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

interface PasswordValidationResult {
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

export async function hashPasswordPbkdf2(password: string): Promise<string> {
  const salt = randomBytes(16);
  if (typeof globalThis.crypto?.subtle?.importKey === "function") {
    const keyMaterial = await globalThis.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const derivedBits = await globalThis.crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      PBKDF2_KEYLEN_BYTES * 8
    );
    return `pbkdf2$${PBKDF2_ITERATIONS}$${salt.toString("hex")}$${Buffer.from(derivedBits).toString("hex")}`;
  }

  const derived = await pbkdf2Async(
    password,
    salt,
    PBKDF2_ITERATIONS,
    PBKDF2_KEYLEN_BYTES,
    "sha256"
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

async function verifyPbkdf2Hash(
  password: string,
  encodedHash: string
): Promise<boolean> {
  const parts = encodedHash.split("$");
  if (parts.length !== 4) {
    return false;
  }
  const iterations = Number(parts[1]);
  const saltHex = parts[2];
  const expectedHex = parts[3];
  if (
    !(
      Number.isInteger(iterations) &&
      iterations >= 10_000 &&
      iterations <= PBKDF2_MAX_ITERATIONS &&
      saltHex &&
      expectedHex &&
      saltHex.length % 2 === 0 &&
      expectedHex.length % 2 === 0 &&
      HEX_STRING_PATTERN.test(saltHex) &&
      HEX_STRING_PATTERN.test(expectedHex)
    )
  ) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const expectedBuf = Buffer.from(expectedHex, "hex");

  let actualBuf: Buffer;
  if (typeof globalThis.crypto?.subtle?.importKey === "function") {
    const keyMaterial = await globalThis.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const bits = await globalThis.crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations,
        hash: "SHA-256",
      },
      keyMaterial,
      expectedBuf.length * 8
    );
    actualBuf = Buffer.from(bits);
  } else {
    actualBuf = await pbkdf2Async(
      password,
      salt,
      iterations,
      expectedBuf.length,
      "sha256"
    );
  }

  if (actualBuf.length !== expectedBuf.length) {
    return false;
  }
  return timingSafeEqual(expectedBuf, actualBuf);
}

/**
 * Băm mật khẩu thích ứng theo giai đoạn hạ tầng:
 * - Giai đoạn 1 (`MINDKID_RUNTIME=cloudflare`): WebCrypto `PBKDF2-SHA256` (~0ms JS CPU trên Workers Free).
 * - Giai đoạn 2 (`MINDKID_RUNTIME=vps`): `Argon2id` nạp động (không kéo C++ addon vào bundle Cloudflare).
 */
export async function hashPassword(password: string): Promise<string> {
  if (isCloudflareRuntime()) {
    return await hashPasswordPbkdf2(password);
  }
  const argon2Mod = await import("argon2");
  const argon2 = argon2Mod.default;
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    hashLength: 32,
  });
}

/**
 * Xác thực được cả `pbkdf2$...` (từ Giai đoạn 1 Cloudflare chuyển về VPS),
 * `$argon2id$...` (Giai đoạn 2 VPS) và `scrypt$...` (legacy).
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (!hash) {
    return false;
  }
  if (hash.startsWith("pbkdf2$")) {
    try {
      return await verifyPbkdf2Hash(password, hash);
    } catch {
      return false;
    }
  }
  if (hash.startsWith("$argon2id$")) {
    if (isCloudflareRuntime()) {
      return false;
    }
    try {
      const argon2Mod = await import("argon2");
      return await argon2Mod.default.verify(hash, password);
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
  if (!(salt && originalKeyHex)) {
    return false;
  }
  const originalBuffer = Buffer.from(originalKeyHex, "hex");

  try {
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return timingSafeEqual(originalBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Trả về `true` khi chạy trên VPS (Giai đoạn 2) mà tài khoản còn giữ hash `pbkdf2$`
 * từ Giai đoạn 1 Cloudflare, cho phép nâng cấp ngầm lên Argon2id ngay khi đăng nhập.
 */
export function needsPasswordRehash(hash: string): boolean {
  if (isCloudflareRuntime()) {
    return !hash.startsWith("pbkdf2$");
  }
  return !hash.startsWith("$argon2id$");
}

export function generateSecureToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSecureToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

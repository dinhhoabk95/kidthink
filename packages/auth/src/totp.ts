import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { Secret, TOTP } from "otpauth";

function totpEncryptionKey(secret: string): Buffer {
  return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptTotpSecret(
  totpSecret: string,
  encryptionSecret: string
): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    totpEncryptionKey(encryptionSecret),
    iv
  );
  const ciphertext = Buffer.concat([
    cipher.update(totpSecret, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptTotpSecret(
  stored: string,
  encryptionSecret: string
): string {
  const [version, ivB64, tagB64, ciphertextB64] = stored.split(".");
  if (version !== "v1" || !ivB64 || !tagB64 || !ciphertextB64) {
    throw new Error("Encrypted TOTP secret has invalid format");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    totpEncryptionKey(encryptionSecret),
    Buffer.from(ivB64, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function generateTotpSecret(): string {
  const secret = new Secret({ size: 20 });
  return secret.base32;
}

export function generateTotpCode(
  secret: string,
  timestampMs = Date.now(),
  stepSeconds = 30
): string {
  const totp = new TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: stepSeconds,
    secret: Secret.fromBase32(secret),
  });
  return totp.generate({ timestamp: timestampMs });
}

export function verifyTotpCode(
  code: string,
  secret: string,
  timestampMs = Date.now(),
  windowSteps = 1,
  stepSeconds = 30
): boolean {
  if (!code || typeof code !== "string" || code.trim().length !== 6) {
    return false;
  }
  const totp = new TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: stepSeconds,
    secret: Secret.fromBase32(secret),
  });
  const delta = totp.validate({
    token: code.trim(),
    window: windowSteps,
    timestamp: timestampMs,
  });
  return delta !== null;
}

export function generateTotpUri(
  secret: string,
  accountName: string,
  issuer = "MindKid"
): string {
  const totp = new TOTP({
    issuer,
    label: accountName,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  });
  return totp.toString();
}

export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(6);
    let part1 = "";
    let part2 = "";
    let part3 = "";

    for (let j = 0; j < 4; j++) {
      part1 += chars[bytes[j] % chars.length];
      part2 += chars[bytes[j + 1] % chars.length];
      part3 += chars[bytes[j + 2] % chars.length];
    }
    codes.push(`${part1}-${part2}-${part3}`);
  }

  return codes;
}

export function hashRecoveryCode(code: string): string {
  const clean = code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return createHash("sha256").update(clean).digest("hex");
}

import crypto from "node:crypto";
import { optionalEnv, requireEnv } from "@mindkid/config";

function getSecretKey(secret?: string): Buffer {
  let rawSecret = secret;
  if (rawSecret === undefined) {
    rawSecret = optionalEnv("FCM_ENCRYPTION_SECRET");
  }
  if (rawSecret === undefined) {
    rawSecret = requireEnv("NUXT_NOTIFICATION_TOKEN_ENCRYPTION_KEY");
  }

  return crypto.createHash("sha256").update(rawSecret).digest();
}

/**
 * Encrypts FCM token using AES-256-GCM and generates a SHA-256 HMAC fingerprint.
 */
export function encryptFcmToken(token: string, customSecret?: string) {
  const key = getSecretKey(customSecret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(token, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");

  // Format: iv:authTag:encrypted
  const tokenEncrypted = `${iv.toString("base64")}:${authTag}:${encrypted}`;
  const tokenFingerprint = generateTokenFingerprint(token, customSecret);

  return {
    tokenEncrypted,
    tokenFingerprint,
  };
}

/**
 * Decrypts AES-256-GCM encrypted FCM token.
 */
export function decryptFcmToken(
  tokenEncrypted: string,
  customSecret?: string
): string {
  const parts = tokenEncrypted.split(":");
  if (parts.length !== 3) {
    throw new Error("INVALID_ENCRYPTED_TOKEN_FORMAT");
  }

  const [ivBase64, authTagBase64, encryptedBase64] = parts;
  if (!(ivBase64 && authTagBase64 && encryptedBase64)) {
    throw new Error("INVALID_ENCRYPTED_TOKEN_FORMAT");
  }
  const key = getSecretKey(customSecret);
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decryptedPart1: string = decipher.update(
    encryptedBase64,
    "base64",
    "utf8"
  );
  const decryptedPart2: string = decipher.final("utf8");

  return decryptedPart1 + decryptedPart2;
}

/**
 * Generates HMAC-SHA256 fingerprint for token deduplication.
 */
export function generateTokenFingerprint(
  token: string,
  customSecret?: string
): string {
  const key = getSecretKey(customSecret);
  return crypto.createHmac("sha256", key).update(token).digest("hex");
}

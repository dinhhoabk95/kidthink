import { describe, expect, it } from "vitest";
import {
  decryptFcmToken,
  encryptFcmToken,
  generateTokenFingerprint,
} from "../src/fcm-crypto";

describe("FCM Cryptography Helper Tests", () => {
  it("BR-BPS-04: Encrypts token and decrypts back to original value", () => {
    const rawToken = "fcm_raw_token_xyz_123456789";
    const { tokenEncrypted, tokenFingerprint } = encryptFcmToken(rawToken);

    expect(tokenEncrypted).not.toBe(rawToken);
    expect(tokenEncrypted).toContain(":");
    expect(tokenFingerprint).toBeDefined();

    const decrypted = decryptFcmToken(tokenEncrypted);
    expect(decrypted).toBe(rawToken);
  });

  it("BR-BPS-04: Generates deterministic HMAC fingerprint for same secret and token", () => {
    const token = "fcm_token_sample_abc_789";
    const fp1 = generateTokenFingerprint(token);
    const fp2 = generateTokenFingerprint(token);

    expect(fp1).toBe(fp2);
    expect(fp1.length).toBe(64); // SHA256 hex string length
  });

  it("BR-BPS-04: Throws error on malformed encrypted string", () => {
    expect(() => decryptFcmToken("invalid_encrypted_data")).toThrow(
      "INVALID_ENCRYPTED_TOKEN_FORMAT"
    );
  });

  it("BR-BPS-04: Throws error in production if secret is missing", () => {
    const origEnv = process.env.NODE_ENV;
    const origSecret = process.env.FCM_ENCRYPTION_SECRET;
    const origNuxtSecret = process.env.NUXT_NOTIFICATION_TOKEN_ENCRYPTION_KEY;

    try {
      process.env.NODE_ENV = "production";
      delete process.env.FCM_ENCRYPTION_SECRET;
      delete process.env.NUXT_NOTIFICATION_TOKEN_ENCRYPTION_KEY;

      expect(() => encryptFcmToken("sample_token")).toThrow(
        "MISSING_FCM_ENCRYPTION_SECRET"
      );
    } finally {
      process.env.NODE_ENV = origEnv;
      if (origSecret) {
        process.env.FCM_ENCRYPTION_SECRET = origSecret;
      }
      if (origNuxtSecret) {
        process.env.NUXT_NOTIFICATION_TOKEN_ENCRYPTION_KEY = origNuxtSecret;
      }
    }
  });
});

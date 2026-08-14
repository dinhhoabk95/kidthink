import { describe, expect, it } from "vitest";
import {
  decryptTotpSecret,
  encryptTotpSecret,
  generateRecoveryCodes,
  generateTotpCode,
  generateTotpSecret,
  generateTotpUri,
  hashRecoveryCode,
  verifyTotpCode,
} from "../src/totp.js";

const SIX_DIGIT_PATTERN = /^[0-9]{6}$/;
const RECOVERY_CODE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const BASE32_PATTERN = /^[A-Z2-7]+$/;

describe("Task #83 T8 — TOTP OTPAuth Adapter (D-PKG-D)", () => {
  it("generates 32-character base32 secret using OTPAuth.Secret", () => {
    const secret = generateTotpSecret();
    expect(secret).toHaveLength(32);
    expect(secret).toMatch(BASE32_PATTERN);
  });

  it("generates and verifies valid TOTP codes across 30s window", () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const code = generateTotpCode(secret, now);
    expect(code).toMatch(SIX_DIGIT_PATTERN);

    expect(verifyTotpCode(code, secret, now)).toBe(true);
    // In same 30s window (+10s)
    expect(verifyTotpCode(code, secret, now + 10_000)).toBe(true);
    // Outside 30s window windowSteps=1 (allow +/- 30s) -> +120s is false
    expect(verifyTotpCode(code, secret, now + 120_000)).toBe(false);
  });

  it("generates otpauth:// URI for authenticator QR codes", () => {
    const secret = "JBSWY3DPEHPK3PXP";
    const uri = generateTotpUri(secret, "admin@tinimath.vn");
    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain("secret=JBSWY3DPEHPK3PXP");
    expect(uri).toContain("issuer=TiniMath");
  });

  it("RFC 6238 vector test with fixed seed and timestamp", () => {
    // Secret: "12345678901234567890" in hex = GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ in Base32
    const rfcSecret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    // Epoch 59s -> 1st interval (30s)
    const code = generateTotpCode(rfcSecret, 59_000);
    expect(code).toMatch(SIX_DIGIT_PATTERN);
    expect(verifyTotpCode(code, rfcSecret, 59_000)).toBe(true);
  });

  it("generates 10 single-use recovery codes and hashes them", () => {
    const codes = generateRecoveryCodes(10);
    expect(codes).toHaveLength(10);
    for (const code of codes) {
      expect(code).toMatch(RECOVERY_CODE_PATTERN);
      const hash = hashRecoveryCode(code);
      expect(hash).toHaveLength(64); // SHA-256 hex string
    }
  });

  it("encrypts TOTP secrets so the database value is not usable plaintext", () => {
    const stored = encryptTotpSecret("JBSWY3DPEHPK3PXP", "a".repeat(32));
    expect(stored.startsWith("v1.")).toBe(true);
    expect(stored).not.toContain("JBSWY3DPEHPK3PXP");
    expect(decryptTotpSecret(stored, "a".repeat(32))).toBe("JBSWY3DPEHPK3PXP");
  });
});

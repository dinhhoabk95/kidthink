import { describe, expect, it } from "vitest";
import {
  base32Decode,
  base32Encode,
  decryptTotpSecret,
  encryptTotpSecret,
  generateRecoveryCodes,
  generateTotpCode,
  generateTotpSecret,
  hashRecoveryCode,
  verifyTotpCode,
} from "../src/totp.js";

const SIX_DIGIT_PATTERN = /^[0-9]{6}$/;
const RECOVERY_CODE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

describe("Task 1 — TOTP & Recovery Codes Primitive (D-EX)", () => {
  it("base32 encodes and decodes correctly", () => {
    const buf = Buffer.from("Hello World 12345");
    const encoded = base32Encode(buf);
    const decoded = base32Decode(encoded);
    expect(decoded.toString("utf8")).toBe("Hello World 12345");
  });

  it("generates and verifies valid TOTP codes across 30s window", () => {
    const secret = generateTotpSecret();
    expect(secret).toHaveLength(32);

    const now = Date.now();
    const code = generateTotpCode(secret, now);
    expect(code).toMatch(SIX_DIGIT_PATTERN);

    expect(verifyTotpCode(code, secret, now)).toBe(true);
    // In same 30s window
    expect(verifyTotpCode(code, secret, now + 10_000)).toBe(true);
    // Outside 30s window windowSteps=1 (allow +/- 30s)
    expect(verifyTotpCode(code, secret, now + 120_000)).toBe(false);
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

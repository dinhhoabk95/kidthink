import { describe, expect, it } from "vitest";
import {
  generateSecureToken,
  hashPassword,
  hashSecureToken,
  validatePasswordStrength,
  verifyPassword,
} from "#src/password";

describe("password utilities (BR-REG-05, BR-EVF-01, BR-PWR-02, BR-PWR-08)", () => {
  it("validates password strength according to BR-REG-05", () => {
    // Under 8 chars -> invalid
    expect(validatePasswordStrength("short").valid).toBe(false);
    expect(validatePasswordStrength("short").reason).toContain("8");

    // Common passwords -> invalid
    expect(validatePasswordStrength("12345678").valid).toBe(false);
    expect(validatePasswordStrength("password").valid).toBe(false);

    // >= 8 chars, simple text ("chuoixanh123") -> valid (no special char required!)
    expect(validatePasswordStrength("chuoixanh123").valid).toBe(true);
    expect(validatePasswordStrength("mysecretpassword").valid).toBe(true);
  });

  it("hashes and verifies password correctly", async () => {
    const pass = "chuoixanh123";
    const hash = await hashPassword(pass);

    expect(hash).toContain("$argon2id$");
    expect(await verifyPassword(pass, hash)).toBe(true);
    expect(await verifyPassword("wrongpassword", hash)).toBe(false);
  });

  it("generates 32-byte base64url token and hashes it via sha256", () => {
    const token = generateSecureToken();
    expect(token).toHaveLength(43); // 32 bytes base64url ~43 chars

    const tokenHash = hashSecureToken(token);
    expect(tokenHash).toHaveLength(64); // sha256 hex
    expect(tokenHash).not.toEqual(token);
  });
});

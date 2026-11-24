import { pbkdf2Sync } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  generateSecureToken,
  getDummyPasswordHash,
  hashPassword,
  hashSecureToken,
  PBKDF2_ITERATIONS,
  validatePasswordStrength,
  verifyPassword,
} from "#src/password";

const ARGON2_HASH =
  "$argon2id$v=19$m=19456,p=1,t=2$Zmx0piJSIcdd2b8oaF8ZUg$U60ArJk0sNteiIdlfZyr7G0shEXA+IqCyWIKs1La4WE";

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

  it("hashes and verifies password correctly (luôn PBKDF2)", async () => {
    const pass = "chuoixanh123";
    const hash = await hashPassword(pass);

    expect(hash.startsWith(`pbkdf2$${PBKDF2_ITERATIONS}$`)).toBe(true);
    expect(await verifyPassword(pass, hash)).toBe(true);
    expect(await verifyPassword("wrongpassword", hash)).toBe(false);
  });

  it("hash PBKDF2 di động: tự tính lại bằng node:crypto khớp, và hash do node:crypto tạo verify được", async () => {
    const pass = "chuoixanh123";
    const hash = await hashPassword(pass);
    const [, iterations, saltHex, hashHex] = hash.split("$");
    expect(
      pbkdf2Sync(
        pass,
        Buffer.from(saltHex ?? "", "hex"),
        Number(iterations),
        32,
        "sha256"
      ).toString("hex")
    ).toBe(hashHex);

    const salt = Buffer.from("00112233445566778899aabbccddeeff", "hex");
    const derived = pbkdf2Sync(
      pass,
      salt,
      PBKDF2_ITERATIONS,
      32,
      "sha256"
    ).toString("hex");
    const external = `pbkdf2$${PBKDF2_ITERATIONS}$${salt.toString("hex")}$${derived}`;
    expect(await verifyPassword(pass, external)).toBe(true);
  });

  describe("nhánh WebCrypto và nhánh node:crypto cho cùng một kết quả", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("hash bằng nhánh node:crypto (không có subtle) verify được bằng WebCrypto và ngược lại", async () => {
      const pass = "chuoixanh123";
      const webHash = await hashPassword(pass);

      vi.stubGlobal("crypto", {});
      const nodeHash = await hashPassword(pass);
      expect(await verifyPassword(pass, webHash)).toBe(true);
      expect(await verifyPassword("sai-mat-khau", webHash)).toBe(false);
      vi.unstubAllGlobals();

      expect(await verifyPassword(pass, nodeHash)).toBe(true);
      expect(await verifyPassword("sai-mat-khau", nodeHash)).toBe(false);
    });
  });

  it("hash argon2 không còn được hỗ trợ: verify trả false", async () => {
    expect(await verifyPassword("chuoixanh123", ARGON2_HASH)).toBe(false);
  });

  it("hash không hỗ trợ (argon2id) vẫn chạy một PBKDF2 giả để cân thời gian (BR-AUT-10)", async () => {
    const spy = vi.spyOn(globalThis.crypto.subtle, "deriveBits");
    try {
      expect(await verifyPassword("chuoixanh123", ARGON2_HASH)).toBe(false);
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
    }
  });

  it("từ chối pbkdf2 vượt trần 100.000 vòng", async () => {
    const hash = `pbkdf2$100001$${"01".repeat(16)}$${"ab".repeat(32)}`;
    expect(await verifyPassword("bat-ky", hash)).toBe(false);
  });

  it("dummy hash là PBKDF2 ở mọi runtime", () => {
    expect(getDummyPasswordHash().startsWith("pbkdf2$")).toBe(true);
  });

  it("generates 32-byte base64url token and hashes it via sha256", () => {
    const token = generateSecureToken();
    expect(token).toHaveLength(43); // 32 bytes base64url ~43 chars

    const tokenHash = hashSecureToken(token);
    expect(tokenHash).toHaveLength(64); // sha256 hex
    expect(tokenHash).not.toEqual(token);
  });
});

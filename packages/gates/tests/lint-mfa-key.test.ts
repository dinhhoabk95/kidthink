import { describe, expect, it } from "vitest";
import type { FileItem } from "#src/lint-lib/codebase-files";
import { runMfaKeyGate, scanMfaKeyCustody } from "#src/lint-mfa-key";

const BR_MFA_13_RE = /BR-MFA-13 VIOLATION/;

describe("BR-MFA-13: MFA key custody gate", () => {
  it("passes when call site uses getMfaEncryptionKey()", () => {
    const files: FileItem[] = [
      {
        filePath: "apps/web/server/api/users/mfa/setup.post.ts",
        content: `
          const encryptedSecret = encryptTotpSecret(secret, getMfaEncryptionKey());
        `,
      },
      {
        filePath: "apps/web/server/api/guest/auth/managers/mfa.post.ts",
        content: `
          const secret = decryptTotpSecret(
            mfaSetting.secretEncrypted,
            getMfaEncryptionKey()
          );
        `,
      },
    ];

    expect(() => scanMfaKeyCustody(files)).not.toThrow();
  });

  it("RED fixture: fails when call site passes a different key", () => {
    const files: FileItem[] = [
      {
        filePath: "apps/web/server/api/guest/auth/managers/mfa-bad.post.ts",
        content: `
          const secret = decryptTotpSecret(
            mfaSetting.secretEncrypted,
            process.env.ADMIN_JWT_SECRET
          );
        `,
      },
    ];

    expect(() => scanMfaKeyCustody(files)).toThrowError(BR_MFA_13_RE);
  });

  it("RED fixture: fails when call site uses inline requireEnv", () => {
    const files: FileItem[] = [
      {
        filePath: "apps/web/server/api/users/mfa/setup-bad.post.ts",
        content: `
          const encrypted = encryptTotpSecret(secret, requireEnv("MFA_ENCRYPTION_KEY"));
        `,
      },
    ];

    expect(() => scanMfaKeyCustody(files)).toThrowError(BR_MFA_13_RE);
  });

  it("ignores packages/ (encryption primitives live there)", () => {
    const files: FileItem[] = [
      {
        filePath: "packages/auth/tests/totp.test.ts",
        content: `
          const stored = encryptTotpSecret("JBSWY3DPEHPK3PXP", "a".repeat(32));
        `,
      },
    ];

    expect(() => scanMfaKeyCustody(files)).not.toThrow();
  });
});

describe("Cổng lint:mfa-key trên repo thật (BR-MFA-13)", () => {
  it("mọi call site dùng getMfaEncryptionKey()", () => {
    expect(() => runMfaKeyGate()).not.toThrow();
  });
});

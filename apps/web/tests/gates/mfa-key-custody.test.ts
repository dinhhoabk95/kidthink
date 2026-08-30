import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { scanMfaKeyCustody } from "./mfa-key-custody.ts";

const EMPTY_DIR_RE = /rỗng/;

function tempFile(name: string, body: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mfa-gate-"));
  fs.writeFileSync(path.join(dir, name), body);
  return dir;
}

describe("BR-MFA-13 — khoá TOTP đi qua đúng một helper", () => {
  it("mọi call site trong apps/web/server đều dùng getMfaEncryptionKey()", () => {
    const serverDir = path.resolve(import.meta.dirname, "../../server");
    expect(scanMfaKeyCustody(serverDir)).toEqual([]);
  });

  it("ca âm: truyền khoá thô thì đỏ", () => {
    // Đây là hình dạng mà `mfa.md` §7 mô tả là hỏng IM LẶNG: GCM chỉ nổ khi
    // auth tag sai, còn sai khoá thì cho ra bản rõ khác mà không báo gì.
    const dir = tempFile(
      "bad.ts",
      "const s = decryptTotpSecret(row.secret, process.env.SOME_KEY);\n"
    );
    const violations = scanMfaKeyCustody(dir);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.reason).toContain("BR-MFA-13");
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("ca âm: encrypt cũng bị bắt, không chỉ decrypt", () => {
    const dir = tempFile(
      "bad-encrypt.ts",
      'const e = encryptTotpSecret(secret, "hard-coded-key");\n'
    );
    expect(scanMfaKeyCustody(dir)).toHaveLength(1);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("chấp nhận lời gọi bị xuống dòng", () => {
    const dir = tempFile(
      "ok-multiline.ts",
      "const s = decryptTotpSecret(\n  row.secret,\n  getMfaEncryptionKey()\n);\n"
    );
    expect(scanMfaKeyCustody(dir)).toEqual([]);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("ca âm: thư mục rỗng thì NÉM, không xanh giả", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mfa-gate-empty-"));
    expect(() => scanMfaKeyCustody(dir)).toThrow(EMPTY_DIR_RE);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

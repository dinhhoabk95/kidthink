import fs from "node:fs";
import path from "node:path";

export interface KeyCustodyViolation {
  file: string;
  line: number;
  snippet: string;
  reason: string;
}

const TS_FILE_REGEX = /\.ts$/;
const CRYPTO_CALL_REGEX = /\b(encryptTotpSecret|decryptTotpSecret)\s*\(/;
const APPROVED_KEY_REGEX = /getMfaEncryptionKey\s*\(\s*\)/;

/** Số dòng tối đa sau lời gọi còn được coi là cùng một biểu thức. */
const CALL_SPAN_LINES = 6;

/**
 * `BR-MFA-13` — mọi call site của `encryptTotpSecret` / `decryptTotpSecret`
 * phải truyền khoá từ `getMfaEncryptionKey()`.
 *
 * Vì sao luật này cần một **phép quét tĩnh** chứ không phải một unit test:
 * `mfa.md` §7 nói rõ "Sai khoá cho ra bản rõ khác mà không báo lỗi — GCM auth
 * tag chỉ nổ khi tag sai". Một call site truyền nhầm khoá hỏng **im lặng**, nên
 * không có phép thử hành vi nào bắt được nó; chỉ có việc đọc mọi call site.
 *
 * Phép quét này từng sống ở `packages/gates/src/lint-mfa-key.ts` và bị xoá cùng
 * cả package ngày 2026-08-29. Danh sách rule bị mất trong
 * `112-gates-package-removal-plan.md` §4 **không nhắc tới `BR-MFA-13`**, nên
 * lần review việc gỡ đó chưa từng nhìn thấy mất mát này.
 */
export function scanMfaKeyCustody(targetDir: string): KeyCustodyViolation[] {
  if (!fs.existsSync(targetDir)) {
    throw new Error(`Không có thư mục để quét: ${targetDir}`);
  }

  const entries = fs.readdirSync(targetDir, {
    recursive: true,
    withFileTypes: true,
  });
  const files = entries
    .filter((e) => e.isFile() && TS_FILE_REGEX.test(e.name))
    .map((e) => path.join(e.parentPath || targetDir, e.name));

  if (files.length === 0) {
    throw new Error(`Thư mục rỗng, không có file .ts nào: ${targetDir}`);
  }

  const violations: KeyCustodyViolation[] = [];

  for (const filePath of files) {
    const lines = fs.readFileSync(filePath, "utf-8").split("\n");

    lines.forEach((line, index) => {
      if (!CRYPTO_CALL_REGEX.test(line)) {
        return;
      }
      // Đối số khoá thường nằm ở dòng sau khi lời gọi bị xuống dòng, nên xét
      // một cửa sổ nhỏ thay vì đúng một dòng.
      const window = lines.slice(index, index + CALL_SPAN_LINES).join("\n");

      if (!APPROVED_KEY_REGEX.test(window)) {
        violations.push({
          file: filePath,
          line: index + 1,
          snippet: line.trim(),
          reason:
            "BR-MFA-13: call site phải truyền khoá từ getMfaEncryptionKey(); sai khoá hỏng im lặng",
        });
      }
    });
  }

  return violations;
}

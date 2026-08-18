import fs from "node:fs";
import path from "node:path";

const SKIP_DIR =
  /(^|\/)(node_modules|\.nuxt|\.output|dist|coverage|\.git)(\/|$)/;
const TEST_PATH = /(^|\/)tests?(\/|$)|\.test\.ts$|\.spec\.ts$/;
const SOURCE_FILE = /\.(ts|vue)$/;

/** Đi hết cây, bỏ thư mục sinh ra và thư mục phụ thuộc. */
export function walkSource(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir) || SKIP_DIR.test(dir)) {
    return out;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (SKIP_DIR.test(full)) {
      continue;
    }
    if (entry.isDirectory()) {
      walkSource(full, out);
    } else if (SOURCE_FILE.test(full)) {
      out.push(full);
    }
  }
  return out;
}

export function isTestPath(file: string): boolean {
  return TEST_PATH.test(file);
}

/**
 * Bỏ comment và nội dung chuỗi để phép đếm không bắt chữ trong văn xuôi.
 *
 * ❌ NEVER đếm trực tiếp trên nguồn thô: "as" xuất hiện trong tiếng Anh và
 * tiếng Việt ("phase", "as long as", tên biến), và `any` xuất hiện trong
 * "company", "many". Bản đo đầu tiên của cổng này lệch 149 → 0 vì lý do đó.
 */
export function stripCommentsAndStrings(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:\\])\/\/[^\n]*/g, "$1 ")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''");
}

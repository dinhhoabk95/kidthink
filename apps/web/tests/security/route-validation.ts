/**
 * SECURITY-CHECKLIST `BR-SEC-04` — route `/api/*` đọc body thì phải Zod parse
 * body trong cùng file.
 *
 * Trước đây helper này sống ở `packages/gates`. Package đó đã bị gỡ; cổng duy
 * nhất còn giữ lại là cổng bảo mật này, nên nó về ở cạnh test sở hữu nó.
 *
 * Phạm vi: **body**. Query và param không được cổng này đo.
 */
import fs from "node:fs";
import path from "node:path";

const API_ROOT = path.resolve(import.meta.dirname, "../../server/api");

const SKIP_DIR =
  /(^|\/)(node_modules|\.nuxt|\.output|dist|coverage|\.git)(\/|$)/;
const SOURCE_FILE = /\.(ts|vue)$/;

/** Đọc body thô — sau đây BẮT BUỘC có parse. */
const READS_BODY = /\breadBody\s*\(|\breadRequestBody\s*\(|\breadRawBody\s*\(/;

/**
 * Bằng chứng đã validate. `readValidatedBody` tự parse nên tính luôn.
 * `.parse(` bắt cả `schema.parse(raw)` và `z.object({...}).parse(raw)`.
 */
const VALIDATES =
  /\.safeParse\s*\(|\.parse\s*\(|\breadValidatedBody\s*\(|\bparseChildProfileInput\s*\(|\bthrowValidationError\s*\(/;

/** Route webhook nhận payload đã ký, parse ở service — có ghi lý do trong file. */
const EXEMPT_MARKER = /route-validation:\s*exempt\s+—/;

function walkSource(dir: string, out: string[] = []): string[] {
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

/**
 * Bỏ comment và nội dung chuỗi để phép đo không bắt chữ trong văn xuôi.
 *
 * ❌ NEVER đo trực tiếp trên nguồn thô: tên hàm được nhắc trong comment sẽ tính
 * là bằng chứng validate và làm cổng xanh giả.
 */
function stripCommentsAndStrings(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:\\])\/\/[^\n]*/g, "$1 ")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''");
}

export interface RouteFinding {
  readonly file: string;
  readonly reason: string;
}

export function findUnvalidatedRoutes(
  roots: readonly string[] = [API_ROOT]
): RouteFinding[] {
  const findings: RouteFinding[] = [];
  for (const root of roots) {
    for (const file of walkSource(root)) {
      const raw = fs.readFileSync(file, "utf8");
      if (EXEMPT_MARKER.test(raw)) {
        continue;
      }
      const code = stripCommentsAndStrings(raw);
      if (!READS_BODY.test(code)) {
        continue;
      }
      if (VALIDATES.test(code)) {
        continue;
      }
      findings.push({
        file: file.split(path.sep).join("/"),
        reason: "đọc body nhưng không Zod parse trong cùng file",
      });
    }
  }
  return findings;
}

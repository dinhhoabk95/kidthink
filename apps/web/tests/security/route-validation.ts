/**
 * SECURITY-CHECKLIST `BR-SEC-04` — route `/api/*` đọc body, query hoặc params
 * thì phải validate đầu vào bằng Zod (hoặc helper validate chuẩn) trong cùng file.
 *
 * Trước đây helper này sống ở `packages/gates`. Package đó đã bị gỡ; cổng duy
 * nhất còn giữ lại là cổng bảo mật này, nên nó về ở cạnh test sở hữu nó.
 *
 * Phạm vi: **body**, **query**, **params** (`BR-SEC-04`).
 */
import fs from "node:fs";
import path from "node:path";

const API_ROOT = path.resolve(import.meta.dirname, "../../server/api");

const SKIP_DIR =
  /(^|\/)(node_modules|\.nuxt|\.output|dist|coverage|\.git)(\/|$)/;
const SOURCE_FILE = /\.(ts|vue)$/;

/** Đọc body thô — sau đây BẮT BUỘC có parse. */
const READS_BODY = /\breadBody\s*\(|\breadRequestBody\s*\(|\breadRawBody\s*\(/;

/** Đọc query thô — sau đây BẮT BUỘC có parse. */
const READS_QUERY = /\bgetQuery\s*\(|\breadRequestQuery\s*\(/;

/** Đọc router params thô — sau đây BẮT BUỘC có parse hoặc guard. */
const READS_PARAMS = /\bgetRouterParam\s*\(|\bgetRouterParams\s*\(/;

/**
 * Bằng chứng đã validate body. `readValidatedBody` tự parse nên tính luôn.
 */
const VALIDATES_BODY =
  /\.safeParse\s*\(|\bbody:\s*[a-zA-Z0-9_]+|\breadValidatedBody\s*\(|\bparseChildProfileInput\s*\(|\bparsePaymentWebhookBody\s*\(|\bthrowValidationError\s*\(/;

/**
 * Bằng chứng đã validate query (Zod `.safeParse`, `getValidatedQuery`, hoặc
 * service validator nhận nguyên `query` và chạy Zod `.safeParse` bên trong).
 */
const VALIDATES_QUERY =
  /\.safeParse\s*\(|\bquery:\s*[a-zA-Z0-9_]+|\bgetValidatedQuery\s*\(|\bsearchGameLevels\s*\(|\bsearchLessons\s*\(|\bsearchActivities\s*\(|\blistWorksheets\s*\(|\blistCustomGames\s*\(|\bparseExportDateRange\s*\(|\bvalidateAuditDateRange\s*\(|\bparseAndValidateState\s*\(/;

/**
 * Bằng chứng đã validate router params (Zod `.safeParse`, `getValidatedRouterParams`,
 * hoặc kiểm tra bắt buộc tham số đường dẫn trước khi truy vấn).
 */
const VALIDATES_PARAMS =
  /\.safeParse\s*\(|\bparams:\s*[a-zA-Z0-9_]+|\bgetValidatedRouterParams\s*\(|if\s*\(\s*!\s*\(?[a-zA-Z0-9_]+|\bthrowValidationError\s*\(|\bValidationError\b|\bNotFoundError\b/;

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
export function stripCommentsAndStrings(source: string): string {
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

function inspectRouteFile(file: string, findings: RouteFinding[]): void {
  const raw = fs.readFileSync(file, "utf8");
  if (EXEMPT_MARKER.test(raw)) {
    return;
  }
  const code = stripCommentsAndStrings(raw);
  const normalizedFile = file.split(path.sep).join("/");

  if (READS_BODY.test(code) && !VALIDATES_BODY.test(code)) {
    findings.push({
      file: normalizedFile,
      reason: "đọc body nhưng không Zod parse trong cùng file",
    });
  }
  if (READS_QUERY.test(code) && !VALIDATES_QUERY.test(code)) {
    findings.push({
      file: normalizedFile,
      reason: "đọc query nhưng không Zod parse trong cùng file",
    });
  }
  if (READS_PARAMS.test(code) && !VALIDATES_PARAMS.test(code)) {
    findings.push({
      file: normalizedFile,
      reason: "đọc params nhưng không validate trong cùng file",
    });
  }
}

export function findUnvalidatedRoutes(
  roots: readonly string[] = [API_ROOT]
): RouteFinding[] {
  const findings: RouteFinding[] = [];
  for (const root of roots) {
    for (const file of walkSource(root)) {
      inspectRouteFile(file, findings);
    }
  }
  return findings;
}

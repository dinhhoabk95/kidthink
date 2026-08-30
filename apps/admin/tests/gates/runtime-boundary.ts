import fs from "node:fs";
import path from "node:path";

export interface BoundaryViolation {
  file: string;
  line: number;
  snippet: string;
  reason: string;
}

const CODE_FILE_REGEX = /\.(vue|ts|js)$/;
const NATIVE_FETCH_REGEX = /(?<!api)fetch\s*\(\s*["'`]\/api\//;

/** URL `/api/…` dựng bằng nội suy, ví dụ `` `${base}/api/x` `` — cũng bỏ qua apiUrl(). */
const INTERPOLATED_API_REGEX = /\$\{[^}]*\}\/api\//;

export interface AuthGuardResult {
  ok: boolean;
  reason?: string;
}

/**
 * `BR-ARB-04` phần guard: admin dùng **một** middleware toàn cục, không phải
 * `definePageMeta({ middleware: "auth" })` trên từng trang.
 *
 * Luật cũ ở đây kiểm sai mô hình và tự vô hiệu hoá:
 *
 * ```ts
 * const hasAuthGuard = content.includes("definePageMeta") && (… || content.includes("auth"));
 * if (!(hasAuthGuard || content.includes("definePageMeta"))) { … }
 * ```
 *
 * `hasAuthGuard` đã đòi `definePageMeta`, nên cả biểu thức rút gọn thành
 * `includes("definePageMeta")`: cổng chỉ báo khi thiếu **chuỗi** đó, Cấm — NEVER
 * kiểm guard. Và vì Cấm — NEVER có trang admin nào khai `middleware`, phép thử
 * "codebase thật không vi phạm" xanh **nhờ** luật chết. Sửa đúng là kiểm thứ
 * thật sự bảo vệ app: middleware toàn cục.
 */
export function checkGlobalAuthGuard(middlewareDir: string): AuthGuardResult {
  if (!fs.existsSync(middlewareDir)) {
    return {
      ok: false,
      reason: `BR-ARB-04: không có thư mục middleware ở ${middlewareDir}`,
    };
  }
  const globals = fs
    .readdirSync(middlewareDir)
    .filter((name) => name.includes(".global."));

  if (globals.length === 0) {
    return {
      ok: false,
      reason:
        "BR-ARB-04: admin không có middleware `.global.` nào — mọi trang đều không được bảo vệ",
    };
  }

  const guardsAuth = globals.some((name) => {
    const body = fs.readFileSync(path.join(middlewareDir, name), "utf-8");
    return (
      body.includes('navigateTo("/login")') ||
      body.includes("navigateTo('/login')")
    );
  });

  return guardsAuth
    ? { ok: true }
    : {
        ok: false,
        reason:
          "BR-ARB-04: middleware toàn cục không đưa phiên chưa đăng nhập về /login",
      };
}

/** Bốn luật `BR-ARB-04` trên một dòng. Trả về lý do cho từng luật bị vi phạm. */
function findLineViolations(trimmed: string): string[] {
  const reasons: string[] = [];
  const wrapped = trimmed.includes("apiUrl(");

  if (NATIVE_FETCH_REGEX.test(trimmed) && !trimmed.includes("apiFetch")) {
    reasons.push(
      "BR-ARB-04: Direct fetch to /api/ forbidden. Use apiUrl() or useApiClient() / apiFetch()"
    );
  }

  const opensApi =
    trimmed.includes("window.open('/api/") ||
    trimmed.includes('window.open("/api/') ||
    trimmed.includes("window.open(`/api/");
  if (opensApi && !wrapped) {
    reasons.push(
      "BR-ARB-04: window.open with direct /api/ forbidden. Wrap with apiUrl()"
    );
  }

  // Dạng nội suy — checklist Task #129 khai là có ca âm, thực tế Cấm — NEVER
  // được kiểm.
  if (INTERPOLATED_API_REGEX.test(trimmed) && !wrapped) {
    reasons.push("BR-ARB-04: URL /api/ dựng bằng nội suy phải đi qua apiUrl()");
  }

  const hrefApi =
    trimmed.includes('href="/api/') ||
    trimmed.includes("href='/api/") ||
    trimmed.includes(':href="`/api/');
  if (hrefApi && !wrapped) {
    reasons.push(
      "BR-ARB-04: Direct /api/ URL in href/src forbidden. Wrap with apiUrl()"
    );
  }

  return reasons;
}

export function scanRuntimeBoundary(targetDir: string): BoundaryViolation[] {
  if (!fs.existsSync(targetDir)) {
    throw new Error(`Target directory does not exist: ${targetDir}`);
  }

  const entries = fs.readdirSync(targetDir, {
    recursive: true,
    withFileTypes: true,
  });
  const codeFiles = entries
    .filter((e) => e.isFile() && CODE_FILE_REGEX.test(e.name))
    .map((e) => path.join(e.parentPath || targetDir, e.name));

  if (codeFiles.length === 0) {
    throw new Error(
      `Target directory is empty or contains no code files: ${targetDir}`
    );
  }

  const violations: BoundaryViolation[] = [];

  for (const filePath of codeFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      for (const reason of findLineViolations(line.trim())) {
        violations.push({
          file: filePath,
          line: index + 1,
          snippet: line.trim(),
          reason,
        });
      }
    });
  }

  return violations;
}

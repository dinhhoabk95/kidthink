import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";

/**
 * `BR-APM-08` (+ `BR-APM-01`) — cạnh `pending|pending_proof → approved|under_review`
 * chỉ mở cho nguồn `verified_gateway_webhook`. Tham số `source` là input tường
 * minh của `canTransitionPaymentOrderStatus` / `assertPaymentOrderTransition`,
 * nên máy trạng thái **không tự biết** chữ ký đã được xác minh hay chưa. Cổng
 * này giữ hai bất biến bằng cách đọc nguồn thật:
 *
 * 1. Chuỗi nguồn webhook chỉ xuất hiện ở nơi định nghĩa (máy trạng thái) và ở
 *    service xử lý webhook. Một route duyệt tay truyền nguồn này là vượt
 *    `BR-PAY-01`.
 * 2. Service xử lý webhook chỉ được gọi từ route webhook — nơi xác minh chữ ký
 *    raw-body, livemode và merchant ID trước khi gọi.
 */

export interface TransitionSourceViolation {
  file: string;
  line: number;
  snippet: string;
  reason: string;
}

export interface SourceFile {
  /** Đường dẫn tương đối từ gốc repo, phân cách `/`. */
  path: string;
  text: string;
}

const SOURCE_LITERAL_RE = /verified_gateway_webhook/;
const SERVICE_CALL_RE = /\bprocessAutomatedPaymentWebhook\s*\(/;
const SERVICE_DEFINITION_RE = /function\s+processAutomatedPaymentWebhook\s*\(/;

export const SOURCE_LITERAL_ALLOWED: readonly string[] = [
  "packages/shared/src/payment-state-machine.ts",
  "apps/web/server/services/automated-payment.ts",
];

export const SERVICE_CALL_ALLOWED: readonly string[] = [
  "apps/web/server/api/guest/webhooks/payments/[provider].post.ts",
];

const SCAN_ROOTS: readonly string[] = ["apps", "packages"];
const SKIP_DIRS: ReadonlySet<string> = new Set([
  "node_modules",
  ".nuxt",
  ".output",
  "dist",
  "tests",
  "coverage",
]);
const EXTENSION_RE = /\.(ts|vue|js|mjs)$/;

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        walk(join(dir, entry.name), out);
      }
    } else if (entry.isFile() && EXTENSION_RE.test(entry.name)) {
      out.push(join(dir, entry.name));
    }
  }
}

/** Đọc mọi file nguồn production dưới `apps/` và `packages/` (bỏ `tests/`). */
export function collectProductionSources(
  root: string = REPO_ROOT
): SourceFile[] {
  const files: string[] = [];
  for (const scanRoot of SCAN_ROOTS) {
    walk(join(root, scanRoot), files);
  }
  if (files.length === 0) {
    throw new Error(`Không có file nguồn nào để quét dưới ${root}`);
  }
  return files.map((file) => ({
    path: relative(root, file).split(sep).join("/"),
    text: readFileSync(file, "utf8"),
  }));
}

export function scanTransitionSource(
  files: readonly SourceFile[]
): TransitionSourceViolation[] {
  const violations: TransitionSourceViolation[] = [];
  for (const file of files) {
    const lines = file.text.split("\n");
    lines.forEach((line, index) => {
      if (
        SOURCE_LITERAL_RE.test(line) &&
        !SOURCE_LITERAL_ALLOWED.includes(file.path)
      ) {
        violations.push({
          file: file.path,
          line: index + 1,
          snippet: line.trim(),
          reason:
            "BR-APM-08: chỉ service webhook đã xác minh chữ ký được dùng nguồn verified_gateway_webhook",
        });
      }
      if (
        SERVICE_CALL_RE.test(line) &&
        !SERVICE_DEFINITION_RE.test(line) &&
        !SERVICE_CALL_ALLOWED.includes(file.path)
      ) {
        violations.push({
          file: file.path,
          line: index + 1,
          snippet: line.trim(),
          reason:
            "BR-APM-01: processAutomatedPaymentWebhook chỉ được gọi từ route webhook đã xác minh chữ ký",
        });
      }
    });
  }
  return violations;
}

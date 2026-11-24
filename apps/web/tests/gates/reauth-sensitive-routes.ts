import { existsSync, readFileSync } from "node:fs";
import { repoPath } from "@mindkid/config/paths";

/**
 * Cổng reauth — mọi route nhạy cảm phải gọi `requireReauth(event)` (cửa sổ 5
 * phút, `BR-AUT-13`). Reauth từng có cổng quét riêng nằm trong `packages/auth`
 * (`reauth-routes.ts`) và bị gỡ cùng các export chết ở `9ce1c7a6`; không còn gì
 * đo việc một route nhạy cảm mới/đổi tên quên gọi `requireReauth`.
 *
 * Danh sách đóng: thêm route nhạy cảm thì thêm dòng ở đây cùng commit.
 */
export interface SensitiveRoute {
  /** Đường dẫn tương đối từ gốc repo, phân cách `/`. */
  readonly path: string;
  /** Rule sở hữu yêu cầu reauth của route này. */
  readonly rule: string;
}

const API_DIR = "apps/web/server/api";

export const SENSITIVE_ROUTES: readonly SensitiveRoute[] = [
  { path: `${API_DIR}/users/password.post.ts`, rule: "BR-ACS-01" },
  { path: `${API_DIR}/users/password.put.ts`, rule: "BR-ACS-01" },
  { path: `${API_DIR}/users/email.post.ts`, rule: "BR-ACS-03" },
  { path: `${API_DIR}/users/account/delete.post.ts`, rule: "BR-ADL-03" },
  {
    path: `${API_DIR}/users/social-identities/[provider].delete.ts`,
    rule: "BR-SLK-01",
  },
  {
    path: `${API_DIR}/managers/orders/[uuid]/approve.post.ts`,
    rule: "BR-ADA-09",
  },
  {
    path: `${API_DIR}/managers/orders/[uuid]/reject.post.ts`,
    rule: "BR-ADA-09",
  },
  {
    path: `${API_DIR}/managers/feature-flags/[key].patch.ts`,
    rule: "BR-ADA-09",
  },
  {
    path: `${API_DIR}/managers/subscriptions/[id]/cancel.post.ts`,
    rule: "BR-ADA-09",
  },
  { path: `${API_DIR}/managers/audit-logs/export.get.ts`, rule: "BR-ADA-09" },
  {
    path: `${API_DIR}/managers/legal-consent-forces/index.post.ts`,
    rule: "BR-ADA-09",
  },
];

export interface ReauthViolation {
  readonly file: string;
  readonly rule: string;
  readonly reason: string;
}

export interface RouteSource {
  readonly path: string;
  readonly rule: string;
  /** `null` khi file không tồn tại (đổi tên/xoá mà quên cập nhật danh sách). */
  readonly text: string | null;
}

const BLOCK_COMMENT_RE = /\/\*[\s\S]*?\*\//g;
const LINE_COMMENT_RE = /\/\/.*$/gm;
const REAUTH_CALL_RE = /\brequireReauth\s*\(/;

function stripComments(text: string): string {
  return text.replace(BLOCK_COMMENT_RE, "").replace(LINE_COMMENT_RE, "");
}

/** Đọc nguồn thật của từng route trong danh sách. */
export function readSensitiveRoutes(
  routes: readonly SensitiveRoute[] = SENSITIVE_ROUTES
): RouteSource[] {
  return routes.map((route) => {
    const abs = repoPath(...route.path.split("/"));
    return {
      ...route,
      text: existsSync(abs) ? readFileSync(abs, "utf8") : null,
    };
  });
}

export function scanReauthRoutes(
  sources: readonly RouteSource[]
): ReauthViolation[] {
  const violations: ReauthViolation[] = [];
  for (const source of sources) {
    if (source.text === null) {
      violations.push({
        file: source.path,
        rule: source.rule,
        reason: `${source.rule}: route trong danh sách nhạy cảm không còn tồn tại — cập nhật danh sách cùng lúc đổi tên/xoá route`,
      });
      continue;
    }
    if (!REAUTH_CALL_RE.test(stripComments(source.text))) {
      violations.push({
        file: source.path,
        rule: source.rule,
        reason: `${source.rule}: route nhạy cảm phải gọi requireReauth(event) (BR-AUT-13, cửa sổ 5 phút)`,
      });
    }
  }
  return violations;
}

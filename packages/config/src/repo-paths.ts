import path from "node:path";

/**
 * Gốc monorepo, suy ra từ vị trí file này (`packages/config/src` → lên 3 cấp).
 *
 * Chỉ dành cho **tooling** — cổng chất lượng và script vận hành cần địa chỉ
 * tuyệt đối của repo vì `process.cwd()` đổi theo chỗ gọi: vitest chạy với cwd là
 * thư mục workspace, `pnpm --filter` cũng vậy. Code runtime của app ❌ NEVER
 * import file này (bundle không có cây repo).
 */
export const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..");

export function repoPath(...segments: string[]): string {
  return path.join(REPO_ROOT, ...segments);
}

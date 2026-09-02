import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { COMPETENCY_CATALOG } from "@mindkid/shared";

/**
 * `BR-LND-09` — bề mặt công khai Cấm — NEVER viết cứng nhãn năng lực hay số
 * lượng nội dung.
 *
 * Trước task 165 repo có **sáu** bảng nhãn viết tay (public-seo, footer, danh
 * mục game, sảnh chơi API, sảnh chơi trang, program-showcase) mang hai bộ từ
 * vựng khác nhau, cả hai đều là taxonomy toán v1 đã bỏ; và ba chỗ in số cứng
 * (24 · 48 · 48, "120+", "60+") trong khi DB có 60 · 84 · 95 và 239.
 *
 * Cổng bắt hai dấu hiệu:
 *
 * 1. **Nhãn lạ** — chuỗi khớp khuôn "X & Y" trong ngoặc kép hoặc trong text
 *    của template mà không phải tên trong `COMPETENCY_CATALOG`, ở gần một mã
 *    `C1`–`C6`. Nhãn v1 đều mang dấu `&`, nên khuôn này đủ hẹp để không bắt
 *    nhầm văn xuôi.
 * 2. **Số lượng cứng** — literal dạng `120+ trò chơi` hoặc `48 trò chơi`.
 */

export interface CompetencyLabelViolation {
  file: string;
  line: number;
  snippet: string;
  reason: string;
}

const EXTENSION_REGEX = /\.(vue|ts)$/;
const SKIP_DIR_REGEX = /^(node_modules|\.nuxt|\.output|dist|fixtures)$/;

/** Tên hợp lệ, lấy thẳng từ nguồn duy nhất. */
const ALLOWED_NAMES = new Set(COMPETENCY_CATALOG.map((entry) => entry.name));

/** `"Số & Lượng"` · `>Đo lường & Đại lượng<` — nhãn hai vế nối bằng `&`. */
const AMPERSAND_LABEL_REGEX =
  /["'>]\s*([A-ZĐÀ-Ỹ][^"'<>&]{1,24}&[^"'<>&]{1,24}?)\s*["'<]/gu;

/**
 * `120+ trò chơi` · `48 trò chơi` — số lượng **cỡ thư viện** viết cứng.
 *
 * Chỉ bắt số có hậu tố `+` hoặc từ hai chữ số trở lên. Câu như "tương đương
 * 2–3 trò chơi" trong FAQ nói về thời lượng chơi, không phải kích thước kho —
 * bắt cả nó thì cổng thành tiếng ồn và người ta sẽ tắt.
 */
const HARDCODED_COUNT_REGEX = /\b(?:\d{1,4}\+|\d{2,4})\s*trò chơi/gu;

/** Mã năng lực ở gần thì chuỗi `&` mới được coi là nhãn năng lực. */
const COMPETENCY_CODE_REGEX = /\bC[1-6]\b(?![-.])/u;

/** Số dòng quanh chuỗi còn được coi là cùng một bảng nhãn. */
const CODE_PROXIMITY_LINES = 3;

function hasNearbyCompetencyCode(lines: string[], index: number): boolean {
  const from = Math.max(0, index - CODE_PROXIMITY_LINES);
  const to = Math.min(lines.length - 1, index + CODE_PROXIMITY_LINES);
  for (let i = from; i <= to; i++) {
    if (COMPETENCY_CODE_REGEX.test(lines[i] ?? "")) {
      return true;
    }
  }
  return false;
}

function checkLine(
  lines: string[],
  index: number,
  file: string,
  violations: CompetencyLabelViolation[]
): void {
  const line = lines[index] ?? "";

  for (const match of line.matchAll(AMPERSAND_LABEL_REGEX)) {
    const label = (match[1] ?? "").trim();
    if (ALLOWED_NAMES.has(label) || !hasNearbyCompetencyCode(lines, index)) {
      continue;
    }
    violations.push({
      file,
      line: index + 1,
      snippet: line.trim(),
      reason: `Nhãn năng lực viết cứng "${label}" — đọc COMPETENCY_CATALOG`,
    });
  }

  for (const match of line.matchAll(HARDCODED_COUNT_REGEX)) {
    violations.push({
      file,
      line: index + 1,
      snippet: line.trim(),
      reason: `Số lượng viết cứng "${match[0].trim()}" — đếm từ DB (BR-LND-09)`,
    });
  }
}

function checkFile(
  fullPath: string,
  relativePath: string,
  violations: CompetencyLabelViolation[]
): void {
  const lines = readFileSync(fullPath, "utf-8").split("\n");
  for (let i = 0; i < lines.length; i++) {
    checkLine(lines, i, relativePath, violations);
  }
}

export function scanCompetencyLabels(dir: string): CompetencyLabelViolation[] {
  const violations: CompetencyLabelViolation[] = [];
  const targetPath = isAbsolute(dir) ? dir : join(REPO_ROOT, dir);

  function walk(currentPath: string): void {
    if (!existsSync(currentPath)) {
      return;
    }
    for (const entry of readdirSync(currentPath)) {
      const fullPath = join(currentPath, entry);
      if (statSync(fullPath).isDirectory()) {
        if (!SKIP_DIR_REGEX.test(entry)) {
          walk(fullPath);
        }
      } else if (EXTENSION_REGEX.test(entry)) {
        checkFile(fullPath, fullPath.replace(`${REPO_ROOT}/`, ""), violations);
      }
    }
  }

  walk(targetPath);
  return violations;
}

/** Một file lẻ — dùng cho ca âm trên fixture. */
export function scanCompetencyLabelsInFile(
  filePath: string
): CompetencyLabelViolation[] {
  const fullPath = isAbsolute(filePath) ? filePath : join(REPO_ROOT, filePath);
  const violations: CompetencyLabelViolation[] = [];
  checkFile(fullPath, filePath, violations);
  return violations;
}

/** Ba cây nguồn từng chứa bảng nhãn hoặc số cứng. */
export const GATE_TARGETS = [
  "apps/web/app",
  "apps/web/server",
  "packages/shared/src",
];

export function runCompetencyLabelGate(): CompetencyLabelViolation[] {
  return GATE_TARGETS.flatMap((dir) => scanCompetencyLabels(dir));
}

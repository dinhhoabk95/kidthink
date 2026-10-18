import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";

/**
 * Cổng `BR-DSC-27` — `font-variant-numeric: tabular-nums` bắt buộc cho con số,
 * bộ đếm, điểm số và bảng số liệu trên các bề mặt để số nhảy không làm giật chữ
 * xung quanh và cột số thẳng hàng.
 */
export const TAILWIND_CSS_PATH = join(
  REPO_ROOT,
  "packages/ui/assets/css/tailwind.css"
);

export interface TabularNumsTargetSpec {
  readonly file: string;
  readonly description: string;
  readonly minTabularCount: number;
}

export const TABULAR_NUMS_TARGETS: readonly TabularNumsTargetSpec[] = [
  {
    file: "apps/web/app/pages/play/map.vue",
    description: "HUD tiến độ bài học và số tuần trên bản đồ hành trình",
    minTabularCount: 2,
  },
  {
    file: "apps/web/app/components/kid/victory-modal.vue",
    description: "Bộ đếm điểm thưởng và sao trên modal chiến thắng",
    minTabularCount: 1,
  },
  {
    file: "apps/web/app/components/kid/round-progress-indicator.vue",
    description: "Chỉ báo vòng chơi trên bề mặt trẻ",
    minTabularCount: 1,
  },
  {
    file: "apps/web/app/components/curriculum-progress-card.vue",
    description: "Bộ đếm tiến độ chương trình học",
    minTabularCount: 2,
  },
  {
    file: "apps/web/app/pages/me/index.vue",
    description: "Số liệu tổng quan trên trang quản lý của phụ huynh",
    minTabularCount: 2,
  },
  {
    file: "apps/web/app/pages/me/children/[uuid]/report/index.vue",
    description: "Bảng số liệu báo cáo tiến độ cơ bản",
    minTabularCount: 3,
  },
  {
    file: "apps/web/app/pages/me/children/[uuid]/report/advanced.vue",
    description: "Bảng số liệu báo cáo phân tích chuyên sâu",
    minTabularCount: 4,
  },
];

export interface TabularNumsViolation {
  readonly file: string;
  readonly reason: string;
}

const TABULAR_CSS_RULE_REGEX =
  /\.tabular-nums\s*\{[^}]*font-variant-numeric\s*:\s*tabular-nums\s*;/s;
const TABULAR_USAGE_REGEX =
  /\btabular-nums\b|font-variant-numeric\s*:\s*tabular-nums\b/g;

export function verifyTailwindTabularNumsUtility(
  cssContent: string
): TabularNumsViolation[] {
  if (!TABULAR_CSS_RULE_REGEX.test(cssContent)) {
    return [
      {
        file: "packages/ui/assets/css/tailwind.css",
        reason:
          "Thiếu utility `.tabular-nums { font-variant-numeric: tabular-nums; }` trong CSS gốc.",
      },
    ];
  }
  return [];
}

export function scanComponentTabularNums(
  content: string,
  target: TabularNumsTargetSpec
): TabularNumsViolation[] {
  const matches = content.match(TABULAR_USAGE_REGEX) ?? [];
  if (matches.length < target.minTabularCount) {
    return [
      {
        file: target.file,
        reason: `BR-DSC-27: ${target.description} cần tối thiểu ${target.minTabularCount} chỗ gắn tabular-nums, thực tế chỉ có ${matches.length}.`,
      },
    ];
  }
  return [];
}

export function runTabularNumsGate(): TabularNumsViolation[] {
  const violations: TabularNumsViolation[] = [];
  const cssContent = readFileSync(TAILWIND_CSS_PATH, "utf8");
  violations.push(...verifyTailwindTabularNumsUtility(cssContent));

  for (const target of TABULAR_NUMS_TARGETS) {
    const absPath = join(REPO_ROOT, target.file);
    const content = readFileSync(absPath, "utf8");
    violations.push(...scanComponentTabularNums(content, target));
  }

  return violations;
}

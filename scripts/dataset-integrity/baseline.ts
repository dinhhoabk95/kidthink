/**
 * Bậc thang nợ cho cổng toàn vẹn dataset (`BR-SDI-01..08`).
 *
 * Vì sao có bậc thang: 303 vi phạm thuộc `C2`–`C6` có TRƯỚC task #267 và không
 * nằm trong phạm vi sửa của nó. Nếu cổng chặn cứng thì `pnpm check` đỏ vĩnh
 * viễn và người ta sẽ gỡ cổng. Nếu cổng không có bậc thang thì nợ cũ là chỗ trốn.
 *
 * Hai lớp khoá, theo đúng lối `thinking-structure-baseline.json` đã dùng được:
 *   1. Trần tổng và trần theo năng lực — nợ chỉ được GIẢM. `C1` chốt ở 0.
 *   2. Danh sách cặp `<mã kỹ năng>|<luật>` đã biết — một cặp MỚI là vi phạm
 *      ngay cả khi tổng không tăng.
 *
 * Invariant: Strict TypeScript — NO `any`, NO `unknown`.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { IntegrityViolation } from "./rules.js";

export interface DatasetIntegrityBaseline {
  readonly max_total_violations: number;
  readonly violations_by_competency: Record<string, number>;
  readonly known_violation_keys: readonly string[];
  readonly note: string;
}

export interface BaselineBreach {
  readonly kind: "total" | "competency" | "new_key";
  readonly detail: string;
}

export function violationKey(violation: IntegrityViolation): string {
  return `${violation.skillCode}|${violation.rule}`;
}

export function competencyOf(skillCode: string): string {
  return skillCode.split(".")[0] ?? "?";
}

export function countByCompetency(
  violations: readonly IntegrityViolation[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const violation of violations) {
    const competency = competencyOf(violation.skillCode);
    counts[competency] = (counts[competency] ?? 0) + 1;
  }
  return counts;
}

export function assertBaselineShape(
  data: unknown
): asserts data is DatasetIntegrityBaseline {
  if (typeof data !== "object" || data === null) {
    throw new TypeError("[BR-SDI-00] baseline phải là một object");
  }
  const record = data as Record<string, unknown>;
  if (typeof record.max_total_violations !== "number") {
    throw new TypeError("[BR-SDI-00] thiếu max_total_violations kiểu number");
  }
  if (
    typeof record.violations_by_competency !== "object" ||
    record.violations_by_competency === null
  ) {
    throw new TypeError("[BR-SDI-00] thiếu violations_by_competency");
  }
  if (!Array.isArray(record.known_violation_keys)) {
    throw new TypeError("[BR-SDI-00] thiếu known_violation_keys kiểu mảng");
  }
}

export function readBaseline(path: string): DatasetIntegrityBaseline {
  if (!existsSync(path)) {
    throw new Error(`[BR-SDI-00] không tìm thấy baseline tại ${path}`);
  }
  const parsed: unknown = JSON.parse(readFileSync(path, "utf-8"));
  assertBaselineShape(parsed);
  return parsed;
}

export function evaluateAgainstBaseline(
  violations: readonly IntegrityViolation[],
  baseline: DatasetIntegrityBaseline
): readonly BaselineBreach[] {
  const breaches: BaselineBreach[] = [];

  if (violations.length > baseline.max_total_violations) {
    breaches.push({
      kind: "total",
      detail: `tổng vi phạm ${violations.length} vượt trần ${baseline.max_total_violations}`,
    });
  }

  const current = countByCompetency(violations);
  for (const [competency, ceiling] of Object.entries(
    baseline.violations_by_competency
  )) {
    const now = current[competency] ?? 0;
    if (now > ceiling) {
      breaches.push({
        kind: "competency",
        detail: `${competency}: ${now} vi phạm, vượt trần ${ceiling}`,
      });
    }
  }
  for (const [competency, now] of Object.entries(current)) {
    if (!(competency in baseline.violations_by_competency)) {
      breaches.push({
        kind: "competency",
        detail: `${competency}: ${now} vi phạm, năng lực chưa có trong baseline`,
      });
    }
  }

  const known = new Set(baseline.known_violation_keys);
  const newKeys = [
    ...new Set(violations.map(violationKey).filter((key) => !known.has(key))),
  ].sort();
  for (const key of newKeys) {
    breaches.push({
      kind: "new_key",
      detail: `cặp mới chưa có trong baseline: ${key}`,
    });
  }

  return breaches;
}

export function buildBaseline(
  violations: readonly IntegrityViolation[],
  note: string
): DatasetIntegrityBaseline {
  return {
    max_total_violations: violations.length,
    violations_by_competency: Object.fromEntries(
      Object.entries(countByCompetency(violations)).sort(([a], [b]) =>
        a.localeCompare(b)
      )
    ),
    known_violation_keys: [...new Set(violations.map(violationKey))].sort(),
    note,
  };
}

/** Ghi baseline; từ chối NÂNG nợ nếu không có `--force`. */
export function writeBaseline(
  path: string,
  next: DatasetIntegrityBaseline,
  isForce: boolean
): { readonly written: boolean; readonly message: string } {
  if (existsSync(path)) {
    const current = readBaseline(path);
    if (next.max_total_violations > current.max_total_violations && !isForce) {
      return {
        written: false,
        message:
          `từ chối nâng nợ ${current.max_total_violations} → ` +
          `${next.max_total_violations}. Nợ chỉ được GIẢM; dùng --force nếu thật sự cố ý.`,
      };
    }
  }
  writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`, "utf-8");
  return { written: true, message: `đã ghi baseline vào ${path}` };
}

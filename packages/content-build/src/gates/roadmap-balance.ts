/**
 * Cổng cân bằng lộ trình (BR-LRM-06).
 *
 * Chạy `validateCurriculumModel` (BR-CRM-*) trên đúng dãy item mà seeder sẽ
 * ghi vào `curriculum_items`. Cổng gọi `selectCurriculumSlot` — cùng hàm
 * seeder gọi — trên hai kho nguồn theo thứ tự gieo, nên số đo của cổng là số
 * đo của seeder thật, không cần database.
 *
 * `validateCurriculumModel` hạ BR-CRM-02/03/08 xuống cảnh báo. Với seeder, ba
 * luật này là điều kiện chặn: một chương trình theo tuổi chỉ dạy C1 là lỗi sư
 * phạm, không phải khuyến nghị. BR-CRM-05 (hoạt động ngoài màn hình) chưa
 * chặn vì tiết hiện tại chưa khai được vai trò `offscreen`; BR-CRM-01 chưa
 * chạy vì tiết chưa khai kỹ năng mục tiêu.
 */

import {
  type CurriculumItemMetadata,
  type CurriculumValidationResult,
  validateCurriculumModel,
} from "@mindkid/shared";
import {
  CURRICULUM_POOL_LIMIT,
  type CurriculumPoolEntry,
  MVP_CURRICULA_CONFIGS,
  type MvpCurriculumConfig,
  resolveCurriculumWeekGoal,
  selectCurriculumSlot,
} from "../seed-master/curricula.js";
import type { ContentSeed, LessonSeed } from "../types.js";

export type RoadmapRuleId =
  | "BR-CRM-02"
  | "BR-CRM-03"
  | "BR-CRM-07"
  | "BR-CRM-08"
  | "BR-CRM-11"
  | "OTHER";

export interface RoadmapViolation {
  readonly program_code: string;
  readonly rule_id: RoadmapRuleId;
  readonly message: string;
}

export interface RoadmapProgramRow {
  readonly program_code: string;
  readonly duration_weeks: number;
  readonly weeks_off_range: number;
  readonly max_share: number;
  readonly max_share_competency: string;
  readonly competencies_covered: number;
  readonly unreviewed_skills: number;
  readonly reviewable_skills: number;
  readonly late_new_skills: number;
  readonly violations: readonly RoadmapViolation[];
  readonly passed: boolean;
}

export interface RoadmapBalanceReport {
  readonly programs: readonly RoadmapProgramRow[];
  readonly violating_programs: number;
  readonly passed: boolean;
}

export interface RoadmapBalanceInput {
  readonly programs: readonly MvpCurriculumConfig[];
  readonly lessons: readonly LessonSeed[];
  readonly levels: readonly ContentSeed[];
}

const BLOCKING_WARNING_RULES: ReadonlySet<RoadmapRuleId> = new Set([
  "BR-CRM-02",
  "BR-CRM-03",
  "BR-CRM-08",
]);

const RULE_PREFIX_REGEX = /^(BR-CRM-\d{2})/;
const COMPETENCY_COUNT = 6;

// Lesson và game_level là hai chuỗi id riêng trong database; cổng gộp chúng
// vào một mảng item nên dịch id level đi để BR-CRM-09 không nhầm hai thực thể.
const LEVEL_ENTITY_ID_OFFSET = 1_000_000;

function toRuleId(message: string): RoadmapRuleId {
  const matched = RULE_PREFIX_REGEX.exec(message)?.[1];
  switch (matched) {
    case "BR-CRM-02":
    case "BR-CRM-03":
    case "BR-CRM-07":
    case "BR-CRM-08":
    case "BR-CRM-11":
      return matched;
    default:
      return "OTHER";
  }
}

function buildPool(
  seeds: ReadonlyArray<{ readonly header: { readonly code: string } }>,
  idOffset: number
): CurriculumPoolEntry[] {
  return seeds.slice(0, CURRICULUM_POOL_LIMIT).map((seed, index) => ({
    id: idOffset + index + 1,
    code: seed.header.code,
  }));
}

function indexSkills(
  lessons: readonly LessonSeed[],
  levels: readonly ContentSeed[]
): Map<string, { skill_codes: string[]; difficulty?: number }> {
  const byCode = new Map<
    string,
    { skill_codes: string[]; difficulty?: number }
  >();
  for (const lesson of lessons) {
    byCode.set(lesson.header.code, {
      skill_codes: [...lesson.header.skill_codes],
    });
  }
  for (const level of levels) {
    byCode.set(level.header.code, {
      skill_codes: [...level.header.skill_codes],
      difficulty: level.header.difficulty,
    });
  }
  return byCode;
}

export function simulateCurriculumItems(
  program: MvpCurriculumConfig,
  lessons: readonly LessonSeed[],
  levels: readonly ContentSeed[]
): CurriculumItemMetadata[] {
  const lessonsList = buildPool(lessons, 0);
  const levelsList = buildPool(levels, LEVEL_ENTITY_ID_OFFSET);
  const metaByCode = indexSkills(lessons, levels);
  const items: CurriculumItemMetadata[] = [];

  for (let weekNo = 1; weekNo <= program.durationWeeks; weekNo++) {
    for (let sessionNo = 1; sessionNo <= program.sessionsPerWeek; sessionNo++) {
      const selection = selectCurriculumSlot({
        weekNo,
        sessionNo,
        sessionsPerWeek: program.sessionsPerWeek,
        lessonsList,
        levelsList,
      });
      if (!selection) {
        continue;
      }
      const meta = metaByCode.get(selection.entity.code);
      items.push({
        week_no: weekNo,
        session_no: sessionNo,
        position: 1,
        entity_type: selection.entityType,
        entity_id: selection.entity.id,
        code: selection.entity.code,
        is_required: true,
        skill_codes: meta?.skill_codes,
        difficulty: meta?.difficulty,
      });
    }
  }
  return items;
}

function countReviewableSkills(
  items: readonly CurriculumItemMetadata[],
  durationWeeks: number
): number {
  const firstSeen = new Map<string, number>();
  for (const item of items) {
    for (const skill of item.skill_codes ?? []) {
      const seen = firstSeen.get(skill);
      firstSeen.set(
        skill,
        seen === undefined ? item.week_no : Math.min(seen, item.week_no)
      );
    }
  }
  let reviewable = 0;
  for (const week of firstSeen.values()) {
    if (week <= durationWeeks - 3) {
      reviewable++;
    }
  }
  return reviewable;
}

function collectViolations(
  program: MvpCurriculumConfig,
  result: CurriculumValidationResult
): RoadmapViolation[] {
  const violations: RoadmapViolation[] = [];
  for (const message of result.errors) {
    violations.push({
      program_code: program.code,
      rule_id: toRuleId(message),
      message,
    });
  }
  for (const message of result.warnings) {
    const ruleId = toRuleId(message);
    if (BLOCKING_WARNING_RULES.has(ruleId)) {
      violations.push({ program_code: program.code, rule_id: ruleId, message });
    }
  }
  return violations;
}

function countByRule(
  violations: readonly RoadmapViolation[],
  ruleId: RoadmapRuleId
): number {
  return violations.filter((v) => v.rule_id === ruleId).length;
}

function measureProgram(
  program: MvpCurriculumConfig,
  lessons: readonly LessonSeed[],
  levels: readonly ContentSeed[]
): RoadmapProgramRow {
  const items = simulateCurriculumItems(program, lessons, levels);
  const result = validateCurriculumModel({
    code: program.code,
    program_type: program.programType,
    target_age_min: program.targetAgeMin,
    target_age_max: program.targetAgeMax,
    duration_weeks: program.durationWeeks,
    sessions_per_week: program.sessionsPerWeek,
    title: program.title,
    access_tier: program.accessTier,
    status: program.status,
    items,
    weeks: Array.from({ length: program.durationWeeks }, (_, index) => ({
      week_no: index + 1,
      goal: resolveCurriculumWeekGoal(program, index + 1),
    })),
  });
  const violations = collectViolations(program, result);
  const top = result.report.competency_distribution.reduce((best, share) =>
    share.share > best.share ? share : best
  );

  return {
    program_code: program.code,
    duration_weeks: program.durationWeeks,
    weeks_off_range: countByRule(violations, "BR-CRM-02"),
    max_share: top.share,
    max_share_competency: top.competency_code,
    competencies_covered:
      COMPETENCY_COUNT - result.report.missing_competencies.length,
    unreviewed_skills: countByRule(violations, "BR-CRM-03"),
    reviewable_skills: countReviewableSkills(items, program.durationWeeks),
    late_new_skills: countByRule(violations, "BR-CRM-11"),
    violations,
    passed: violations.length === 0,
  };
}

export function evaluateRoadmapBalance(
  input: RoadmapBalanceInput
): RoadmapBalanceReport {
  const programs = input.programs
    .filter((program) => program.status === "published")
    .map((program) => measureProgram(program, input.lessons, input.levels));
  const violatingPrograms = programs.filter((row) => !row.passed).length;
  return {
    programs,
    violating_programs: violatingPrograms,
    passed: violatingPrograms === 0,
  };
}

export function evaluateSeededRoadmapBalance(
  lessons: readonly LessonSeed[],
  levels: readonly ContentSeed[]
): RoadmapBalanceReport {
  return evaluateRoadmapBalance({
    programs: MVP_CURRICULA_CONFIGS,
    lessons,
    levels,
  });
}

function percent(share: number): string {
  return `${(share * 100).toFixed(1)}%`;
}

export function formatRoadmapBalanceReport(
  report: RoadmapBalanceReport
): string[] {
  const lines: string[] = [
    "| Chương trình | BR-CRM-02 tuần lệch 2–4 competency | BR-CRM-07 share lớn nhất (trần 40%) | BR-CRM-08 competency phủ (cần 6) | BR-CRM-03 kỹ năng không ôn lại | BR-CRM-11 kỹ năng mới ở 3 tuần cuối |",
    "|---|---:|---:|---:|---:|---:|",
  ];
  for (const row of report.programs) {
    lines.push(
      `| ${row.program_code} | ${row.weeks_off_range}/${row.duration_weeks} | ${percent(row.max_share)} (${row.max_share_competency}) | ${row.competencies_covered}/${COMPETENCY_COUNT} | ${row.unreviewed_skills}/${row.reviewable_skills} | ${row.late_new_skills} |`
    );
  }
  return lines;
}

export function listRoadmapViolations(
  report: RoadmapBalanceReport
): RoadmapViolation[] {
  return report.programs.flatMap((row) => [...row.violations]);
}

const SUMMARY_EXAMPLES_PER_RULE = 1;

export function formatRoadmapViolationSummary(
  report: RoadmapBalanceReport
): string[] {
  const lines: string[] = [];
  for (const row of report.programs) {
    const byRule = new Map<RoadmapRuleId, RoadmapViolation[]>();
    for (const violation of row.violations) {
      const list = byRule.get(violation.rule_id) ?? [];
      list.push(violation);
      byRule.set(violation.rule_id, list);
    }
    for (const [ruleId, list] of byRule) {
      const examples = list
        .slice(0, SUMMARY_EXAMPLES_PER_RULE)
        .map((violation) => violation.message)
        .join(" | ");
      lines.push(
        `  - [${row.program_code}] ${ruleId} ×${list.length} — vd: ${examples}`
      );
    }
  }
  return lines;
}

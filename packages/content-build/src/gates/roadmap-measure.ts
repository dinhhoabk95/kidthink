import {
  type CurriculumItemMetadata,
  type CurriculumValidationInput,
  type CurriculumValidationResult,
  validateCurriculumModel,
} from "@mindkid/shared";

export type RoadmapRuleId =
  | "BR-CRM-01"
  | "BR-CRM-02"
  | "BR-CRM-03"
  | "BR-CRM-05"
  | "BR-CRM-07"
  | "BR-CRM-08"
  | "BR-CRM-11"
  | "BR-LRM-02"
  | "BR-LRM-05"
  | "BR-LRM-10"
  | "BR-PAR-01"
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

export const COMPETENCY_COUNT = 6;

const RULE_PREFIX_REGEX = /^(BR-CRM-\d{2})/;
export const LEGACY_BLOCKING_WARNING_RULES: ReadonlySet<RoadmapRuleId> =
  new Set(["BR-CRM-02", "BR-CRM-03", "BR-CRM-08"]);

export const ROADMAP_BLOCKING_WARNING_RULES: ReadonlySet<RoadmapRuleId> =
  new Set(["BR-CRM-02", "BR-CRM-03", "BR-CRM-05", "BR-CRM-08"]);

export function toRuleId(message: string): RoadmapRuleId {
  const matched = RULE_PREFIX_REGEX.exec(message)?.[1];
  switch (matched) {
    case "BR-CRM-01":
    case "BR-CRM-02":
    case "BR-CRM-03":
    case "BR-CRM-05":
    case "BR-CRM-07":
    case "BR-CRM-08":
    case "BR-CRM-11":
      return matched;
    default:
      return "OTHER";
  }
}

export function countReviewableSkills(
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
  programCode: string,
  result: CurriculumValidationResult,
  blockingWarnings: ReadonlySet<RoadmapRuleId>
): RoadmapViolation[] {
  const violations: RoadmapViolation[] = [];
  for (const message of result.errors) {
    violations.push({
      program_code: programCode,
      rule_id: toRuleId(message),
      message,
    });
  }
  for (const message of result.warnings) {
    const ruleId = toRuleId(message);
    if (blockingWarnings.has(ruleId)) {
      violations.push({ program_code: programCode, rule_id: ruleId, message });
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

export function measureCurriculum(
  programCode: string,
  input: CurriculumValidationInput,
  blockingWarnings: ReadonlySet<RoadmapRuleId>,
  extraViolations: readonly RoadmapViolation[] = []
): RoadmapProgramRow {
  const result = validateCurriculumModel(input);
  const violations = [
    ...extraViolations,
    ...collectViolations(programCode, result, blockingWarnings),
  ];
  const top = result.report.competency_distribution.reduce((best, share) =>
    share.share > best.share ? share : best
  );

  return {
    program_code: programCode,
    duration_weeks: input.duration_weeks,
    weeks_off_range: countByRule(violations, "BR-CRM-02"),
    max_share: top.share,
    max_share_competency: top.competency_code,
    competencies_covered:
      COMPETENCY_COUNT - result.report.missing_competencies.length,
    unreviewed_skills: countByRule(violations, "BR-CRM-03"),
    reviewable_skills: countReviewableSkills(input.items, input.duration_weeks),
    late_new_skills: countByRule(violations, "BR-CRM-11"),
    violations,
    passed: violations.length === 0,
  };
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

export function summarizeRows(
  programs: readonly RoadmapProgramRow[]
): RoadmapBalanceReport {
  const violatingPrograms = programs.filter((row) => !row.passed).length;
  return {
    programs,
    violating_programs: violatingPrograms,
    passed: violatingPrograms === 0,
  };
}

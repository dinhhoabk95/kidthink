/**
 * Cổng kiểm tra hạn ngạch và đa dạng khuôn theo từng skill (Task #196 / BR-SKQ-01..05).
 * Spec sở hữu: docs/specs/05-content/engine-content-depth.md + 191-full-corpus-seeder-plan.md
 *
 * Quy tắc:
 * - BR-SKQ-01: Chỉ đếm level ĐÃ QUA content_contract của template tương ứng.
 * - BR-SKQ-02: Hạn ngạch level: C1 >= 20 level, C2..C6 >= 10 level.
 *   Chỉ áp cho kỹ năng **đã có >= 1 level** — xem BR-SKQ-06.
 * - BR-SKQ-03: Đa dạng khuôn: C1 >= 4 khuôn, C2..C6 >= 2 khuôn. Cùng phạm vi.
 * - BR-SKQ-06: Bậc thang kỹ năng chưa có nội dung. Số kỹ năng 0 level phải
 *   <= trần ghi trong `skill-coverage-ratchet.json`. Trần chỉ giảm; muốn tăng
 *   thì sửa file kèm lý do trong PR.
 * - BR-SKQ-04: Trần cứng mỗi cặp (skill, khuôn) <= 5 level.
 * - BR-SKQ-05: Sàn cặp phân biệt toàn catalog >= 658 cặp (khi đủ 3.290 level).
 */

import fs from "node:fs";
import path from "node:path";
import { repoPath } from "@mindkid/config/paths";
import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { z } from "zod";
import {
  type ParsedSkill,
  parseTaxonomyDocs,
} from "#src/seed-master/taxonomy/index";
import type { ContentSeed } from "#src/types";

export interface QuotaConfig {
  readonly c1: {
    readonly requiredLevels: number;
    readonly requiredTemplates: number;
  };
  readonly default: {
    readonly requiredLevels: number;
    readonly requiredTemplates: number;
  };
  readonly maxLevelsPerPair: number;
  readonly minDistinctPairsCatalog: number;
}

export function readQuotaConfig(): QuotaConfig {
  const filePath = repoPath("packages/content-build/src/thresholds/quota.json");
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as QuotaConfig;
  }
  return {
    c1: { requiredLevels: 3, requiredTemplates: 2 },
    default: { requiredLevels: 3, requiredTemplates: 2 },
    maxLevelsPerPair: 5,
    minDistinctPairsCatalog: 886,
  };
}

export interface SkillQuotaDeficit {
  readonly skill_code: string;
  readonly competency_code: string;
  readonly current_levels: number;
  readonly required_levels: number;
  readonly current_templates: number;
  readonly required_templates: number;
  readonly template_codes: readonly string[];
  readonly pair_violations: ReadonlyArray<{
    readonly template_code: string;
    readonly level_count: number;
  }>;
}

export interface SkillQuotaViolation {
  readonly ruleId:
    | "BR-SKQ-01"
    | "BR-SKQ-02"
    | "BR-SKQ-03"
    | "BR-SKQ-04"
    | "BR-SKQ-05"
    | "BR-SKQ-06";
  readonly skill_code?: string;
  readonly template_code?: string;
  readonly message: string;
  readonly actual?: number | string;
  readonly expected?: number | string;
}

export interface SkillQuotaReport {
  readonly passed: boolean;
  readonly totalSkills: number;
  readonly skillsMeetingQuotaCount: number;
  readonly skillsMeetingDiversityCount: number;
  readonly skillsWithZeroLevelsCount: number;
  readonly skillsSingleTemplateCount: number;
  readonly totalValidLevels: number;
  readonly totalDistinctPairs: number;
  readonly parseRejectedCount: number;
  readonly deficits: readonly SkillQuotaDeficit[];
  readonly violations: readonly SkillQuotaViolation[];
}

interface ValidLevelInfo {
  readonly template_code: string;
  readonly skill_codes: readonly string[];
}

function validateContentSeeds(levels: readonly ContentSeed[]): {
  validMap: Map<string, ValidLevelInfo>;
  parseViolations: SkillQuotaViolation[];
} {
  const validMap = new Map<string, ValidLevelInfo>();
  const parseViolations: SkillQuotaViolation[] = [];

  for (const lvl of levels) {
    const h = lvl.header;
    const template = ALL_TEMPLATES[h.template_code];
    if (!template) {
      parseViolations.push({
        ruleId: "BR-SKQ-01",
        template_code: h.template_code,
        message: `Level ${h.code} dùng template không tồn tại: ${h.template_code}`,
      });
      continue;
    }

    const parseResult = template.content_contract.safeParse(lvl.content_pack);
    if (!parseResult.success) {
      parseViolations.push({
        ruleId: "BR-SKQ-01",
        template_code: h.template_code,
        message: `Level ${h.code} trượt content_contract của ${h.template_code}`,
      });
      continue;
    }

    validMap.set(h.code, {
      template_code: h.template_code,
      skill_codes: h.skill_codes,
    });
  }

  return { validMap, parseViolations };
}

function aggregateSkillLevels(
  validMap: Map<string, ValidLevelInfo>,
  taxonomySkills: readonly ParsedSkill[]
): Map<string, Map<string, number>> {
  const skillLevels = new Map<string, Map<string, number>>();
  for (const s of taxonomySkills) {
    skillLevels.set(s.code, new Map<string, number>());
  }

  for (const [, lvlInfo] of validMap.entries()) {
    for (const skCode of lvlInfo.skill_codes) {
      let tMap = skillLevels.get(skCode);
      if (!tMap) {
        tMap = new Map<string, number>();
        skillLevels.set(skCode, tMap);
      }
      const count = tMap.get(lvlInfo.template_code) ?? 0;
      tMap.set(lvlInfo.template_code, count + 1);
    }
  }

  return skillLevels;
}

interface SkillEvaluationResult {
  readonly meetsQuota: boolean;
  readonly meetsDiversity: boolean;
  readonly isZeroLevels: boolean;
  readonly isSingleTemplate: boolean;
  readonly distinctPairs: readonly string[];
  readonly violations: readonly SkillQuotaViolation[];
  readonly deficit?: SkillQuotaDeficit;
}

function collectTemplateStats(
  skillCode: string,
  tMap: Map<string, number>,
  maxLevelsPerPair: number
): {
  totalLevels: number;
  templateCodes: string[];
  distinctPairs: string[];
  pairViolations: Array<{ template_code: string; level_count: number }>;
  pairViolationsList: SkillQuotaViolation[];
} {
  let totalLevels = 0;
  const templateCodes: string[] = [];
  const pairViolations: Array<{ template_code: string; level_count: number }> =
    [];
  const distinctPairs: string[] = [];
  const pairViolationsList: SkillQuotaViolation[] = [];

  for (const [tCode, count] of tMap.entries()) {
    // BR-SKQ-08: level dạy đứng ngoài hạn ngạch level chơi. Từ khi bậc `pre` bị gỡ
    // (BR-CTM-01), level dạy gắn thẳng vào kỹ năng chơi; đếm chung thì một kỹ năng
    // C1 có 19 bài chơi cộng 1 bài dạy sẽ báo đủ 20 trong khi thiếu một bài chơi.
    if (ALL_TEMPLATES[tCode]?.kind === "teach") {
      continue;
    }

    totalLevels += count;
    templateCodes.push(tCode);
    distinctPairs.push(`${skillCode}:${tCode}`);

    if (count > maxLevelsPerPair) {
      pairViolations.push({ template_code: tCode, level_count: count });
      pairViolationsList.push({
        ruleId: "BR-SKQ-04",
        skill_code: skillCode,
        template_code: tCode,
        message: `Cặp (${skillCode}, ${tCode}) có ${count} level, vượt trần ${maxLevelsPerPair}`,
        actual: count,
        expected: maxLevelsPerPair,
      });
    }
  }

  return {
    totalLevels,
    templateCodes,
    distinctPairs,
    pairViolations,
    pairViolationsList,
  };
}

function checkDeficitViolations(
  skill: ParsedSkill,
  totalLevels: number,
  templateCount: number,
  requiredLevels: number,
  requiredTemplates: number,
  isTeachOnly: boolean,
  meetsQuota: boolean,
  meetsDiversity: boolean,
  violations: SkillQuotaViolation[]
): void {
  if (!(meetsQuota || isTeachOnly)) {
    violations.push({
      ruleId: "BR-SKQ-02",
      skill_code: skill.code,
      message: `Skill ${skill.code} có ${totalLevels} level, thiếu so với hạn ngạch ${requiredLevels}`,
      actual: totalLevels,
      expected: requiredLevels,
    });
  }

  if (!(meetsDiversity || isTeachOnly)) {
    violations.push({
      ruleId: "BR-SKQ-03",
      skill_code: skill.code,
      message: `Skill ${skill.code} trải trên ${templateCount} khuôn, thiếu so với yêu cầu ${requiredTemplates}`,
      actual: templateCount,
      expected: requiredTemplates,
    });
  }
}

function evaluateSingleSkill(
  skill: ParsedSkill,
  tMap: Map<string, number>,
  quota: QuotaConfig
): SkillEvaluationResult {
  const {
    totalLevels,
    templateCodes,
    distinctPairs,
    pairViolations,
    pairViolationsList,
  } = collectTemplateStats(skill.code, tMap, quota.maxLevelsPerPair);
  const violations: SkillQuotaViolation[] = [...pairViolationsList];

  const isC1 = skill.competency_code === "C1";
  const quotaRule = isC1 ? quota.c1 : quota.default;
  const requiredLevels = quotaRule.requiredLevels;
  const requiredTemplates = quotaRule.requiredTemplates;

  // BR-SKQ-08: `collectTemplateStats` đã loại level dạy, nên `templateCodes` chỉ còn
  // khuôn chơi. Kỹ năng chỉ có level dạy rơi về 0 level và đi theo nhánh
  // `isZeroLevels` bên dưới — đúng BR-SKQ-06, không phải một ngoại lệ riêng.
  const meetsQuota = totalLevels >= requiredLevels;
  const meetsDiversity = templateCodes.length >= requiredTemplates;
  const isTeachOnly = false;

  if (totalLevels === 0) {
    return {
      meetsQuota: false,
      meetsDiversity: false,
      isZeroLevels: true,
      isSingleTemplate: false,
      distinctPairs,
      violations,
      deficit: {
        skill_code: skill.code,
        competency_code: skill.competency_code,
        current_levels: 0,
        required_levels: isTeachOnly ? 1 : requiredLevels,
        current_templates: 0,
        required_templates: isTeachOnly ? 1 : requiredTemplates,
        template_codes: [],
        pair_violations: [],
      },
    };
  }

  checkDeficitViolations(
    skill,
    totalLevels,
    templateCodes.length,
    requiredLevels,
    requiredTemplates,
    isTeachOnly,
    meetsQuota,
    meetsDiversity,
    violations
  );

  const hasDeficit =
    !(meetsQuota && meetsDiversity) || pairViolations.length > 0;
  const deficit: SkillQuotaDeficit | undefined = hasDeficit
    ? {
        skill_code: skill.code,
        competency_code: skill.competency_code,
        current_levels: totalLevels,
        required_levels: requiredLevels,
        current_templates: templateCodes.length,
        required_templates: requiredTemplates,
        template_codes: templateCodes,
        pair_violations: pairViolations,
      }
    : undefined;

  return {
    meetsQuota,
    meetsDiversity,
    isZeroLevels: totalLevels === 0,
    isSingleTemplate: !isTeachOnly && templateCodes.length === 1,
    distinctPairs,
    violations,
    deficit,
  };
}

/** Trần nợ nội dung — số kỹ năng được phép chưa có level nào. */
interface CoverageRatchet {
  readonly max_skills_without_levels: number;
  readonly recorded_at: string;
  readonly note: string;
}

const RATCHET_FILE = "skill-coverage-ratchet.json";

/**
 * Đọc trần bậc thang. Thiếu file thì trần bằng 0 — nghiêm ngặt nhất, để việc
 * xoá file không bao giờ làm cổng dễ hơn.
 */
export function readCoverageRatchet(docsDirOrRoot?: string): CoverageRatchet {
  const candidates = [
    repoPath(
      "packages/content-build/src/thresholds/skill-coverage-ratchet.json"
    ),
    repoPath("packages/db/src/seed-content/gates/skill-coverage-ratchet.json"),
  ];
  if (docsDirOrRoot) {
    candidates.unshift(path.resolve(docsDirOrRoot, "..", RATCHET_FILE));
  }
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8")) as CoverageRatchet;
    }
  }
  return {
    max_skills_without_levels: 0,
    recorded_at: "",
    note: `Không tìm thấy ${RATCHET_FILE} — trần mặc định 0.`,
  };
}

function checkRatchetLimit(
  zeroLevelsCount: number,
  violations: SkillQuotaViolation[]
): void {
  const ratchet = readCoverageRatchet();
  if (zeroLevelsCount > ratchet.max_skills_without_levels) {
    violations.push({
      ruleId: "BR-SKQ-06",
      message: `Có ${zeroLevelsCount} kỹ năng chưa có level nào, vượt trần bậc thang ${ratchet.max_skills_without_levels}. Soạn thêm level hoặc hạ trần trong ${RATCHET_FILE} kèm lý do.`,
      actual: zeroLevelsCount,
      expected: ratchet.max_skills_without_levels,
    });
  }
}

export function evaluateSkillQuota(
  levels: readonly ContentSeed[],
  docsDir?: string
): SkillQuotaReport {
  const taxonomySkills = parseTaxonomyDocs(
    docsDir ?? repoPath("docs/taxonomy")
  );
  const { validMap, parseViolations } = validateContentSeeds(levels);
  const skillLevels = aggregateSkillLevels(validMap, taxonomySkills);
  const quota = readQuotaConfig();

  const allViolations: SkillQuotaViolation[] = [...parseViolations];
  const deficits: SkillQuotaDeficit[] = [];
  const distinctPairsSet = new Set<string>();

  let skillsMeetingQuotaCount = 0;
  let skillsMeetingDiversityCount = 0;
  let skillsWithZeroLevelsCount = 0;
  let skillsSingleTemplateCount = 0;

  for (const s of taxonomySkills) {
    const tMap = skillLevels.get(s.code) ?? new Map<string, number>();
    const res = evaluateSingleSkill(s, tMap, quota);

    allViolations.push(...res.violations);
    if (res.deficit) {
      deficits.push(res.deficit);
    }
    for (const pair of res.distinctPairs) {
      distinctPairsSet.add(pair);
    }

    if (res.meetsQuota) {
      skillsMeetingQuotaCount++;
    }
    if (res.meetsDiversity) {
      skillsMeetingDiversityCount++;
    }
    if (res.isZeroLevels) {
      skillsWithZeroLevelsCount++;
    }
    if (res.isSingleTemplate) {
      skillsSingleTemplateCount++;
    }
  }

  checkRatchetLimit(skillsWithZeroLevelsCount, allViolations);

  return {
    passed: allViolations.length === 0,
    totalSkills: taxonomySkills.length,
    skillsMeetingQuotaCount,
    skillsMeetingDiversityCount,
    skillsWithZeroLevelsCount,
    skillsSingleTemplateCount,
    totalValidLevels: validMap.size,
    totalDistinctPairs: distinctPairsSet.size,
    parseRejectedCount: parseViolations.length,
    deficits,
    violations: allViolations,
  };
}

export const SkillQuotaDebtRuleSchema = z.enum(["BR-SKQ-02", "BR-SKQ-03"]);

export const SkillQuotaDebtEntrySchema = z.object({
  min_levels: z.number().int().min(1),
  min_templates: z.number().int().min(1),
  rules: z.array(SkillQuotaDebtRuleSchema).min(1),
});

export const SkillQuotaDebtConfigSchema = z.object({
  recorded_at: z.string().min(1),
  note: z.string().min(1),
  max_violations: z.number().int().min(0),
  skills: z.record(z.string().min(1), SkillQuotaDebtEntrySchema),
});

export type SkillQuotaDebtEntry = z.infer<typeof SkillQuotaDebtEntrySchema>;
export type SkillQuotaDebtConfig = z.infer<typeof SkillQuotaDebtConfigSchema>;

export interface SkillQuotaDebtEvaluation {
  readonly passed: boolean;
  readonly maxViolations: number;
  readonly debtViolations: readonly SkillQuotaViolation[];
  readonly unexcusedViolations: readonly SkillQuotaViolation[];
  readonly staleEntries: readonly string[];
}

const DEBT_FILE_PATH =
  "packages/content-build/src/thresholds/skill-quota-debt.json";

export function readSkillQuotaDebt(customPath?: string): SkillQuotaDebtConfig {
  const filePath = customPath ?? repoPath(DEBT_FILE_PATH);
  if (!fs.existsSync(filePath)) {
    return {
      recorded_at: "",
      note: "Không tìm thấy skill-quota-debt.json — trần mặc định 0.",
      max_violations: 0,
      skills: {},
    };
  }
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return SkillQuotaDebtConfigSchema.parse(raw);
}

function isViolationCoveredByDebt(
  v: SkillQuotaViolation,
  entry: SkillQuotaDebtEntry | undefined
): boolean {
  if (!entry) {
    return false;
  }
  if (v.ruleId === "BR-SKQ-02") {
    return (
      entry.rules.includes("BR-SKQ-02") &&
      typeof v.actual === "number" &&
      v.actual >= entry.min_levels
    );
  }
  if (v.ruleId === "BR-SKQ-03") {
    return (
      entry.rules.includes("BR-SKQ-03") &&
      typeof v.actual === "number" &&
      v.actual >= entry.min_templates
    );
  }
  return false;
}

function collectStaleDebtEntries(
  seenDebtKeys: ReadonlySet<string>,
  debt: SkillQuotaDebtConfig
): string[] {
  const staleEntries: string[] = [];
  for (const [skillCode, entry] of Object.entries(debt.skills)) {
    for (const ruleId of entry.rules) {
      const key = `${skillCode}::${ruleId}`;
      if (!seenDebtKeys.has(key)) {
        staleEntries.push(
          `[DEBT-STALE] Skill ${skillCode} đã đạt ${ruleId}, cần gỡ khỏi skill-quota-debt.json và hạ trần max_violations.`
        );
      }
    }
  }
  return staleEntries;
}

export function evaluateSkillQuotaWithDebt(
  report: SkillQuotaReport,
  debt: SkillQuotaDebtConfig = readSkillQuotaDebt()
): SkillQuotaDebtEvaluation {
  const debtViolations: SkillQuotaViolation[] = [];
  const unexcusedViolations: SkillQuotaViolation[] = [];
  const seenDebtKeys = new Set<string>();

  for (const v of report.violations) {
    const entry = v.skill_code ? debt.skills[v.skill_code] : undefined;
    if (v.skill_code && isViolationCoveredByDebt(v, entry)) {
      debtViolations.push(v);
      seenDebtKeys.add(`${v.skill_code}::${v.ruleId}`);
    } else {
      unexcusedViolations.push(v);
    }
  }

  const staleEntries =
    report.totalValidLevels > 0
      ? collectStaleDebtEntries(seenDebtKeys, debt)
      : [];

  if (debtViolations.length > debt.max_violations) {
    unexcusedViolations.push({
      ruleId: "BR-SKQ-02",
      message: `Số vi phạm trong sổ nợ (${debtViolations.length}) vượt quá trần max_violations (${debt.max_violations}).`,
      actual: debtViolations.length,
      expected: debt.max_violations,
    });
  }

  return {
    passed: unexcusedViolations.length === 0 && staleEntries.length === 0,
    maxViolations: debt.max_violations,
    debtViolations,
    unexcusedViolations,
    staleEntries,
  };
}

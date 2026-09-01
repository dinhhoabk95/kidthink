/**
 * Cổng kiểm tra hạn ngạch và đa dạng khuôn theo từng skill (Task #196 / BR-SKQ-01..05).
 * Spec sở hữu: docs/specs/05-content/engine-content-depth.md + 191-full-corpus-seeder-plan.md
 *
 * Quy tắc:
 * - BR-SKQ-01: Chỉ đếm level ĐÃ QUA content_contract của template tương ứng.
 * - BR-SKQ-02: Hạn ngạch level: C1 >= 20 level, C2..C6 >= 10 level.
 * - BR-SKQ-03: Đa dạng khuôn: C1 >= 4 khuôn, C2..C6 >= 2 khuôn.
 * - BR-SKQ-04: Trần cứng mỗi cặp (skill, khuôn) <= 5 level.
 * - BR-SKQ-05: Sàn cặp phân biệt toàn catalog >= 658 cặp (khi đủ 3.290 level).
 */

import { ALL_TEMPLATES } from "@mindkid/game-engine";
import type { ContentSeed } from "#src/seed-content/types";
import {
  type ParsedSkill,
  parseTaxonomyDocs,
} from "#src/seed-master/taxonomy/index";

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
    | "BR-SKQ-05";
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

function evaluateSingleSkill(
  skill: ParsedSkill,
  tMap: Map<string, number>
): SkillEvaluationResult {
  let totalLevels = 0;
  const templateCodes: string[] = [];
  const pairViolations: Array<{ template_code: string; level_count: number }> =
    [];
  const distinctPairs: string[] = [];
  const violations: SkillQuotaViolation[] = [];

  for (const [tCode, count] of tMap.entries()) {
    totalLevels += count;
    templateCodes.push(tCode);
    distinctPairs.push(`${skill.code}:${tCode}`);

    if (count > 5) {
      pairViolations.push({ template_code: tCode, level_count: count });
      violations.push({
        ruleId: "BR-SKQ-04",
        skill_code: skill.code,
        template_code: tCode,
        message: `Cặp (${skill.code}, ${tCode}) có ${count} level, vượt trần 5`,
        actual: count,
        expected: 5,
      });
    }
  }

  const isC1 = skill.competency_code === "C1";
  const requiredLevels = isC1 ? 20 : 10;
  const requiredTemplates = isC1 ? 4 : 2;

  const meetsQuota = totalLevels >= requiredLevels;
  const meetsDiversity = templateCodes.length >= requiredTemplates;

  if (!meetsQuota) {
    violations.push({
      ruleId: "BR-SKQ-02",
      skill_code: skill.code,
      message: `Skill ${skill.code} có ${totalLevels} level, thiếu so với hạn ngạch ${requiredLevels}`,
      actual: totalLevels,
      expected: requiredLevels,
    });
  }

  if (!meetsDiversity) {
    violations.push({
      ruleId: "BR-SKQ-03",
      skill_code: skill.code,
      message: `Skill ${skill.code} trải trên ${templateCodes.length} khuôn, thiếu so với yêu cầu ${requiredTemplates}`,
      actual: templateCodes.length,
      expected: requiredTemplates,
    });
  }

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
    isSingleTemplate: templateCodes.length === 1,
    distinctPairs,
    violations,
    deficit,
  };
}

export function evaluateSkillQuota(
  levels: readonly ContentSeed[],
  docsDir?: string
): SkillQuotaReport {
  const taxonomySkills = parseTaxonomyDocs(docsDir ?? "../../docs/taxonomy");
  const { validMap, parseViolations } = validateContentSeeds(levels);
  const skillLevels = aggregateSkillLevels(validMap, taxonomySkills);

  const allViolations: SkillQuotaViolation[] = [...parseViolations];
  const deficits: SkillQuotaDeficit[] = [];
  const distinctPairsSet = new Set<string>();

  let skillsMeetingQuotaCount = 0;
  let skillsMeetingDiversityCount = 0;
  let skillsWithZeroLevelsCount = 0;
  let skillsSingleTemplateCount = 0;

  for (const s of taxonomySkills) {
    const tMap = skillLevels.get(s.code) ?? new Map<string, number>();
    const res = evaluateSingleSkill(s, tMap);

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

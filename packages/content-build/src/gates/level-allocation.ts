/**
 * Bảng phân bổ 3.290 level (Task #198 / BR-ALC-01..08).
 * Spec: 191-full-corpus-seeder-plan.md
 */

import fs from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { type AgeBand, ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { CONTENT_THEMES } from "@mindkid/shared";
import {
  type ParsedSkill,
  parseTaxonomyDocs,
} from "../seed-master/taxonomy/index.js";
import {
  buildSkillTemplateAffinityMatrix,
  getSkillAgeBands,
  type SkillAffinityMatrixData,
} from "./skill-template-affinity.js";

export interface AllocationRow {
  readonly skill_code: string;
  readonly competency_code: string;
  readonly template_code: string;
  readonly level_count: number;
  readonly age_band: AgeBand;
  readonly theme_tags: readonly string[];
  readonly difficulty_range: readonly [number, number];
}

export interface LevelAllocationPlan {
  readonly date: string;
  readonly target_total_levels: number;
  readonly total_skills: number;
  readonly total_allocations: number;
  readonly distinct_pairs_count: number;
  readonly theme_distribution: Record<string, number>;
  readonly allocations: readonly AllocationRow[];
}

function calculateDifficultyRange(difficulty: number): [number, number] {
  switch (difficulty) {
    case 1:
      return [1, 2];
    case 2:
      return [1, 3];
    case 3:
      return [2, 4];
    case 4:
      return [3, 5];
    case 5:
      return [4, 5];
    default:
      return [1, 3];
  }
}

function selectBestBandForTemplate(
  skillBands: readonly AgeBand[],
  templateCode: string
): AgeBand {
  const template = ALL_TEMPLATES[templateCode];
  const banned = template?.banned_age_bands ?? [];
  const valid = skillBands.filter((b) => !banned.includes(b));
  if (valid.length > 0 && valid[0] !== undefined) {
    return valid[0];
  }
  const allBands: AgeBand[] = ["3-4", "4-5", "5-6"];
  const templateValid = allBands.filter((b) => !banned.includes(b));
  return templateValid[0] ?? "4-5";
}

function resolveChosenTemplates(
  skill: ParsedSkill,
  affinityMatrix: SkillAffinityMatrixData
): string[] {
  const isC1 = skill.competency_code === "C1";
  const minTemplates = isC1 ? 4 : 2;
  const available = [...(affinityMatrix.affinities[skill.code] ?? [])];

  if (available.length === 0) {
    return isC1
      ? ["GT-001", "GT-002", "GT-003", "GT-004"]
      : ["GT-001", "GT-002"];
  }

  const chosen = available.slice(
    0,
    Math.max(minTemplates, Math.min(5, available.length))
  );
  if (chosen.length < minTemplates) {
    const generalPool = isC1
      ? ["GT-001", "GT-003", "GT-005", "GT-007", "GT-008", "GT-012"]
      : ["GT-001", "GT-002", "GT-003", "GT-004", "GT-006"];
    for (const t of generalPool) {
      if (!chosen.includes(t) && chosen.length < minTemplates) {
        chosen.push(t);
      }
    }
  }
  return chosen;
}

function distributeLevelCounts(targetLevels: number, count: number): number[] {
  const counts: number[] = [];
  const base = Math.floor(targetLevels / count);
  const remainder = targetLevels % count;
  for (let i = 0; i < count; i++) {
    counts.push(base + (i < remainder ? 1 : 0));
  }
  return counts;
}

function assignThemes(
  levelCount: number,
  themeCodes: readonly string[],
  themeIndexState: { current: number },
  themeCounts: Record<string, number>
): string[] {
  const assigned: string[] = [];
  for (let l = 0; l < levelCount; l++) {
    const theme =
      themeCodes[themeIndexState.current % themeCodes.length] ?? "school";
    themeIndexState.current++;
    assigned.push(theme);
    themeCounts[theme] = (themeCounts[theme] ?? 0) + 1;
  }
  return assigned;
}

function buildSkillAllocations(
  skill: ParsedSkill,
  affinityMatrix: SkillAffinityMatrixData,
  themeCodes: readonly string[],
  themeIndexState: { current: number },
  themeCounts: Record<string, number>
): AllocationRow[] {
  const isC1 = skill.competency_code === "C1";
  const targetLevels = isC1 ? 20 : 10;
  const chosenTemplates = resolveChosenTemplates(skill, affinityMatrix);
  const countsPerTemplate = distributeLevelCounts(
    targetLevels,
    chosenTemplates.length
  );

  const sBands = getSkillAgeBands(skill.age_min, skill.age_max);
  const diffRange = calculateDifficultyRange(skill.difficulty);
  const rows: AllocationRow[] = [];

  for (let i = 0; i < chosenTemplates.length; i++) {
    const tCode = chosenTemplates[i] ?? "GT-001";
    const lvlCount = countsPerTemplate[i] ?? 5;
    const band = selectBestBandForTemplate(sBands, tCode);
    const assignedThemes = assignThemes(
      lvlCount,
      themeCodes,
      themeIndexState,
      themeCounts
    );

    rows.push({
      skill_code: skill.code,
      competency_code: skill.competency_code,
      template_code: tCode,
      level_count: lvlCount,
      age_band: band,
      theme_tags: assignedThemes,
      difficulty_range: diffRange,
    });
  }

  return rows;
}

export function generateLevelAllocationPlan(
  docsDir?: string,
  affinityData?: SkillAffinityMatrixData
): LevelAllocationPlan {
  const skills = parseTaxonomyDocs(docsDir ?? repoPath("docs/taxonomy")).filter(
    (s) => s.tier !== "pre"
  );
  const matrix = affinityData ?? buildSkillTemplateAffinityMatrix();
  const themeCodes = CONTENT_THEMES.map((t) => t.code);

  const allocations: AllocationRow[] = [];
  const themeCounts: Record<string, number> = {};
  for (const t of themeCodes) {
    themeCounts[t] = 0;
  }

  const themeIndexState = { current: 0 };

  for (const s of skills) {
    const skillRows = buildSkillAllocations(
      s,
      matrix,
      themeCodes,
      themeIndexState,
      themeCounts
    );
    allocations.push(...skillRows);
  }

  const totalLevels = allocations.reduce((sum, a) => sum + a.level_count, 0);
  const distinctPairs = new Set(
    allocations.map((a) => `${a.skill_code}:${a.template_code}`)
  );

  return {
    date: "2026-09-01",
    target_total_levels: totalLevels,
    total_skills: skills.length,
    total_allocations: allocations.length,
    distinct_pairs_count: distinctPairs.size,
    theme_distribution: themeCounts,
    allocations,
  };
}

export function loadLevelAllocationPlan(
  customPath?: string
): LevelAllocationPlan {
  const planPath =
    customPath ||
    repoPath("packages/content-build/src/thresholds/level-allocation.json");
  const raw = fs.readFileSync(planPath, "utf8");
  return JSON.parse(raw) as LevelAllocationPlan;
}

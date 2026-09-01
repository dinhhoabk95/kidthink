/**
 * Ma trận tương thích Skill x GameTemplate (Task #193 / BR-STA-01..05).
 *
 * Luật suy diễn:
 * Khuôn T hợp lệ cho Skill S khi:
 * 1. (giao thinking ≠ ∅): s.thinking_processes ∩ t.thinking ≠ ∅
 * 2. (age fit): ít nhất một band tuổi của skill không nằm trong t.banned_age_bands
 *    và giao khoảng tuổi [s.age_min, s.age_max] ∩ [t.age_min, t.age_max] ≠ ∅
 */

import fs from "node:fs";
import path from "node:path";
import { repoPath } from "@mindkid/config/paths";
import {
  type AgeBand,
  ALL_TEMPLATES,
  type GameTemplate,
} from "@mindkid/game-engine";
import {
  type ParsedSkill,
  parseTaxonomyDocs,
} from "#src/seed-master/taxonomy/index";

export interface SkillAffinityEntry {
  readonly skill_code: string;
  readonly skill_name: string;
  readonly competency_code: string;
  readonly age_min: number;
  readonly age_max: number;
  readonly bands: readonly AgeBand[];
  readonly thinking: readonly string[];
  readonly templates: readonly string[];
}

export interface SkillAffinityMatrixData {
  readonly date: string;
  readonly total_skills: number;
  readonly total_templates: number;
  readonly affinities: Record<string, readonly string[]>;
  readonly metrics: {
    readonly band_3_4_skills_count: number;
    readonly c1_skills_below_4_count: number;
    readonly c1_skills_below_4: readonly string[];
    readonly all_skills_below_2_count: number;
    readonly all_skills_below_2: readonly string[];
    readonly single_template_skills_count: number;
    readonly single_template_skills: readonly string[];
    readonly zero_template_skills_count: number;
    readonly zero_template_skills: readonly string[];
  };
  readonly exceptions: readonly string[];
}

const SECTION_13_SEED_REGEX =
  /##\s*13\.\s*Ma trận seed[^\n]*\n([\s\S]*?)(##\s*14\.|\n---\n|$)/i;

export function extractEngineThinkingMap(
  specsDir?: string
): Record<string, string[]> {
  const dir = specsDir ?? repoPath("docs/specs/01-platform/engines");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith("GT-") && f.endsWith(".md"))
    .sort();

  const engineThinkingMap: Record<string, string[]> = {};
  for (const file of files) {
    const code = file.replace(".md", "");
    const content = fs.readFileSync(path.join(dir, file), "utf8");
    const s13Match = content.match(SECTION_13_SEED_REGEX);
    if (!s13Match) {
      continue;
    }
    const s13 = s13Match[1] ?? "";
    const tableHeaderLine = s13
      .split("\n")
      .find(
        (l) =>
          l.includes("| Band |") ||
          l.includes("| Độ tuổi |") ||
          l.includes("| Band")
      );
    if (!tableHeaderLine) {
      continue;
    }
    const headers = tableHeaderLine
      .split("|")
      .map((h) => h.trim())
      .filter(
        (h) => h && h !== "Band" && h !== "Độ tuổi" && !h.startsWith("Tổng")
      );
    const thinkingTags = headers
      .map((h) => h.replace(/`/g, "").trim())
      .filter((h) => h.length > 0);
    engineThinkingMap[code] = thinkingTags;
  }
  return engineThinkingMap;
}

export function getSkillAgeBands(ageMin: number, ageMax: number): AgeBand[] {
  const bands: AgeBand[] = [];
  if (ageMin <= 3 || ageMax <= 4) {
    bands.push("3-4");
  }
  if (
    ((ageMin <= 4 && ageMax >= 4) || (ageMin <= 5 && ageMax >= 5)) &&
    !bands.includes("4-5")
  ) {
    bands.push("4-5");
  }
  if ((ageMax >= 5 || ageMin >= 5) && !bands.includes("5-6")) {
    bands.push("5-6");
  }
  return bands;
}

export function isTemplateAffinityMatch(
  skill: Pick<ParsedSkill, "age_min" | "age_max" | "thinking_processes">,
  templateCode: string,
  template: GameTemplate,
  engineThinkingMap: Record<string, string[]>
): boolean {
  const tThinking = engineThinkingMap[templateCode] ?? [];
  const hasThinkingIntersection = skill.thinking_processes.some((tp) =>
    tThinking.includes(tp)
  );
  if (!hasThinkingIntersection) {
    return false;
  }

  const sBands = getSkillAgeBands(skill.age_min, skill.age_max);
  const banned = template.banned_age_bands ?? [];
  const hasValidBand = sBands.some((b) => !banned.includes(b));
  if (!hasValidBand) {
    return false;
  }

  if (
    typeof template.age_min === "number" &&
    skill.age_max < template.age_min
  ) {
    return false;
  }
  if (
    typeof template.age_max === "number" &&
    skill.age_min > template.age_max
  ) {
    return false;
  }

  return true;
}

export function matchTemplatesForSkill(
  skill: ParsedSkill,
  templates: Record<string, GameTemplate>,
  engineThinkingMap: Record<string, string[]>
): string[] {
  const matched: string[] = [];
  for (const [tCode, tObj] of Object.entries(templates)) {
    if (isTemplateAffinityMatch(skill, tCode, tObj, engineThinkingMap)) {
      matched.push(tCode);
    }
  }
  return matched;
}

export function buildSkillTemplateAffinityMatrix(
  docsDir?: string,
  specsDir?: string,
  templatesOverride?: Record<string, GameTemplate>
): SkillAffinityMatrixData {
  const skills = parseTaxonomyDocs(docsDir ?? repoPath("docs/taxonomy"));
  const templates = templatesOverride ?? ALL_TEMPLATES;
  const engineThinkingMap = extractEngineThinkingMap(specsDir);

  const affinities: Record<string, string[]> = {};
  let band34SkillsCount = 0;
  const c1Below4: string[] = [];
  const allBelow2: string[] = [];
  const singleTemplateSkills: string[] = [];
  const zeroTemplateSkills: string[] = [];

  for (const s of skills) {
    if (s.age_min === 3) {
      band34SkillsCount++;
    }

    const matched = matchTemplatesForSkill(s, templates, engineThinkingMap);
    affinities[s.code] = matched;

    if (s.competency_code === "C1" && matched.length < 4) {
      c1Below4.push(s.code);
    }
    if (matched.length < 2) {
      allBelow2.push(s.code);
    }
    if (matched.length === 1) {
      singleTemplateSkills.push(s.code);
    }
    if (matched.length === 0) {
      zeroTemplateSkills.push(s.code);
    }
  }

  const exceptions = Array.from(new Set([...allBelow2, ...c1Below4])).sort();

  return {
    date: "2026-09-01",
    total_skills: skills.length,
    total_templates: Object.keys(templates).length,
    affinities,
    metrics: {
      band_3_4_skills_count: band34SkillsCount,
      c1_skills_below_4_count: c1Below4.length,
      c1_skills_below_4: c1Below4,
      all_skills_below_2_count: allBelow2.length,
      all_skills_below_2: allBelow2,
      single_template_skills_count: singleTemplateSkills.length,
      single_template_skills: singleTemplateSkills,
      zero_template_skills_count: zeroTemplateSkills.length,
      zero_template_skills: zeroTemplateSkills,
    },
    exceptions,
  };
}

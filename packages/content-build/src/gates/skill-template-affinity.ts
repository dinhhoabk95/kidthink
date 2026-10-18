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
} from "@mindkid/game-engine/registry";
import type { ProjectionRequires, SkillDataset } from "@mindkid/shared";
import {
  type ParsedSkill,
  parseTaxonomyDocs,
} from "#src/seed-master/taxonomy/index";

export interface TemplateStructuralAffinityResult {
  readonly compatible: boolean;
  readonly reason: string;
}

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

const NUMBER_BOND_ALLOWED_STRANDS = new Set(["C1.NCOMP", "C1.ADD", "C1.SUB"]);
const CLOCK_HANDS_ALLOWED_SKILLS = new Set(["C1.MEAS.13"]);

function hasOrderedDatasetAxis(dataset: SkillDataset): boolean {
  if (!dataset.axes) {
    return false;
  }
  return Object.values(dataset.axes).some(
    (axis) =>
      typeof axis === "object" &&
      axis !== null &&
      !Array.isArray(axis) &&
      "ordered" in axis &&
      axis.ordered === true
  );
}

function checkBuilderDatasetRequirements(
  templateCode: string,
  dataset: SkillDataset,
  builderRequires: ProjectionRequires
): TemplateStructuralAffinityResult | null {
  if (dataset.items.length < builderRequires.min_items) {
    return {
      compatible: false,
      reason: `[BR-STS-10] Khuôn ${templateCode} đòi tối thiểu ${builderRequires.min_items} vật nhưng dataset ${dataset.skill_code} chỉ có ${dataset.items.length} vật`,
    };
  }

  for (const facet of builderRequires.needs ?? []) {
    const missingItem = dataset.items.find((item) => {
      if (facet === "audio") {
        return !item.audio_path || item.audio_path.trim().length === 0;
      }
      return !(facet in item) || Reflect.get(item, facet) === undefined;
    });
    if (missingItem) {
      return {
        compatible: false,
        reason: `[BR-STS-10] Khuôn ${templateCode} đòi trường bắt buộc '${facet}' nhưng vật ${missingItem.id} trong dataset ${dataset.skill_code} không có`,
      };
    }
  }
  return null;
}

function checkDatasetStructuralThinking(
  skill: {
    readonly code: string;
    readonly thinking_processes: readonly string[];
  },
  templateCode: string,
  dataset: SkillDataset
): TemplateStructuralAffinityResult | null {
  if (
    skill.thinking_processes.includes("compare") &&
    !(
      hasOrderedDatasetAxis(dataset) &&
      dataset.relations?.some((r) => r.type === "contrast")
    )
  ) {
    return {
      compatible: false,
      reason: `[BR-STS-10] Kỹ năng ${skill.code} khai compare nhưng dataset thiếu axes có thứ tự hoặc relations kiểu contrast để khuôn ${templateCode} tiêu thụ`,
    };
  }
  if (
    skill.thinking_processes.includes("match") &&
    !dataset.relations?.some((r) => r.type === "pair")
  ) {
    return {
      compatible: false,
      reason: `[BR-STS-10] Kỹ năng ${skill.code} khai match nhưng dataset thiếu relations kiểu pair để khuôn ${templateCode} tiêu thụ`,
    };
  }
  if (
    skill.thinking_processes.includes("sort") &&
    (!dataset.axes || Object.keys(dataset.axes).length === 0)
  ) {
    return {
      compatible: false,
      reason: `[BR-STS-10] Kỹ năng ${skill.code} khai sort nhưng dataset thiếu axes phân loại để khuôn ${templateCode} tiêu thụ`,
    };
  }
  return null;
}

/**
 * Kiểm tra engine tiêu thụ được cấu trúc bản chất mà kỹ năng và dataset khai (BR-STS-10),
 * không chỉ dựa trên giao tập tag tư duy khác rỗng.
 */
export function checkTemplateStructuralAffinity(
  skill: {
    readonly code: string;
    readonly strand_code?: string;
    readonly thinking_processes: readonly string[];
  },
  templateCode: string,
  dataset?: SkillDataset,
  builderRequires?: ProjectionRequires
): TemplateStructuralAffinityResult {
  const strandCode =
    skill.strand_code ?? skill.code.split(".").slice(0, 2).join(".");

  if (
    templateCode === "GT-007" &&
    !NUMBER_BOND_ALLOWED_STRANDS.has(strandCode)
  ) {
    return {
      compatible: false,
      reason: `[BR-STS-10] Khuôn GT-007 (number-bond) đòi cấu trúc gộp-tách phần-toàn thể, không khớp bản chất kỹ năng ${skill.code} (${strandCode})`,
    };
  }

  if (
    templateCode === "GT-016" &&
    !CLOCK_HANDS_ALLOWED_SKILLS.has(skill.code)
  ) {
    return {
      compatible: false,
      reason: `[BR-STS-10] Khuôn GT-016 (clock-hands) đòi cấu trúc thời gian/kim đồng hồ, không khớp bản chất kỹ năng ${skill.code} (${strandCode})`,
    };
  }

  if (dataset && builderRequires) {
    const reqErr = checkBuilderDatasetRequirements(
      templateCode,
      dataset,
      builderRequires
    );
    if (reqErr) {
      return reqErr;
    }
  }

  if (dataset) {
    const structErr = checkDatasetStructuralThinking(
      skill,
      templateCode,
      dataset
    );
    if (structErr) {
      return structErr;
    }
  }

  return { compatible: true, reason: "" };
}

export function matchTemplatesForSkill(
  skill: ParsedSkill,
  templates: Record<string, GameTemplate>,
  engineThinkingMap: Record<string, string[]>
): string[] {
  const matched: string[] = [];
  for (const [tCode, tObj] of Object.entries(templates)) {
    if (tCode === "GT-000" || (tObj as { kind?: string }).kind === "teach") {
      continue;
    }
    if (isTemplateAffinityMatch(skill, tCode, tObj, engineThinkingMap)) {
      matched.push(tCode);
    }
  }
  return matched;
}

function filterAssessTemplates(
  allTemplates: Record<string, GameTemplate>
): Record<string, GameTemplate> {
  const templates: Record<string, GameTemplate> = {};
  for (const [code, tmpl] of Object.entries(allTemplates)) {
    if (code !== "GT-000" && (tmpl as { kind?: string }).kind !== "teach") {
      templates[code] = tmpl;
    }
  }
  return templates;
}

function collectSkillMetrics(
  s: ParsedSkill,
  matchedCount: number,
  lists: {
    c1Below4: string[];
    allBelow2: string[];
    singleTemplateSkills: string[];
    zeroTemplateSkills: string[];
  }
): void {
  if (s.competency_code === "C1" && matchedCount < 4) {
    lists.c1Below4.push(s.code);
  }
  if (matchedCount < 2) {
    lists.allBelow2.push(s.code);
  }
  if (matchedCount === 1) {
    lists.singleTemplateSkills.push(s.code);
  }
  if (matchedCount === 0) {
    lists.zeroTemplateSkills.push(s.code);
  }
}

export function buildSkillTemplateAffinityMatrix(
  docsDir?: string,
  specsDir?: string,
  templatesOverride?: Record<string, GameTemplate>
): SkillAffinityMatrixData {
  const skills = parseTaxonomyDocs(docsDir ?? repoPath("docs/taxonomy"));
  const templates = filterAssessTemplates(templatesOverride ?? ALL_TEMPLATES);
  const engineThinkingMap = extractEngineThinkingMap(specsDir);

  const affinities: Record<string, string[]> = {};
  let band34SkillsCount = 0;
  const metricsLists = {
    c1Below4: [] as string[],
    allBelow2: [] as string[],
    singleTemplateSkills: [] as string[],
    zeroTemplateSkills: [] as string[],
  };

  for (const s of skills) {
    if (s.age_min === 3) {
      band34SkillsCount++;
    }

    const matched = matchTemplatesForSkill(s, templates, engineThinkingMap);
    affinities[s.code] = matched;
    collectSkillMetrics(s, matched.length, metricsLists);
  }

  const { c1Below4, allBelow2, singleTemplateSkills, zeroTemplateSkills } =
    metricsLists;
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

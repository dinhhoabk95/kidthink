/**
 * Spec sở hữu: docs/specs/08-quality/go-live-readiness.md
 * Rules: BR-GLR-01..09
 */

import { readFileSync } from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import {
  ALL_TEMPLATES,
  type GameTemplate,
} from "@mindkid/game-engine/registry";
import { CANONICAL_THEME_CODES } from "@mindkid/shared";
import { z } from "zod";
import { isLevelOutOfBand, toAgeBand } from "#src/gates/engine-content-depth";
import type { MvpCurriculumConfig } from "#src/seed-master/roadmap-curricula";
import type { ContentSeed, LessonSeed } from "#src/types";

export interface GoLiveConfig {
  version: number;
  last_updated: string;
  active_engines: string[];
  thresholds: {
    engine_render_coverage_percent: number;
    longest_flow_code: string;
    lesson_supply_target: number;
    min_levels_per_skill: number;
    content_depth_step: number;
  };
}

export interface GoLiveInput {
  config: GoLiveConfig;
  activeEngineIds: string[];
  implementedRenderEngineIds: string[];
  depthPassingEngineIds: string[];
  curriculaConfigs: MvpCurriculumConfig[];
  lessons: LessonSeed[];
  gameLevels: ContentSeed[];
  enforceContractParse?: boolean;
}

export interface GoLiveCheckItem {
  name: string;
  axis: "game_template" | "lesson_corpus";
  isHardBlock: boolean;
  expected: string;
  actual: string;
  passed: boolean;
  message?: string;
}

export interface GoLiveEvaluation {
  items: GoLiveCheckItem[];
  isGameAxisPassed: boolean;
  isLessonAxisPassed: boolean;
  isPassed: boolean;
  violations: string[];
}

function checkScopeAndRender(
  scopeEngines: string[],
  activeEngineIds: string[],
  implementedRenderEngineIds: string[],
  gameLevels: ContentSeed[],
  requiredCoveragePercent: number
): { items: GoLiveCheckItem[]; violations: string[]; passed: boolean } {
  const items: GoLiveCheckItem[] = [];
  const violations: string[] = [];

  const unexpected = activeEngineIds.filter((id) => !scopeEngines.includes(id));
  const outOfScopeLevels = gameLevels.filter(
    (gl) => !scopeEngines.includes(gl.header.template_code)
  );
  const scopePassed = unexpected.length === 0 && outOfScopeLevels.length === 0;
  items.push({
    name: "Tất cả engine active và level published nằm trong phạm vi cấu hình (BR-GLR-05)",
    axis: "game_template",
    isHardBlock: true,
    expected: "0 engine/level ngoài phạm vi",
    actual: `${unexpected.length} engine, ${outOfScopeLevels.length} level ngoài phạm vi`,
    passed: scopePassed,
    message: scopePassed
      ? undefined
      : `Ngoài phạm vi — engine: [${unexpected.join(", ")}], level: [${outOfScopeLevels.map((l) => l.header.code).join(", ")}]`,
  });
  if (!scopePassed) {
    violations.push(
      `BR-GLR-05: Có ${unexpected.length} engine active và ${outOfScopeLevels.length} level published ngoài phạm vi cấu hình.`
    );
  }

  const missingRender = scopeEngines.filter(
    (id) => !implementedRenderEngineIds.includes(id)
  );
  const coveragePercent =
    scopeEngines.length === 0
      ? 100
      : (implementedRenderEngineIds.length / scopeEngines.length) * 100;
  const renderPassed = coveragePercent >= requiredCoveragePercent;
  items.push({
    name: `Phủ render() >= ${requiredCoveragePercent}% (BR-ERC-01)`,
    axis: "game_template",
    isHardBlock: true,
    expected: `>= ${requiredCoveragePercent}%`,
    actual: `${coveragePercent.toFixed(0)}% (${implementedRenderEngineIds.length}/${scopeEngines.length} engine)`,
    passed: renderPassed,
    message: renderPassed
      ? undefined
      : `Engine thiếu render(): ${missingRender.join(", ")}`,
  });
  if (!renderPassed) {
    violations.push(
      `BR-ERC-01: Phủ render() ${coveragePercent.toFixed(0)}% < ${requiredCoveragePercent}%; thiếu ${missingRender.length} engine: ${missingRender.join(", ")}`
    );
  }

  return { items, violations, passed: scopePassed && renderPassed };
}

function checkDepthAndFreeEntry(
  scopeEngines: string[],
  depthPassingEngineIds: string[],
  gameLevels: ContentSeed[],
  step: number
): { items: GoLiveCheckItem[]; violations: string[]; passed: boolean } {
  const items: GoLiveCheckItem[] = [];
  const violations: string[] = [];

  const missingDepth = scopeEngines.filter(
    (id) => !depthPassingEngineIds.includes(id)
  );
  const depthPassed = missingDepth.length === 0;
  items.push({
    name: `${scopeEngines.length}/${scopeEngines.length} engine đạt sàn nội dung bậc ${step} (BR-ECD-01)`,
    axis: "game_template",
    isHardBlock: true,
    expected: `${scopeEngines.length}/${scopeEngines.length} engine`,
    actual: `${depthPassingEngineIds.length}/${scopeEngines.length} engine`,
    passed: depthPassed,
    message: depthPassed
      ? undefined
      : `Engine chưa đạt sàn nội dung: ${missingDepth.join(", ")}`,
  });
  if (!depthPassed) {
    violations.push(
      `BR-ECD-01: Có ${missingDepth.length} engine chưa đạt sàn nội dung: ${missingDepth.join(", ")}`
    );
  }

  const freeCount = new Map<string, number>();
  for (const id of scopeEngines) {
    freeCount.set(id, 0);
  }
  for (const gl of gameLevels) {
    const typeId = gl.header.template_code;
    const tier = gl.header.access_tier;
    if (
      typeId &&
      freeCount.has(typeId) &&
      (tier === "free" || tier === "login")
    ) {
      freeCount.set(typeId, (freeCount.get(typeId) ?? 0) + 1);
    }
  }

  const missingFree = scopeEngines.filter(
    (id) => (freeCount.get(id) ?? 0) === 0
  );
  const freePassed = missingFree.length === 0;
  items.push({
    name: "Mỗi engine có >=1 level free hoặc login (BR-ECD-07)",
    axis: "game_template",
    isHardBlock: true,
    expected: `${scopeEngines.length}/${scopeEngines.length} engine`,
    actual: `${scopeEngines.length - missingFree.length}/${scopeEngines.length} engine`,
    passed: freePassed,
    message: freePassed
      ? undefined
      : `Engine thiếu cửa vào free/login: ${missingFree.join(", ")}`,
  });
  if (!freePassed) {
    violations.push(
      `BR-ECD-07: Có ${missingFree.length} engine chưa có level free hoặc login: ${missingFree.join(", ")}`
    );
  }

  return { items, violations, passed: depthPassed && freePassed };
}

function shouldValidatePackObject(
  pack: ContentSeed["content_pack"],
  enforceContractParse: boolean
): boolean {
  if (enforceContractParse) {
    return true;
  }
  if (typeof pack !== "object" || pack === null) {
    return true;
  }
  return Object.keys(pack).length > 0;
}

function checkSingleLevelContracts(
  gl: ContentSeed,
  template: GameTemplate | undefined,
  enforceContractParse: boolean,
  invalidContentPacks: string[],
  invalidDifficultyParams: string[],
  outOfBandLevels: string[],
  invalidThemes: string[]
): void {
  const code = gl.header.code;
  if (
    !(gl.header.theme_tag && CANONICAL_THEME_CODES.has(gl.header.theme_tag))
  ) {
    invalidThemes.push(`${code}(${gl.header.theme_tag ?? ""})`);
  }
  if (!template) {
    return;
  }
  const band = toAgeBand(gl.header.age_min, gl.header.age_max);
  if (isLevelOutOfBand(gl, template, band)) {
    outOfBandLevels.push(code);
  }
  if (shouldValidatePackObject(gl.content_pack, enforceContractParse)) {
    const packParsed = template.content_contract.safeParse(gl.content_pack);
    if (!packParsed.success) {
      invalidContentPacks.push(code);
    }
  }
  if (shouldValidatePackObject(gl.difficulty_params, enforceContractParse)) {
    const diffParsed = template.difficulty_contract.safeParse(
      gl.difficulty_params
    );
    if (!diffParsed.success) {
      invalidDifficultyParams.push(code);
    }
  }
}

function checkLevelQualityContracts(
  gameLevels: ContentSeed[],
  enforceContractParse: boolean
): { items: GoLiveCheckItem[]; violations: string[]; passed: boolean } {
  const items: GoLiveCheckItem[] = [];
  const violations: string[] = [];
  const invalidContentPacks: string[] = [];
  const invalidDifficultyParams: string[] = [];
  const outOfBandLevels: string[] = [];
  const invalidThemes: string[] = [];

  for (const gl of gameLevels) {
    const template = ALL_TEMPLATES[gl.header.template_code];
    checkSingleLevelContracts(
      gl,
      template,
      enforceContractParse,
      invalidContentPacks,
      invalidDifficultyParams,
      outOfBandLevels,
      invalidThemes
    );
  }

  const total = gameLevels.length;
  const packPassed = invalidContentPacks.length === 0;
  items.push({
    name: "content_pack parse bằng content_contract (BR-GLR-02 / BR-GTC-10)",
    axis: "game_template",
    isHardBlock: true,
    expected: `${total}/${total} level`,
    actual: `${total - invalidContentPacks.length}/${total} level`,
    passed: packPassed,
    message: packPassed
      ? undefined
      : `Level lỗi content_pack: ${invalidContentPacks.slice(0, 5).join(", ")}`,
  });
  if (!packPassed) {
    violations.push(
      `BR-GLR-02 (BR-GTC-10): Có ${invalidContentPacks.length} level không parse được content_pack.`
    );
  }

  const diffPassed = invalidDifficultyParams.length === 0;
  items.push({
    name: "difficulty_params parse bằng difficulty_contract (BR-GLR-02)",
    axis: "game_template",
    isHardBlock: true,
    expected: `${total}/${total} level`,
    actual: `${total - invalidDifficultyParams.length}/${total} level`,
    passed: diffPassed,
    message: diffPassed
      ? undefined
      : `Level lỗi difficulty_params: ${invalidDifficultyParams.slice(0, 5).join(", ")}`,
  });
  if (!diffPassed) {
    violations.push(
      `BR-GLR-02: Có ${invalidDifficultyParams.length} level không parse được difficulty_params.`
    );
  }

  const bandPassed = outOfBandLevels.length === 0;
  items.push({
    name: "Band tuổi level nằm trong band engine (BR-ECD-13)",
    axis: "game_template",
    isHardBlock: true,
    expected: `${total}/${total} level`,
    actual: `${total - outOfBandLevels.length}/${total} level`,
    passed: bandPassed,
    message: bandPassed
      ? undefined
      : `Level lệch band tuổi: ${outOfBandLevels.slice(0, 5).join(", ")}`,
  });
  if (!bandPassed) {
    violations.push(
      `BR-ECD-13: Có ${outOfBandLevels.length} level gắn band tuổi ngoài phạm vi engine.`
    );
  }

  const themePassed = invalidThemes.length === 0;
  items.push({
    name: "theme_tag thuộc từ vựng đóng (BR-CTR-01)",
    axis: "game_template",
    isHardBlock: true,
    expected: `${total}/${total} level`,
    actual: `${total - invalidThemes.length}/${total} level`,
    passed: themePassed,
    message: themePassed
      ? undefined
      : `Level sai theme_tag: ${invalidThemes.slice(0, 5).join(", ")}`,
  });
  if (!themePassed) {
    violations.push(
      `BR-CTR-01: Có ${invalidThemes.length} level dùng theme_tag ngoài từ vựng đóng.`
    );
  }

  return {
    items,
    violations,
    passed: packPassed && diffPassed && bandPassed && themePassed,
  };
}

function evaluateGameAxis(
  config: GoLiveConfig,
  activeEngineIds: string[],
  implementedRenderEngineIds: string[],
  depthPassingEngineIds: string[],
  gameLevels: ContentSeed[],
  enforceContractParse: boolean
): { items: GoLiveCheckItem[]; isPassed: boolean; violations: string[] } {
  const scopeEngines = config.active_engines;
  const res1 = checkScopeAndRender(
    scopeEngines,
    activeEngineIds,
    implementedRenderEngineIds,
    gameLevels,
    config.thresholds.engine_render_coverage_percent
  );
  const res2 = checkDepthAndFreeEntry(
    scopeEngines,
    depthPassingEngineIds,
    gameLevels,
    config.thresholds.content_depth_step
  );
  const res3 = checkLevelQualityContracts(gameLevels, enforceContractParse);

  return {
    items: [...res1.items, ...res2.items, ...res3.items],
    isPassed: res1.passed && res2.passed && res3.passed,
    violations: [...res1.violations, ...res2.violations, ...res3.violations],
  };
}

function checkLessonSupplyAndFlow(
  publishedLessons: LessonSeed[],
  targetSupply: number,
  longestFlowCode: string,
  curriculaConfigs: MvpCurriculumConfig[]
): { items: GoLiveCheckItem[]; violations: string[]; passed: boolean } {
  const items: GoLiveCheckItem[] = [];
  const violations: string[] = [];

  const supplyPassed = publishedLessons.length >= targetSupply;
  items.push({
    name: `Cung giáo án đạt sàn ${targetSupply} tiết (BR-LCD-01)`,
    axis: "lesson_corpus",
    isHardBlock: true,
    expected: `>= ${targetSupply} tiết`,
    actual: `${publishedLessons.length} tiết`,
    passed: supplyPassed,
    message: supplyPassed
      ? undefined
      : `Thư viện thiếu ${targetSupply - publishedLessons.length} tiết`,
  });
  if (!supplyPassed) {
    violations.push(
      `BR-LCD-01: Thư viện giáo án chỉ có ${publishedLessons.length}/${targetSupply} tiết.`
    );
  }

  const curJ42 = curriculaConfigs.find((c) => c.code === longestFlowCode);
  const j42Published = curJ42?.status === "published";
  items.push({
    name: `Chương trình dài nhất (${longestFlowCode}) ở trạng thái published (BR-LCD-01)`,
    axis: "lesson_corpus",
    isHardBlock: true,
    expected: "published",
    actual: curJ42 ? curJ42.status : "missing",
    passed: j42Published,
  });
  if (!j42Published) {
    violations.push(
      `BR-LCD-01: Chương trình dài nhất ${longestFlowCode} chưa được published.`
    );
  }

  return { items, violations, passed: supplyPassed && j42Published };
}

function checkSkillLevelCoverage(
  publishedLessons: LessonSeed[],
  gameLevels: ContentSeed[],
  minLevelReq: number
): { items: GoLiveCheckItem[]; violations: string[]; passed: boolean } {
  const items: GoLiveCheckItem[] = [];
  const violations: string[] = [];

  const skillSet = new Set<string>();
  for (const les of publishedLessons) {
    for (const sk of les.header.skill_codes) {
      skillSet.add(sk);
    }
  }

  const skillLevelCounts = new Map<string, number>();
  for (const sk of skillSet) {
    skillLevelCounts.set(sk, 0);
  }
  for (const gl of gameLevels) {
    for (const glSkill of gl.header.skill_codes) {
      if (skillLevelCounts.has(glSkill)) {
        skillLevelCounts.set(glSkill, (skillLevelCounts.get(glSkill) ?? 0) + 1);
      }
    }
  }

  const deficientSkills = Array.from(skillLevelCounts.entries()).filter(
    ([_, count]) => count < minLevelReq
  );
  const skillLevelPassed = deficientSkills.length === 0;
  items.push({
    name: `Mỗi kỹ năng thư viện có >=${minLevelReq} game level published (BR-LCD-10)`,
    axis: "lesson_corpus",
    isHardBlock: true,
    expected: "0 kỹ năng thiếu level",
    actual: `${deficientSkills.length} kỹ năng thiếu level`,
    passed: skillLevelPassed,
    message: skillLevelPassed
      ? undefined
      : `Kỹ năng thiếu level: ${deficientSkills.map(([s, c]) => `${s} (${c}/${minLevelReq})`).join(", ")}`,
  });
  if (!skillLevelPassed) {
    violations.push(
      `BR-LCD-10: Có ${deficientSkills.length} kỹ năng chưa đạt sàn ${minLevelReq} level.`
    );
  }

  return { items, violations, passed: skillLevelPassed };
}

function evaluateLessonAxis(
  config: GoLiveConfig,
  curriculaConfigs: MvpCurriculumConfig[],
  lessons: LessonSeed[],
  gameLevels: ContentSeed[]
): { items: GoLiveCheckItem[]; isPassed: boolean; violations: string[] } {
  const publishedLessons = lessons;
  const res1 = checkLessonSupplyAndFlow(
    publishedLessons,
    config.thresholds.lesson_supply_target,
    config.thresholds.longest_flow_code,
    curriculaConfigs
  );
  const res2 = checkSkillLevelCoverage(
    publishedLessons,
    gameLevels,
    config.thresholds.min_levels_per_skill
  );

  return {
    items: [...res1.items, ...res2.items],
    isPassed: res1.passed && res2.passed,
    violations: [...res1.violations, ...res2.violations],
  };
}

/**
 * Đánh giá điều kiện Go-Live toàn diện theo BR-GLR-01..09
 */
export function evaluateGoLiveReadiness(input: GoLiveInput): GoLiveEvaluation {
  const {
    config,
    activeEngineIds,
    implementedRenderEngineIds,
    depthPassingEngineIds,
    curriculaConfigs,
    lessons,
    gameLevels,
    enforceContractParse = false,
  } = input;

  if (
    !config?.active_engines ||
    config.active_engines.length === 0 ||
    !curriculaConfigs ||
    curriculaConfigs.length === 0
  ) {
    return {
      items: [],
      isGameAxisPassed: false,
      isLessonAxisPassed: false,
      isPassed: false,
      violations: [
        "BR-GLR-06: Nguồn cấu hình hoặc dữ liệu chương trình không đọc được / rỗng.",
      ],
    };
  }

  const gameEval = evaluateGameAxis(
    config,
    activeEngineIds,
    implementedRenderEngineIds,
    depthPassingEngineIds,
    gameLevels,
    enforceContractParse
  );

  const lessonEval = evaluateLessonAxis(
    config,
    curriculaConfigs,
    lessons,
    gameLevels
  );

  return {
    items: [...gameEval.items, ...lessonEval.items],
    isGameAxisPassed: gameEval.isPassed,
    isLessonAxisPassed: lessonEval.isPassed,
    isPassed: gameEval.isPassed && lessonEval.isPassed,
    violations: [...gameEval.violations, ...lessonEval.violations],
  };
}

function formatItemsSection(
  items: GoLiveCheckItem[],
  axis: "game_template" | "lesson_corpus"
): string[] {
  const lines: string[] = [];
  for (const it of items.filter((i) => i.axis === axis)) {
    const status = it.passed ? "[PASS]" : "[BLOCKED]";
    lines.push(
      `${status} ${it.name} | Kỳ vọng: ${it.expected} | Thực tế: ${it.actual}`
    );
    if (it.message) {
      lines.push(`       -> ${it.message}`);
    }
  }
  return lines;
}

/**
 * Format báo cáo Go-Live Readiness
 */
export function formatGoLiveReport(evaluation: GoLiveEvaluation): string {
  const { items, isGameAxisPassed, isLessonAxisPassed, isPassed, violations } =
    evaluation;
  const lines: string[] = [];

  lines.push("===============================================================");
  lines.push(
    " BÁO CÁO ĐIỀU KIỆN SẴN SÀNG GO-LIVE (check:go-live - BR-GLR-01..09)"
  );
  lines.push("===============================================================");

  lines.push("\n--- TRỤC 1: GAME TEMPLATE & ENGINE RUNTIME ---");
  lines.push(...formatItemsSection(items, "game_template"));
  lines.push(
    `-> Trục Game Template: ${isGameAxisPassed ? "ĐẠT (PASS)" : "CHƯA ĐẠT (BLOCKED)"}`
  );

  lines.push("\n--- TRỤC 2: GIÁO ÁN BÀI GIẢNG & FLOW GHI DANH ---");
  lines.push(...formatItemsSection(items, "lesson_corpus"));
  lines.push(
    `-> Trục Giáo Án: ${isLessonAxisPassed ? "ĐẠT (PASS)" : "CHƯA ĐẠT (BLOCKED)"}`
  );

  if (violations.length > 0) {
    lines.push("\n--- DANH SÁCH CÁC MỤC CHẶN CỨNG CHƯA ĐẠT ---");
    for (const v of violations) {
      lines.push(` [CHẶN] ${v}`);
    }
  }

  lines.push(
    "\n==============================================================="
  );
  lines.push(
    `KẾT LUẬN GO-LIVE (BR-GLR-09): ${isPassed ? "SẴN SÀNG GO-LIVE (READY)" : "CHƯA SẴN SÀNG — LÙI NGÀY (BLOCKED)"}`
  );
  lines.push(
    "LƯU Ý (BR-GLR-07): Báo cáo này chỉ đo điều kiện sẵn sàng kỹ thuật và nội dung, KHÔNG phải bằng chứng hiệu quả sư phạm."
  );
  lines.push("===============================================================");

  return lines.join("\n");
}

export const goLiveConfigSchema = z.object({
  version: z.number(),
  last_updated: z.string(),
  active_engines: z.array(z.string()).min(1),
  thresholds: z.object({
    engine_render_coverage_percent: z.number(),
    longest_flow_code: z.string().min(1),
    lesson_supply_target: z.number().int().positive(),
    min_levels_per_skill: z.number().int().positive(),
    content_depth_step: z.number().int().nonnegative(),
  }),
});

export type RawGoLiveConfigInput =
  | GoLiveConfig
  | Record<string, string | number | boolean | null | object | undefined>;

export function parseGoLiveConfig(raw: RawGoLiveConfigInput): GoLiveConfig {
  const result = goLiveConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `config/go-live.json sai hình dạng: ${result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`
    );
  }
  return result.data;
}

export function loadGoLiveConfig(
  rawOverride?: RawGoLiveConfigInput
): GoLiveConfig {
  if (rawOverride !== undefined) {
    return parseGoLiveConfig(rawOverride);
  }
  const configPath = repoPath(
    "packages/content-build/src/thresholds/go-live.json"
  );
  const parsedJson: RawGoLiveConfigInput = JSON.parse(
    readFileSync(configPath, "utf8")
  );
  return parseGoLiveConfig(parsedJson);
}

/**
 * Spec sở hữu: docs/specs/05-content/engine-content-depth.md
 * Rules: BR-ECD-01..13
 *
 * Cổng sàn chiều sâu mỗi engine (Engine Content Depth Gate).
 */

import { readFileSync } from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import {
  type AgeBand,
  ALL_TEMPLATES,
  type GameTemplateDef,
} from "@mindkid/game-engine";
import type { ContentSeed } from "#src/seed-content/types";

export interface EngineStepCriteria {
  level_count: number;
  min_band_count: number;
  thinking_span: number;
  what_span: number;
  theme_span: number;
  difficulty_span: number;
  min_free_or_login: number;
  max_out_of_band?: number;
}

export interface EngineDepthConfig {
  active_step: number;
  date: string;
  history: Array<{ step: number; date: string }>;
  steps: Record<string, EngineStepCriteria>;
}

export interface EngineMetrics {
  engine_code: string;
  level_count: number;
  min_band_count: number;
  band_counts: Record<AgeBand, number>;
  out_of_band_count: number;
  thinking_span: number;
  what_span: number;
  theme_span: number;
  difficulty_span: number;
  free_or_login_count: number;
  valid_bands: AgeBand[];
}

export interface EngineDeficits {
  level_count: number;
  min_band_count: number;
  thinking_span: number;
  what_span: number;
  theme_span: number;
  difficulty_span: number;
  min_free_or_login: number;
  missing_bands: AgeBand[];
}

export interface EngineDepthViolation {
  ruleId:
    | "BR-ECD-01"
    | "BR-ECD-02"
    | "BR-ECD-03"
    | "BR-ECD-04"
    | "BR-ECD-05"
    | "BR-ECD-06"
    | "BR-ECD-07"
    | "BR-ECD-08"
    | "BR-ECD-09"
    | "BR-ECD-13";
  engine?: string;
  message: string;
  actual?: number | string;
  expected?: number | string;
}

export interface EngineDepthReport {
  passed: boolean;
  activeStep: number;
  totalEngines: number;
  passedEnginesCount: number;
  failedEnginesCount: number;
  totalOutOfBandLevels: number;
  perEngine: Record<
    string,
    {
      metrics: EngineMetrics;
      passed: boolean;
      deficits: EngineDeficits;
    }
  >;
  violations: EngineDepthViolation[];
}

const ALL_AGE_BANDS: AgeBand[] = ["3-4", "4-5", "5-6"];

export function toAgeBand(ageMin: number, ageMax?: number): AgeBand {
  if (ageMax !== undefined && ageMax <= 4) {
    return "3-4";
  }
  if (ageMin >= 5) {
    return "5-6";
  }
  if (ageMin <= 3) {
    return "3-4";
  }
  return "4-5";
}

export function loadEngineDepthConfig(customPath?: string): EngineDepthConfig {
  const configPath =
    customPath || repoPath("packages/db/config/engine-depth.json");
  const raw = readFileSync(configPath, "utf8");
  return JSON.parse(raw) as EngineDepthConfig;
}

export function validateEngineDepthHistory(config: EngineDepthConfig): void {
  const active = config.active_step;
  for (const h of config.history) {
    if (active < h.step) {
      throw new Error(
        `BR-ECD-08 (Bậc thang một chiều): active_step (${active}) không được nhỏ hơn mốc lịch sử đã đạt (${h.step} ngày ${h.date}).`
      );
    }
  }
}

interface SpanAccumulator {
  thinkingTags: Set<string>;
  whatTags: Set<string>;
  themeTags: Set<string>;
  difficulties: Set<number>;
  freeOrLoginCount: number;
}

function processSingleHeader(
  header: ContentSeed<unknown, unknown>["header"],
  acc: SpanAccumulator
): void {
  for (const t of header.thinking_tags || []) {
    if (t) {
      acc.thinkingTags.add(t);
    }
  }
  for (const w of header.what_tags || []) {
    if (w) {
      acc.whatTags.add(w);
    }
  }
  if (header.theme_tag) {
    acc.themeTags.add(header.theme_tag);
  }
  if (typeof header.difficulty === "number") {
    acc.difficulties.add(header.difficulty);
  }
  if (header.access_tier === "free" || header.access_tier === "login") {
    acc.freeOrLoginCount++;
  }
}

function accumulateSpans(
  levels: ContentSeed<unknown, unknown>[]
): SpanAccumulator {
  const acc: SpanAccumulator = {
    thinkingTags: new Set<string>(),
    whatTags: new Set<string>(),
    themeTags: new Set<string>(),
    difficulties: new Set<number>(),
    freeOrLoginCount: 0,
  };

  for (const lvl of levels) {
    processSingleHeader(lvl.header, acc);
  }

  return acc;
}

export function computeEngineMetrics(
  template: GameTemplateDef,
  levels: ContentSeed<unknown, unknown>[]
): EngineMetrics {
  const engineLevels = levels.filter(
    (l) => l.header.template_code === template.code
  );

  const bannedBands = new Set<string>(template.banned_age_bands || []);
  const validBands = ALL_AGE_BANDS.filter((b) => !bannedBands.has(b));

  const bandCounts: Record<AgeBand, number> = {
    "3-4": 0,
    "4-5": 0,
    "5-6": 0,
  };

  let out_of_band_count = 0;
  for (const lvl of engineLevels) {
    const band = toAgeBand(lvl.header.age_min, lvl.header.age_max);
    bandCounts[band] = (bandCounts[band] || 0) + 1;
    if (bannedBands.has(band)) {
      out_of_band_count++;
    }
  }

  const spans = accumulateSpans(engineLevels);

  let min_band_count = 0;
  if (validBands.length > 0) {
    min_band_count = Math.min(...validBands.map((b) => bandCounts[b] || 0));
  }

  return {
    engine_code: template.code,
    level_count: engineLevels.length,
    min_band_count,
    band_counts: bandCounts,
    out_of_band_count,
    thinking_span: spans.thinkingTags.size,
    what_span: spans.whatTags.size,
    theme_span: spans.themeTags.size,
    difficulty_span: spans.difficulties.size,
    free_or_login_count: spans.freeOrLoginCount,
    valid_bands: validBands,
  };
}

function calculateDeficits(
  metrics: EngineMetrics,
  criteria: EngineStepCriteria
): EngineDeficits {
  return {
    level_count: Math.max(0, criteria.level_count - metrics.level_count),
    min_band_count: Math.max(
      0,
      criteria.min_band_count - metrics.min_band_count
    ),
    thinking_span: Math.max(0, criteria.thinking_span - metrics.thinking_span),
    what_span: Math.max(0, criteria.what_span - metrics.what_span),
    theme_span: Math.max(0, criteria.theme_span - metrics.theme_span),
    difficulty_span: Math.max(
      0,
      criteria.difficulty_span - metrics.difficulty_span
    ),
    min_free_or_login: Math.max(
      0,
      criteria.min_free_or_login - metrics.free_or_login_count
    ),
    missing_bands: metrics.valid_bands.filter(
      (b) => (metrics.band_counts[b] || 0) < criteria.min_band_count
    ),
  };
}

function collectViolationsForEngine(
  engineCode: string,
  metrics: EngineMetrics,
  deficits: EngineDeficits,
  criteria: EngineStepCriteria
): EngineDepthViolation[] {
  const violations: EngineDepthViolation[] = [];
  const maxAllowed = criteria.max_out_of_band ?? 0;

  if (maxAllowed === 0 && metrics.out_of_band_count > 0) {
    violations.push({
      ruleId: "BR-ECD-13",
      engine: engineCode,
      message: `Engine ${engineCode} có ${metrics.out_of_band_count} level vi phạm banned_age_bands.`,
      actual: metrics.out_of_band_count,
      expected: 0,
    });
  }
  if (deficits.level_count > 0) {
    violations.push({
      ruleId: "BR-ECD-01",
      engine: engineCode,
      message: `Engine ${engineCode} thiếu ${deficits.level_count} level (có ${metrics.level_count}/${criteria.level_count}).`,
      actual: metrics.level_count,
      expected: criteria.level_count,
    });
  }
  if (deficits.min_band_count > 0) {
    violations.push({
      ruleId: "BR-ECD-02",
      engine: engineCode,
      message: `Engine ${engineCode} thiếu level cho các band tuổi: ${deficits.missing_bands.join(", ")} (yêu cầu ≥${criteria.min_band_count} mỗi band hợp lệ).`,
      actual: metrics.min_band_count,
      expected: criteria.min_band_count,
    });
  }
  if (deficits.thinking_span > 0) {
    violations.push({
      ruleId: "BR-ECD-03",
      engine: engineCode,
      message: `Engine ${engineCode} thiếu ${deficits.thinking_span} giá trị thinking tag (có ${metrics.thinking_span}/${criteria.thinking_span}).`,
      actual: metrics.thinking_span,
      expected: criteria.thinking_span,
    });
  }
  if (deficits.what_span > 0) {
    violations.push({
      ruleId: "BR-ECD-04",
      engine: engineCode,
      message: `Engine ${engineCode} thiếu ${deficits.what_span} giá trị what tag (có ${metrics.what_span}/${criteria.what_span}).`,
      actual: metrics.what_span,
      expected: criteria.what_span,
    });
  }
  if (deficits.theme_span > 0) {
    violations.push({
      ruleId: "BR-ECD-05",
      engine: engineCode,
      message: `Engine ${engineCode} thiếu ${deficits.theme_span} giá trị theme tag (có ${metrics.theme_span}/${criteria.theme_span}).`,
      actual: metrics.theme_span,
      expected: criteria.theme_span,
    });
  }
  if (deficits.difficulty_span > 0) {
    violations.push({
      ruleId: "BR-ECD-06",
      engine: engineCode,
      message: `Engine ${engineCode} thiếu ${deficits.difficulty_span} mức độ khó khác nhau (có ${metrics.difficulty_span}/${criteria.difficulty_span}).`,
      actual: metrics.difficulty_span,
      expected: criteria.difficulty_span,
    });
  }
  if (deficits.min_free_or_login > 0) {
    violations.push({
      ruleId: "BR-ECD-07",
      engine: engineCode,
      message: `Engine ${engineCode} chưa có level free hoặc login (yêu cầu ≥${criteria.min_free_or_login}).`,
      actual: metrics.free_or_login_count,
      expected: criteria.min_free_or_login,
    });
  }

  return violations;
}

export function evaluateEngineDepth(
  levels: ContentSeed<unknown, unknown>[],
  config: EngineDepthConfig,
  customTemplates?: Record<string, GameTemplateDef>
): EngineDepthReport {
  validateEngineDepthHistory(config);

  if (!levels || levels.length === 0) {
    throw new Error(
      "Nguồn corpus seed rỗng hoặc không đọc được. Cổng dừng với mã lỗi (BR-ECD-11)."
    );
  }

  const templates = customTemplates || ALL_TEMPLATES;
  const activeTemplates = Object.values(templates).filter(
    (t) => (t as GameTemplateDef & { status?: string }).status !== "deprecated"
  );

  const stepCriteria = config.steps[String(config.active_step)];
  if (!stepCriteria) {
    throw new Error(
      `Không tìm thấy tiêu chí sàn cho bậc active_step = ${config.active_step} trong config.`
    );
  }

  const perEngine: EngineDepthReport["perEngine"] = {};
  const violations: EngineDepthViolation[] = [];
  let passedEnginesCount = 0;
  let failedEnginesCount = 0;
  let totalOutOfBandLevels = 0;

  for (const tmpl of activeTemplates) {
    const metrics = computeEngineMetrics(tmpl, levels);
    totalOutOfBandLevels += metrics.out_of_band_count;

    const deficits = calculateDeficits(metrics, stepCriteria);
    const engineViolations = collectViolationsForEngine(
      tmpl.code,
      metrics,
      deficits,
      stepCriteria
    );

    const enginePassed = engineViolations.length === 0;
    if (enginePassed) {
      passedEnginesCount++;
    } else {
      failedEnginesCount++;
      violations.push(...engineViolations);
    }

    perEngine[tmpl.code] = {
      metrics,
      passed: enginePassed,
      deficits,
    };
  }

  const maxAllowed = stepCriteria.max_out_of_band ?? 0;
  if (totalOutOfBandLevels > maxAllowed) {
    violations.push({
      ruleId: "BR-ECD-13",
      message: `Tổng số level vi phạm band (${totalOutOfBandLevels}) vượt quá trần cho phép của bậc thang (${maxAllowed}).`,
      actual: totalOutOfBandLevels,
      expected: maxAllowed,
    });
  }

  return {
    passed: violations.length === 0,
    activeStep: config.active_step,
    totalEngines: activeTemplates.length,
    passedEnginesCount,
    failedEnginesCount,
    totalOutOfBandLevels,
    perEngine,
    violations,
  };
}

function formatSingleEngineDetails(
  deficits: EngineDeficits,
  outOfBandCount: number
): string[] {
  const details: string[] = [];
  if (deficits.level_count > 0) {
    details.push(`thiếu ${deficits.level_count} level`);
  }
  if (deficits.missing_bands.length > 0) {
    details.push(`thiếu level cho band [${deficits.missing_bands.join(", ")}]`);
  }
  if (deficits.thinking_span > 0) {
    details.push(`thiếu ${deficits.thinking_span} thinking tag`);
  }
  if (deficits.what_span > 0) {
    details.push(`thiếu ${deficits.what_span} what tag`);
  }
  if (deficits.theme_span > 0) {
    details.push(`thiếu ${deficits.theme_span} theme tag`);
  }
  if (deficits.difficulty_span > 0) {
    details.push(`thiếu ${deficits.difficulty_span} mức độ khó`);
  }
  if (deficits.min_free_or_login > 0) {
    details.push("chưa có level free/login");
  }
  if (outOfBandCount > 0) {
    details.push(`${outOfBandCount} level vi phạm band cấm`);
  }
  return details;
}

export function formatEngineDepthReport(report: EngineDepthReport): string {
  const lines: string[] = [];
  lines.push(`check:engine-depth  bậc ${report.activeStep}`);
  lines.push(
    `  ${report.totalEngines} engine active, ${report.passedEnginesCount} đạt, ${report.failedEnginesCount} thủng`
  );

  for (const [code, info] of Object.entries(report.perEngine)) {
    if (!info.passed) {
      const m = info.metrics;
      const bandStr = m.valid_bands
        .map((b) => `${b}:${m.band_counts[b] || 0}`)
        .join(" ");

      lines.push(
        `  ${code}  level ${m.level_count}  band ${bandStr}  thinking ${m.thinking_span}  what ${m.what_span}  theme ${m.theme_span}  diff ${m.difficulty_span}`
      );

      const details = formatSingleEngineDetails(
        info.deficits,
        m.out_of_band_count
      );
      lines.push(`          ${details.join(", ")}`);
    }
  }

  return lines.join("\n");
}

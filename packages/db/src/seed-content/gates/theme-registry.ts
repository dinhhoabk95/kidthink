/**
 * Spec sở hữu: docs/specs/05-content/content-theme-registry.md
 * Rules: BR-CTR-01..12
 *
 * Cổng thẩm định chủ đề nội dung (theme registry gate).
 */

import { readFileSync } from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { isValidRef } from "@mindkid/emoji";
import {
  CANONICAL_THEME_CODES,
  CONTENT_THEMES,
  getTheme,
} from "@mindkid/shared";
import type { ContentSeed } from "#src/seed-content/types";

export interface ThemeCapsConfig {
  date: string;
  catalog_max_ratio: number;
  engine_max_ratio: number;
  min_themes_count: number;
  min_levels_per_theme: number;
  stepwise_caps: Record<string, number>;
  history: Array<{ date: string; [theme: string]: number | string }>;
}

export interface ThemeViolation {
  ruleId:
    | "BR-CTR-01"
    | "BR-CTR-02"
    | "BR-CTR-03"
    | "BR-CTR-04"
    | "BR-CTR-05"
    | "BR-CTR-08"
    | "BR-CTR-09";
  type: "error" | "warning";
  code?: string;
  message: string;
  theme?: string;
  actual?: number | string;
  expected?: number | string;
  neededLevels?: number;
}

export interface ThemeRegistryReport {
  passed: boolean;
  totalPublishedLevels: number;
  themeCounts: Record<string, number>;
  themeRatios: Record<string, number>;
  violations: ThemeViolation[];
  errors: ThemeViolation[];
  warnings: ThemeViolation[];
}

export function loadThemeCapsConfig(customPath?: string): ThemeCapsConfig {
  const configPath =
    customPath || repoPath("packages/db/config/theme-caps.json");
  const raw = readFileSync(configPath, "utf8");
  return JSON.parse(raw) as ThemeCapsConfig;
}

function compareHistoryPair(
  prev: Record<string, number | string>,
  curr: Record<string, number | string>
): string[] {
  const errs: string[] = [];
  for (const key of Object.keys(curr)) {
    if (key === "date") {
      continue;
    }
    const prevVal = Number(prev[key]);
    const currVal = Number(curr[key]);
    if (
      !(Number.isNaN(prevVal) || Number.isNaN(currVal)) &&
      currVal > prevVal
    ) {
      errs.push(
        `Ngưỡng bậc thang của '${key}' ngày ${curr.date} (${currVal}) TĂNG so với ngày ${prev.date} (${prevVal}). Quy tắc: ngưỡng chỉ được GIẢM.`
      );
    }
  }
  return errs;
}

/**
 * Khẳng định ngưỡng trong theme-caps.json chỉ GIẢM hoặc giữ nguyên theo thời gian.
 */
export function validateThemeCapsHistory(config: ThemeCapsConfig): {
  valid: boolean;
  errors: string[];
} {
  const history = config.history ?? [];
  if (history.length <= 1) {
    return { valid: true, errors: [] };
  }

  const errors: string[] = [];
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const curr = history[i];
    if (prev && curr) {
      errors.push(...compareHistoryPair(prev, curr));
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateAgeFloor(
  header: ContentSeed["header"],
  trimmedTheme: string
): ThemeViolation | undefined {
  const themeDef = getTheme(trimmedTheme);
  if (!themeDef) {
    return undefined;
  }
  const ageMin = header.age_min;
  const ageMax = header.age_max ?? ageMin;
  if (ageMax < themeDef.age_floor) {
    return {
      ruleId: "BR-CTR-09",
      type: "error",
      code: header.code,
      theme: trimmedTheme,
      actual: `${ageMin}-${ageMax}`,
      expected: `>= ${themeDef.age_floor}`,
      message: `Level '${header.code}' (độ tuổi ${ageMin}-${ageMax}) mang chủ đề '${trimmedTheme}' có age_floor là ${themeDef.age_floor}.`,
    };
  }
  return undefined;
}

function validateLevelHeader(level: ContentSeed): {
  valid: boolean;
  violation?: ThemeViolation;
  trimmedTheme?: string;
} {
  const header = level.header;
  const levelCode = header.code;
  const themeTag = header.theme_tag;

  if (!themeTag || typeof themeTag !== "string" || themeTag.trim() === "") {
    return {
      valid: false,
      violation: {
        ruleId: "BR-CTR-03",
        type: "error",
        code: levelCode,
        message: `Level '${levelCode}' thiếu theme_tag hoặc theme_tag để trống.`,
      },
    };
  }

  const trimmedTheme = themeTag.trim();
  if (!CANONICAL_THEME_CODES.has(trimmedTheme)) {
    return {
      valid: false,
      violation: {
        ruleId: "BR-CTR-01",
        type: "error",
        code: levelCode,
        theme: trimmedTheme,
        message: `Level '${levelCode}' chứa theme_tag '${trimmedTheme}' không thuộc 14 chủ đề hợp lệ của từ vựng đóng.`,
      },
    };
  }

  const ageFloorViolation = validateAgeFloor(header, trimmedTheme);
  if (ageFloorViolation) {
    return { valid: false, violation: ageFloorViolation };
  }

  return { valid: true, trimmedTheme };
}

function checkCatalogCaps(
  themeCounts: Record<string, number>,
  totalPublished: number,
  config: ThemeCapsConfig
): { themeRatios: Record<string, number>; violations: ThemeViolation[] } {
  const themeRatios: Record<string, number> = {};
  const violations: ThemeViolation[] = [];

  if (totalPublished === 0) {
    return { themeRatios, violations };
  }

  for (const [theme, count] of Object.entries(themeCounts)) {
    const ratio = count / totalPublished;
    themeRatios[theme] = ratio;

    const allowedCap = config.stepwise_caps[theme] ?? config.catalog_max_ratio;
    if (ratio > allowedCap + 0.001) {
      const needed = Math.ceil(count / allowedCap) - totalPublished;
      violations.push({
        ruleId: "BR-CTR-04",
        type: "error",
        theme,
        actual: `${(ratio * 100).toFixed(1)}%`,
        expected: `<=${(allowedCap * 100).toFixed(1)}%`,
        neededLevels: needed,
        message: `Chủ đề '${theme}' chiếm ${(ratio * 100).toFixed(1)}% (${count}/${totalPublished}) vượt trần ${(allowedCap * 100).toFixed(1)}%. Cần thêm ít nhất ${needed} level ở các chủ đề khác để hạ tỉ lệ.`,
      });
    }
  }

  return { themeRatios, violations };
}

function checkEngineCaps(
  engineThemeCounts: Record<string, Record<string, number>>,
  engineTotalLevels: Record<string, number>,
  config: ThemeCapsConfig,
  phase: "P3" | "P4" | "P5"
): ThemeViolation[] {
  const violations: ThemeViolation[] = [];

  for (const [engineCode, tCounts] of Object.entries(engineThemeCounts)) {
    const eTotal = engineTotalLevels[engineCode] || 0;
    if (eTotal < 6) {
      continue;
    }

    for (const [theme, count] of Object.entries(tCounts)) {
      const eRatio = count / eTotal;
      if (eRatio > config.engine_max_ratio + 0.001) {
        violations.push({
          ruleId: "BR-CTR-05",
          type: phase === "P5" ? "error" : "warning",
          theme,
          actual: `${(eRatio * 100).toFixed(1)}%`,
          expected: `<=${(config.engine_max_ratio * 100).toFixed(1)}%`,
          message: `Engine '${engineCode}' có chủ đề '${theme}' chiếm ${(eRatio * 100).toFixed(1)}% (${count}/${eTotal}) vượt trần ${(config.engine_max_ratio * 100).toFixed(1)}%.`,
        });
      }
    }
  }

  return violations;
}

function checkThemeVocabulary(): ThemeViolation[] {
  const violations: ThemeViolation[] = [];
  for (const theme of CONTENT_THEMES) {
    if (!theme.nouns || theme.nouns.length < 3) {
      violations.push({
        ruleId: "BR-CTR-08",
        type: "error",
        theme: theme.code,
        actual: theme.nouns?.length ?? 0,
        expected: ">= 3",
        message: `Chủ đề '${theme.code}' có ${theme.nouns?.length ?? 0} danh từ (yêu cầu >= 3 danh từ có emoji).`,
      });
    } else {
      for (const noun of theme.nouns) {
        if (!isValidRef(noun.emoji_ref)) {
          violations.push({
            ruleId: "BR-CTR-08",
            type: "error",
            theme: theme.code,
            message: `Danh từ '${noun.text_vi}' của chủ đề '${theme.code}' có emoji_ref '${noun.emoji_ref}' không tồn tại trong emoji registry.`,
          });
        }
      }
    }
  }
  return violations;
}

interface AggregateLevelResult {
  violations: ThemeViolation[];
  themeCounts: Record<string, number>;
  engineThemeCounts: Record<string, Record<string, number>>;
  engineTotalLevels: Record<string, number>;
  totalPublished: number;
}

function aggregateLevels(levels: readonly ContentSeed[]): AggregateLevelResult {
  const violations: ThemeViolation[] = [];
  const themeCounts: Record<string, number> = {};
  for (const code of CANONICAL_THEME_CODES) {
    themeCounts[code] = 0;
  }

  const engineThemeCounts: Record<string, Record<string, number>> = {};
  const engineTotalLevels: Record<string, number> = {};
  let totalPublished = 0;

  for (const level of levels) {
    const res = validateLevelHeader(level);
    if (!(res.valid && res.trimmedTheme)) {
      if (res.violation) {
        violations.push(res.violation);
      }
      continue;
    }
    const theme = res.trimmedTheme;
    totalPublished++;
    themeCounts[theme] = (themeCounts[theme] || 0) + 1;

    const tpl = level.header.template_code;
    if (tpl) {
      engineThemeCounts[tpl] = engineThemeCounts[tpl] || {};
      engineThemeCounts[tpl][theme] = (engineThemeCounts[tpl][theme] || 0) + 1;
      engineTotalLevels[tpl] = (engineTotalLevels[tpl] || 0) + 1;
    }
  }

  return {
    violations,
    themeCounts,
    engineThemeCounts,
    engineTotalLevels,
    totalPublished,
  };
}

/**
 * Thẩm định toàn diện danh mục game level theo các quy tắc chủ đề (BR-CTR-01..12).
 */
export function evaluateThemeRegistry(
  levels: readonly ContentSeed[],
  config: ThemeCapsConfig = loadThemeCapsConfig(),
  options: { phase?: "P3" | "P4" | "P5"; checkVocabulary?: boolean } = {}
): ThemeRegistryReport {
  const phase = options.phase ?? "P4";
  const checkVocab = options.checkVocabulary ?? true;

  if (!levels || levels.length === 0) {
    const emptyErr: ThemeViolation = {
      ruleId: "BR-CTR-03",
      type: "error",
      message:
        "Nguồn không đọc được hoặc không có level nào trong danh mục seed.",
    };
    return {
      passed: false,
      totalPublishedLevels: 0,
      themeCounts: {},
      themeRatios: {},
      violations: [emptyErr],
      errors: [emptyErr],
      warnings: [],
    };
  }

  const agg = aggregateLevels(levels);
  const violations: ThemeViolation[] = [...agg.violations];

  const catResult = checkCatalogCaps(
    agg.themeCounts,
    agg.totalPublished,
    config
  );
  violations.push(...catResult.violations);

  const engViolations = checkEngineCaps(
    agg.engineThemeCounts,
    agg.engineTotalLevels,
    config,
    phase
  );
  violations.push(...engViolations);

  if (checkVocab) {
    violations.push(...checkThemeVocabulary());
  }

  const errors = violations.filter((v) => v.type === "error");
  const warnings = violations.filter((v) => v.type === "warning");

  return {
    passed: errors.length === 0,
    totalPublishedLevels: agg.totalPublished,
    themeCounts: agg.themeCounts,
    themeRatios: catResult.themeRatios,
    violations,
    errors,
    warnings,
  };
}

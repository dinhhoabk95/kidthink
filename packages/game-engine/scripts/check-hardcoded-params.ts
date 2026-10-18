/**
 * Cổng kiểm tra số cứng (magic numbers) trong templates/{name}/session.ts (BR-LDC-06)
 * và đếm .default(...) trên trường điều khiển độ khó (Task #263 T6 / BR-LDC-07).
 *
 * Giới hạn nợ kỹ thuật: nợ chỉ được phép giảm (ratchet gate).
 *
 * Chạy: pnpm --filter @mindkid/game-engine check:hardcoded-params
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { repoPath } from "@mindkid/config/paths";

const TEMPLATES_DIR = repoPath("packages/game-engine/src/templates");
const BASELINE_PATH = repoPath(
  "packages/game-engine/config/hardcoded-params-baseline.json"
);

const STRIP_STRINGS_REGEX = /(["'])(?:(?=(\\?))\2.)*?\1|`[^`]*`/g;
const NON_TRIVIAL_NUMBERS_REGEX = /\b(?!(?:0|1)\b)\d+(\.\d+)?\b/g;
const DIFFICULTY_SCHEMA_REGEX =
  /DifficultySchema\s*=\s*z\.object\(\{([\s\S]*?)\}\);/;
const DEFAULT_METHOD_REGEX = /\.default\(/g;
const FORBIDDEN_ITEM_COUNT_DEFAULT_REGEX =
  /\bitem_count\s*:[^\n,}]*\.default\(/;

export interface BaselineConfig {
  max_allowed_lines: number;
  max_allowed_defaults: number;
  date: string;
  note?: string;
}

/**
 * BR-LDC-06: Đếm số dòng chứa hằng số điều khiển độ khó fix cứng trong session.ts.
 */
export function countHardcodedLinesInCode(content: string): number {
  const lines = content.split("\n");
  let count = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("import") ||
      trimmed.startsWith("export type") ||
      trimmed.startsWith("export interface")
    ) {
      continue;
    }

    const clean = trimmed.replace(STRIP_STRINGS_REGEX, '""');
    const matches = clean.match(NON_TRIVIAL_NUMBERS_REGEX);
    if (matches && matches.length > 0) {
      count++;
    }
  }

  return count;
}

/**
 * BR-LDC-07: Đếm số lần sử dụng .default(...) trong DifficultySchema.
 */
export function countSchemaDefaultsInCode(content: string): number {
  const match = content.match(DIFFICULTY_SCHEMA_REGEX);
  if (!match?.[1]) {
    return 0;
  }
  const defaults = match[1].match(DEFAULT_METHOD_REGEX);
  return defaults ? defaults.length : 0;
}

/**
 * BR-LDC-07: Trường điều khiển độ khó bắt buộc (item_count) CẤM gắn .default(...) trong DifficultySchema.
 */
export function hasForbiddenDifficultyDefault(content: string): boolean {
  const match = content.match(DIFFICULTY_SCHEMA_REGEX);
  if (!match?.[1]) {
    return false;
  }
  return FORBIDDEN_ITEM_COUNT_DEFAULT_REGEX.test(match[1]);
}

export function scanHardcodedTotals(templatesDir: string): {
  totalLines: number;
  totalDefaults: number;
  forbiddenDefaultEngines: string[];
} {
  const dirs = fs
    .readdirSync(templatesDir)
    .filter((d) => d.startsWith("GT-"))
    .sort();

  let totalLines = 0;
  let totalDefaults = 0;
  const forbiddenDefaultEngines: string[] = [];

  for (const dir of dirs) {
    const sessionFile = path.join(templatesDir, dir, "session.ts");
    if (fs.existsSync(sessionFile)) {
      const content = fs.readFileSync(sessionFile, "utf-8");
      totalLines += countHardcodedLinesInCode(content);
    }

    const templateFile = path.join(templatesDir, dir, "template.ts");
    if (fs.existsSync(templateFile)) {
      const content = fs.readFileSync(templateFile, "utf-8");
      totalDefaults += countSchemaDefaultsInCode(content);
      if (hasForbiddenDifficultyDefault(content)) {
        forbiddenDefaultEngines.push(dir);
      }
    }
  }

  return { totalLines, totalDefaults, forbiddenDefaultEngines };
}

function updateBaselineFile(
  baseline: BaselineConfig,
  totalLines: number,
  totalDefaults: number
): void {
  let updated = false;
  if (totalLines <= baseline.max_allowed_lines) {
    baseline.max_allowed_lines = totalLines;
    updated = true;
  }
  if (totalDefaults <= baseline.max_allowed_defaults) {
    baseline.max_allowed_defaults = totalDefaults;
    updated = true;
  }
  if (updated) {
    baseline.date = new Date().toISOString().split("T")[0] || "";
    fs.writeFileSync(
      BASELINE_PATH,
      `${JSON.stringify(baseline, null, 2)}\n`,
      "utf-8"
    );
    console.log("✓ Đã cập nhật baseline ratchet mới.");
  }
}

export function scanHardcodedParams(options?: {
  updateBaseline?: boolean;
  maxAllowedLines?: number;
  maxAllowedDefaults?: number;
}): {
  totalLines: number;
  totalDefaults: number;
  forbiddenDefaultEngines: string[];
  passed: boolean;
  maxAllowedLines: number;
  maxAllowedDefaults: number;
} {
  const rawBaseline = fs.readFileSync(BASELINE_PATH, "utf-8");
  const baseline = JSON.parse(rawBaseline) as BaselineConfig;
  const maxAllowedLines =
    options?.maxAllowedLines ?? baseline.max_allowed_lines;
  const maxAllowedDefaults =
    options?.maxAllowedDefaults ?? baseline.max_allowed_defaults;

  const { totalLines, totalDefaults, forbiddenDefaultEngines } =
    scanHardcodedTotals(TEMPLATES_DIR);

  console.log(
    "=== CỔNG CHECK:HARDCODED-PARAMS (Task #263 T6 / BR-LDC-06, BR-LDC-07) ==="
  );
  console.log(
    `Số dòng chứa số cứng trong session.ts (BR-LDC-06): ${totalLines} (trần: ${maxAllowedLines})`
  );
  console.log(
    `Số .default(...) trong DifficultySchema (BR-LDC-07): ${totalDefaults} (trần: ${maxAllowedDefaults})`
  );

  if (options?.updateBaseline) {
    updateBaselineFile(baseline, totalLines, totalDefaults);
  }

  const passedLines = totalLines <= maxAllowedLines;
  const passedDefaults =
    totalDefaults <= maxAllowedDefaults && forbiddenDefaultEngines.length === 0;
  const passed = passedLines && passedDefaults;

  if (!passedLines) {
    console.error(
      `✗ [BR-LDC-06] Số dòng chứa số cứng (${totalLines}) vượt trần cho phép (${maxAllowedLines}).`
    );
  }
  if (totalDefaults > maxAllowedDefaults) {
    console.error(
      `✗ [BR-LDC-07] Số .default(...) trong schema (${totalDefaults}) vượt trần cho phép (${maxAllowedDefaults}).`
    );
  }
  if (forbiddenDefaultEngines.length > 0) {
    console.error(
      `✗ [BR-LDC-07] Trường bắt buộc item_count dùng .default(...) tại: ${forbiddenDefaultEngines.join(", ")}.`
    );
  }
  if (passed) {
    console.log("✓ Số cứng và .default(...) nằm trong hạn mức trần ratchet.");
  }

  return {
    totalLines,
    totalDefaults,
    forbiddenDefaultEngines,
    passed,
    maxAllowedLines,
    maxAllowedDefaults,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const isUpdate = process.argv.includes("--update-baseline");
  const result = scanHardcodedParams({ updateBaseline: isUpdate });
  process.exit(result.passed ? 0 : 1);
}

/**
 * Cổng kiểm tra số cứng (magic numbers) trong templates/{name}/session.ts
 * và đếm .default(...) trên trường điều khiển độ khó (Task #263 T6 / BR-LDC-06..07).
 *
 * Giới hạn nợ kỹ thuật: nợ chỉ được phép giảm (ratchet gate).
 *
 * Chạy: pnpm --filter @mindkid/game-engine check:hardcoded-params
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../../..");
const TEMPLATES_DIR = path.join(
  REPO_ROOT,
  "packages/game-engine/src/templates"
);
const BASELINE_PATH = path.join(
  REPO_ROOT,
  "packages/game-engine/config/hardcoded-params-baseline.json"
);

const STRIP_STRINGS_REGEX = /(["'])(?:(?=(\\?))\2.)*?\1|`[^`]*`/g;
const NON_TRIVIAL_NUMBERS_REGEX = /\b(?!(?:0|1)\b)\d+(\.\d+)?\b/g;
const DIFFICULTY_SCHEMA_REGEX =
  /DifficultySchema\s*=\s*z\.object\(\{([\s\S]*?)\}\);/;
const DEFAULT_METHOD_REGEX = /\.default\(/g;

export interface BaselineConfig {
  max_allowed_lines: number;
  max_allowed_defaults: number;
  date: string;
  note?: string;
}

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

export function countSchemaDefaultsInCode(content: string): number {
  const match = content.match(DIFFICULTY_SCHEMA_REGEX);
  if (!match?.[1]) {
    return 0;
  }
  const defaults = match[1].match(DEFAULT_METHOD_REGEX);
  return defaults ? defaults.length : 0;
}

export function scanHardcodedTotals(templatesDir: string): {
  totalLines: number;
  totalDefaults: number;
} {
  const dirs = fs
    .readdirSync(templatesDir)
    .filter((d) => d.startsWith("GT-"))
    .sort();

  let totalLines = 0;
  let totalDefaults = 0;

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
    }
  }

  return { totalLines, totalDefaults };
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

export function scanHardcodedParams(options?: { updateBaseline?: boolean }): {
  totalLines: number;
  totalDefaults: number;
  passed: boolean;
  maxAllowedLines: number;
  maxAllowedDefaults: number;
} {
  const rawBaseline = fs.readFileSync(BASELINE_PATH, "utf-8");
  const baseline = JSON.parse(rawBaseline) as BaselineConfig;

  const { totalLines, totalDefaults } = scanHardcodedTotals(TEMPLATES_DIR);

  console.log("=== CỔNG CHECK:HARDCODED-PARAMS (Task #263 T6) ===");
  console.log(
    `Số dòng chứa số cứng trong session.ts: ${totalLines} (trần: ${baseline.max_allowed_lines})`
  );
  console.log(
    `Số .default(...) trong DifficultySchema: ${totalDefaults} (trần: ${baseline.max_allowed_defaults})`
  );

  if (options?.updateBaseline) {
    updateBaselineFile(baseline, totalLines, totalDefaults);
  }

  const passedLines = totalLines <= baseline.max_allowed_lines;
  const passedDefaults = totalDefaults <= baseline.max_allowed_defaults;
  const passed = passedLines && passedDefaults;

  if (!passedLines) {
    console.error(
      `✗ Số dòng chứa số cứng (${totalLines}) vượt trần cho phép (${baseline.max_allowed_lines}).`
    );
  }
  if (!passedDefaults) {
    console.error(
      `✗ Số .default(...) trong schema (${totalDefaults}) vượt trần cho phép (${baseline.max_allowed_defaults}).`
    );
  }
  if (passed) {
    console.log("✓ Số cứng và .default(...) nằm trong hạn mức trần ratchet.");
  }

  return {
    totalLines,
    totalDefaults,
    passed,
    maxAllowedLines: baseline.max_allowed_lines,
    maxAllowedDefaults: baseline.max_allowed_defaults,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const isUpdate = process.argv.includes("--update-baseline");
  const result = scanHardcodedParams({ updateBaseline: isUpdate });
  process.exit(result.passed ? 0 : 1);
}

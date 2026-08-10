/**
 * lint:prices — Gate "không hardcode giá" theo Task 5 & BR-PKG-02.
 *
 * Scans `apps/**` and `packages/**` for hardcoded price literals.
 * Money amounts must be referenced from package catalog (PACKAGE_CATALOG / PENDING_PRICE_VND).
 */

import { type Dirent, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

interface Finding {
  column: number;
  file: string;
  line: number;
  value: string;
}

const ROOT = resolve(import.meta.dirname, "..");
const SCAN_ROOTS = ["apps", "packages"];
const SCAN_EXTENSIONS = [".ts", ".vue", ".js", ".json"];
const SKIP_DIRS = new Set([
  ".git",
  ".nuxt",
  ".output",
  "coverage",
  "dist",
  "node_modules",
]);

/** Files allowed to define prices or catalog items */
const ALLOWED_BASENAMES = new Set([
  "entitlement-catalog.ts",
  "seed.ts",
  "billing.ts",
  "package-catalog.ts",
]);

/** Pattern matching hardcoded VND price numbers (10,000 to 999,999,999) */
const HARDCODED_PRICE_PATTERN =
  /\b(?:price|price_vnd|priceVnd|amount_vnd|cost)\s*[:=]\s*([1-9]\d{4,8})\b|\b(?:990000|490000|199000|99000|299000|399000)\b/g;

function collectFiles(dir: string): string[] {
  let entries: Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) {
      continue;
    }
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }
    if (
      entry.isFile() &&
      SCAN_EXTENSIONS.some((ext) => entry.name.endsWith(ext)) &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".spec.ts")
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

function lineAndColumn(source: string, index: number): [number, number] {
  const lines = source.slice(0, index).split("\n");
  return [lines.length, (lines.at(-1)?.length ?? 0) + 1];
}

export function scanSourceForPrices(source: string, file: string): Finding[] {
  const basename = file.split("/").at(-1) ?? "";
  if (ALLOWED_BASENAMES.has(basename)) {
    return [];
  }

  const findings: Finding[] = [];
  for (const match of source.matchAll(HARDCODED_PRICE_PATTERN)) {
    const [line, column] = lineAndColumn(source, match.index ?? 0);
    findings.push({
      column,
      file,
      line,
      value: match[0],
    });
  }
  return findings;
}

if (process.argv[1] === import.meta.filename) {
  const findings = SCAN_ROOTS.flatMap((scanRoot) =>
    collectFiles(join(ROOT, scanRoot))
  ).flatMap((filePath) => {
    const file = relative(ROOT, filePath);
    const source = readFileSync(filePath, "utf8");
    return scanSourceForPrices(source, file);
  });

  if (findings.length === 0) {
    process.stdout.write(
      "✅ [lint:prices] Không có giá hardcode ngoài file catalog\n"
    );
    process.exit(0);
  }

  process.stdout.write(
    `❌ [lint:prices] ${findings.length} vi phạm hardcode giá ngoài catalog:\n`
  );
  for (const f of findings) {
    process.stdout.write(`  ${f.file}:${f.line}:${f.column} -> ${f.value}\n`);
  }
  process.exit(1);
}

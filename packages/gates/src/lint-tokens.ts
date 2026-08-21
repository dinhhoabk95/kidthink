/**
 * lint:tokens — mở rộng quét 8 quy tắc chất lượng & thiết kế UI.
 *
 * SPEC: design-system-contract.md (14 BR-DSC-*), accessibility.md (BR-A11-09).
 * Plan: 26-p1-1-ui-quality-contract-plan.md Task 2 (D-FC).
 */

import { type Dirent, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { isFixturePath } from "./lint-lib/source-scan.ts";

export interface TokenFinding {
  column: number;
  file: string;
  kind: string;
  line: number;
  rule: string;
  value: string;
}

const ROOT = REPO_ROOT;
const SCAN_ROOTS = ["apps", "packages"];
const SCAN_EXTENSIONS = [".ts", ".vue", ".css", ".scss", ".postcss"];
const SKIP_DIRS = new Set([
  ".git",
  ".nuxt",
  ".output",
  "coverage",
  "dist",
  "node_modules",
]);

const ALLOWED_BASENAMES = new Set([
  "designTokens.ts",
  "designTokens.test.ts",
  "tailwind.css",
  "tokens.test.ts",
]);

const HEX_PATTERN =
  /(?<![\w/])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\w])/g;

const EMOJI_AFFORDANCE_PATTERN =
  /(aria-label|label)=["'][^"']*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}][^"']*["']/gu;

const FORBIDDEN_KIT_PATTERN =
  /\b(lucide-vue-next|class-variance-authority|clsx|tailwind-merge)\b|components\/ui\/|\bcn\(/g;

const FORBIDDEN_RADIUS_PATTERN = /\b(rounded-md|rounded-lg)\b/g;

const UPPERCASE_PATTERN = /\btext-transform:\s*uppercase\b|\buppercase\b/g;

function lineAndColumn(source: string, index: number): [number, number] {
  const lines = source.slice(0, index).split("\n");
  return [lines.length, (lines.at(-1)?.length ?? 0) + 1];
}

function checkHexRule(source: string, filePath: string): TokenFinding[] {
  const findings: TokenFinding[] = [];
  const basename = filePath.split("/").at(-1) ?? "";

  if (ALLOWED_BASENAMES.has(basename)) {
    return findings;
  }

  // BR-DSC-01: hex in .vue
  if (filePath.endsWith(".vue")) {
    for (const match of source.matchAll(HEX_PATTERN)) {
      const [line, column] = lineAndColumn(source, match.index ?? 0);
      findings.push({
        column,
        file: filePath,
        kind: "hex-literal",
        line,
        rule: "BR-DSC-01",
        value: match[0],
      });
    }
  }

  // BR-DSC-02: hex in packages/game-engine outside designTokens.ts
  if (filePath.includes("packages/game-engine/")) {
    for (const match of source.matchAll(HEX_PATTERN)) {
      const [line, column] = lineAndColumn(source, match.index ?? 0);
      findings.push({
        column,
        file: filePath,
        kind: "game-engine-hex",
        line,
        rule: "BR-DSC-02",
        value: match[0],
      });
    }
  }

  return findings;
}

function checkPatternRules(source: string, filePath: string): TokenFinding[] {
  const findings: TokenFinding[] = [];

  // BR-DSC-03: Second kit in source
  for (const match of source.matchAll(FORBIDDEN_KIT_PATTERN)) {
    const [line, column] = lineAndColumn(source, match.index ?? 0);
    findings.push({
      column,
      file: filePath,
      kind: "second-kit-usage",
      line,
      rule: "BR-DSC-03",
      value: match[0],
    });
  }

  // BR-DSC-05: Emoji affordance
  for (const match of source.matchAll(EMOJI_AFFORDANCE_PATTERN)) {
    const [line, column] = lineAndColumn(source, match.index ?? 0);
    findings.push({
      column,
      file: filePath,
      kind: "emoji-affordance",
      line,
      rule: "BR-DSC-05",
      value: match[0],
    });
  }

  // BR-DSC-14: rounded-md / rounded-lg
  for (const match of source.matchAll(FORBIDDEN_RADIUS_PATTERN)) {
    const [line, column] = lineAndColumn(source, match.index ?? 0);
    findings.push({
      column,
      file: filePath,
      kind: "forbidden-radius",
      line,
      rule: "BR-DSC-14",
      value: match[0],
    });
  }

  return findings;
}

function checkContextualRules(
  source: string,
  filePath: string
): TokenFinding[] {
  const findings: TokenFinding[] = [];

  // BR-DSC-13: .vue > 800 lines
  if (filePath.endsWith(".vue")) {
    const lineCount = source.split("\n").length;
    if (lineCount > 800) {
      findings.push({
        column: 1,
        file: filePath,
        kind: "file-length",
        line: 1,
        rule: "BR-DSC-13",
        value: `${lineCount} lines (max 800)`,
      });
    }
  }

  // BR-DSC-06: dark: on kid surface
  if (
    filePath.includes("components/kid/") ||
    filePath.includes("pages/play/")
  ) {
    const darkPattern = /\bdark:/g;
    for (const match of source.matchAll(darkPattern)) {
      const [line, column] = lineAndColumn(source, match.index ?? 0);
      findings.push({
        column,
        file: filePath,
        kind: "kid-dark-mode",
        line,
        rule: "BR-DSC-06",
        value: match[0],
      });
    }
  }

  // BR-A11-09: uppercase styling on UI components/styles
  if (
    filePath.endsWith(".vue") ||
    filePath.endsWith(".css") ||
    filePath.endsWith(".scss")
  ) {
    for (const match of source.matchAll(UPPERCASE_PATTERN)) {
      const [line, column] = lineAndColumn(source, match.index ?? 0);
      findings.push({
        column,
        file: filePath,
        kind: "vietnamese-uppercase",
        line,
        rule: "BR-A11-09",
        value: match[0],
      });
    }
  }

  return findings;
}

export function runLintTokensOnContent(
  source: string,
  filePath: string
): TokenFinding[] {
  return [
    ...checkHexRule(source, filePath),
    ...checkPatternRules(source, filePath),
    ...checkContextualRules(source, filePath),
  ];
}

export function checkSecondKitInLockfile(
  lockfileContent: string
): TokenFinding[] {
  const findings: TokenFinding[] = [];
  const forbiddenPackages = [
    "lucide-vue-next",
    "class-variance-authority",
    "clsx",
    "tailwind-merge",
  ];

  for (const pkg of forbiddenPackages) {
    if (lockfileContent.includes(`/${pkg}@`)) {
      findings.push({
        column: 1,
        file: "pnpm-lock.yaml",
        kind: "lockfile-second-kit",
        line: 1,
        rule: "BR-DSC-03",
        value: pkg,
      });
    }
  }

  return findings;
}

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
    if (isFixturePath(fullPath)) {
      continue;
    }
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (
      entry.isFile() &&
      SCAN_EXTENSIONS.some((ext) => entry.name.endsWith(ext))
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

/** 8 rule design-system + a11y trên repo thật, gồm cả `pnpm-lock.yaml`. */
export function runTokenGate(root: string = ROOT): TokenFinding[] {
  const findings: TokenFinding[] = [];

  for (const filePath of SCAN_ROOTS.flatMap((scanRoot) =>
    collectFiles(join(root, scanRoot))
  )) {
    findings.push(
      ...runLintTokensOnContent(
        readFileSync(filePath, "utf8"),
        relative(root, filePath)
      )
    );
  }

  // BR-DSC-14: bộ UI kit thứ hai lọt vào lockfile là vi phạm, không phải tuỳ chọn.
  try {
    findings.push(
      ...checkSecondKitInLockfile(
        readFileSync(join(root, "pnpm-lock.yaml"), "utf8")
      )
    );
  } catch {
    // Thiếu lockfile chỉ xảy ra ngoài repo thật — không phải vi phạm rule.
  }

  return findings;
}

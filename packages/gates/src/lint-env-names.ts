#!/usr/bin/env node
/**
 * Gate: lint:env-names
 * Rules: BR-ENV-02 (one canonical name per concept)
 *        BR-ENV-03 (no fallback after an environment read)
 *
 * Both halves exist because the same class of bug came back twice: a rename
 * that only landed in half the files, and a `|| "https://..."` that let a
 * misconfigured server serve the wrong domain instead of failing at startup.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { isFixturePath } from "./lint-lib/source-scan.ts";

export interface DeprecatedEnvRule {
  bannedName: string;
  replacement: string;
}

/** env-contract.md §7.2 — the six groups that had to collapse. */
export const DEPRECATED_ENV_NAMES: readonly DeprecatedEnvRule[] = [
  { bannedName: "SESSION_SECRET", replacement: "NUXT_SESSION_PASSWORD" },
  { bannedName: "JWT_SECRET", replacement: "a purpose-specific secret" },
  { bannedName: "JWT_ACCESS_SECRET", replacement: "a purpose-specific secret" },
  { bannedName: "WEB_JWT_SECRET", replacement: "NUXT_SESSION_PASSWORD" },
  { bannedName: "ADMIN_JWT_SECRET", replacement: "NUXT_SESSION_PASSWORD" },
  { bannedName: "NUXT_WEB_JWT_SECRET", replacement: "NUXT_SESSION_PASSWORD" },
  { bannedName: "NUXT_ADMIN_JWT_SECRET", replacement: "NUXT_SESSION_PASSWORD" },
  { bannedName: "REDIS_URL", replacement: "VALKEY_URL" },
  { bannedName: "AUTH_REDIS_URL", replacement: "VALKEY_URL" },
  { bannedName: "VALKEY_HOST", replacement: "VALKEY_URL" },
  { bannedName: "NUXT_SITE_URL", replacement: "SITE_URL" },
  { bannedName: "NUXT_PUBLIC_SITE_URL", replacement: "SITE_URL" },
  { bannedName: "NUXT_PARENT_GATE_SECRET", replacement: "PARENT_GATE_SECRET" },
];

export type ViolationKind = "deprecated-alias" | "hardcoded-default";

export interface EnvNameViolation {
  file: string;
  line: number;
  kind: ViolationKind;
  name: string;
  advice: string;
  codeSnippet: string;
}

const SCAN_DIRS = ["apps", "packages", "scripts"];
const SCAN_EXTS = [".ts", ".tsx", ".js", ".jsx", ".vue", ".cjs", ".mjs"];
const SKIP_DIRS = new Set([
  "node_modules",
  ".output",
  ".nuxt",
  "dist",
  "coverage",
]);

const TEST_FILE_PATTERN = /\.(test|spec)\.[cm]?[jt]sx?$/;

/**
 * Test files may pin deterministic values; production code may not. The gate
 * would otherwise force fixtures to invent an env file for every unit test.
 */
function isTestPath(relPath: string): boolean {
  return (
    relPath.includes("/tests/") ||
    relPath.includes("/__tests__/") ||
    TEST_FILE_PATTERN.test(relPath)
  );
}

/**
 * Every shape a name can be read in, not just `process.env.NAME`: bracket
 * access and destructuring were how the last rename leaked through.
 *
 * Compiled once at module load. Building these per line made the gate scan the
 * repository in tens of seconds instead of under one.
 */
const ALIAS_MATCHERS: readonly {
  rule: DeprecatedEnvRule;
  patterns: readonly RegExp[];
}[] = DEPRECATED_ENV_NAMES.map((rule) => ({
  rule,
  patterns: [
    new RegExp(`\\bprocess\\.env\\.${rule.bannedName}\\b`),
    new RegExp(`\\bprocess\\.env\\[\\s*["'\`]${rule.bannedName}["'\`]\\s*\\]`),
    new RegExp(
      `\\b(?:requireEnv|optionalEnv)\\(\\s*["'\`]${rule.bannedName}["'\`]`
    ),
    new RegExp(
      `\\{[^}]*\\b${rule.bannedName}\\b[^}]*\\}\\s*=\\s*process\\.env\\b`
    ),
  ],
}));

/**
 * Cheap pre-filter: a line with no environment accessor
 * cannot violate either rule, and that is almost every line in the repository.
 */
const CANDIDATE_LINE = /process\.env|requireEnv|optionalEnv|devFallbackEnv/;

/**
 * Any fallback operator after an environment read hides a missing setup.
 * Cross-variable fallback must use an explicit accessor such as
 * `requireFirstEnv`, so the contract remains visible and fail-closed.
 */
const PROCESS_ENV_FALLBACK_PATTERN =
  /process\.env(?:\.[A-Z_][A-Z0-9_]*|\[[^\]]+\])\s*(?:\|\||\?\?)/g;
const PROCESS_ENV_NAME_PATTERN = /process\.env\.([A-Z_][A-Z0-9_]*)/;
const ACCESSOR_FALLBACK_PATTERN =
  /\b(?:requireEnv|optionalEnv)\(\s*["'`]([A-Z_][A-Z0-9_]*)["'`][^)]*\)\s*(?:\|\||\?\?)/g;
const DEV_FALLBACK_PATTERN =
  /\bdevFallbackEnv\(\s*["'`]([A-Z_][A-Z0-9_]*)["'`]/g;

function scanLineForAliases(
  relPath: string,
  line: string,
  lineNumber: number,
  found: EnvNameViolation[]
): void {
  for (const matcher of ALIAS_MATCHERS) {
    if (matcher.patterns.some((p) => p.test(line))) {
      found.push({
        file: relPath,
        line: lineNumber,
        kind: "deprecated-alias",
        name: matcher.rule.bannedName,
        advice: `Use "${matcher.rule.replacement}" — env-contract.md §7.2`,
        codeSnippet: line.trim(),
      });
    }
  }
}

function addDefaultViolation(
  relPath: string,
  content: string,
  offset: number,
  name: string,
  reason: string,
  found: EnvNameViolation[]
): void {
  const lineNumber = content.slice(0, offset).split("\n").length;
  const line = content.split("\n")[lineNumber - 1] ?? "";
  found.push({
    file: relPath,
    line: lineNumber,
    kind: "hardcoded-default",
    name,
    advice: `${reason} — remove the fallback and let setup fail — BR-ENV-03`,
    codeSnippet: line.trim(),
  });
}

function scanContentForDefaults(
  relPath: string,
  content: string,
  found: EnvNameViolation[]
): void {
  for (const match of content.matchAll(PROCESS_ENV_FALLBACK_PATTERN)) {
    const nameMatch = PROCESS_ENV_NAME_PATTERN.exec(match[0]);
    addDefaultViolation(
      relPath,
      content,
      match.index ?? 0,
      nameMatch?.[1] ?? "dynamic process.env access",
      "Environment reads cannot fall back with || or ??",
      found
    );
  }

  for (const match of content.matchAll(ACCESSOR_FALLBACK_PATTERN)) {
    addDefaultViolation(
      relPath,
      content,
      match.index ?? 0,
      match[1] ?? "unknown",
      "Environment accessors cannot fall back with || or ??",
      found
    );
  }

  for (const match of content.matchAll(DEV_FALLBACK_PATTERN)) {
    addDefaultViolation(
      relPath,
      content,
      match.index ?? 0,
      match[1] ?? "unknown",
      "devFallbackEnv is not allowed",
      found
    );
  }
}

export function scanContentForEnvNames(
  relPath: string,
  content: string
): EnvNameViolation[] {
  const found: EnvNameViolation[] = [];
  if (!CANDIDATE_LINE.test(content)) {
    return found;
  }

  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (!CANDIDATE_LINE.test(line)) {
      continue;
    }
    scanLineForAliases(relPath, line, i + 1, found);
  }

  if (!isTestPath(relPath)) {
    scanContentForDefaults(relPath, content, found);
  }

  return found;
}

function walkDirectory(
  dir: string,
  root: string,
  found: EnvNameViolation[]
): void {
  let entries: import("node:fs").Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!(SKIP_DIRS.has(entry.name) || isFixturePath(fullPath, root))) {
        walkDirectory(fullPath, root, found);
      }
      continue;
    }
    if (entry.isFile() && SCAN_EXTS.some((e) => entry.name.endsWith(e))) {
      const rel = relative(root, fullPath);
      found.push(
        ...scanContentForEnvNames(rel, readFileSync(fullPath, "utf8"))
      );
    }
  }
}

export function scanAllEnvNames(root = REPO_ROOT): EnvNameViolation[] {
  const found: EnvNameViolation[] = [];
  for (const scanDir of SCAN_DIRS) {
    walkDirectory(resolve(root, scanDir), root, found);
  }
  return found;
}

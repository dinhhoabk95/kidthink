#!/usr/bin/env node
/**
 * Gate: lint:env-names
 * Rules: BR-ENV-02 (one canonical name per concept)
 *        BR-ENV-03 (no hardcoded fallback for a contract variable)
 *
 * Both halves exist because the same class of bug came back twice: a rename
 * that only landed in half the files, and a `|| "https://..."` that let a
 * misconfigured server serve the wrong domain instead of failing at startup.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { ENV_REGISTRY } from "../packages/config/src/env-contract.ts";

export interface DeprecatedEnvRule {
  bannedName: string;
  replacement: string;
}

/** env-contract.md §7.2 — the six groups that had to collapse. */
export const DEPRECATED_ENV_NAMES: readonly DeprecatedEnvRule[] = [
  { bannedName: "SESSION_SECRET", replacement: "NUXT_SESSION_PASSWORD" },
  { bannedName: "JWT_SECRET", replacement: "WEB_JWT_SECRET" },
  { bannedName: "JWT_ACCESS_SECRET", replacement: "WEB_JWT_SECRET" },
  { bannedName: "NUXT_WEB_JWT_SECRET", replacement: "WEB_JWT_SECRET" },
  { bannedName: "NUXT_ADMIN_JWT_SECRET", replacement: "ADMIN_JWT_SECRET" },
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

const SCAN_DIRS = ["apps", "packages"];
const SCAN_EXTS = [".ts", ".js", ".vue", ".cjs", ".mjs"];
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
 * Matches every shape a name can be read in, not just `process.env.NAME`:
 * bracket access and destructuring were how the last rename leaked through.
 */
function buildAliasPatterns(bannedName: string): RegExp[] {
  return [
    new RegExp(`\\bprocess\\.env\\.${bannedName}\\b`),
    new RegExp(`\\bprocess\\.env\\[\\s*["'\`]${bannedName}["'\`]\\s*\\]`),
    new RegExp(`\\b(?:requireEnv|optionalEnv)\\(\\s*["'\`]${bannedName}["'\`]`),
    new RegExp(`\\{[^}]*\\b${bannedName}\\b[^}]*\\}\\s*=\\s*process\\.env\\b`),
  ];
}

/**
 * A string literal used as the fallback of a contract variable. Chained
 * `process.env.A || process.env.B` is fine — that is still the contract.
 */
const HARDCODED_DEFAULT_PATTERN =
  /process\.env\.([A-Z_][A-Z0-9_]*)\s*(?:\|\||\?\?)\s*["'`]([^"'`]*)["'`]/;
const REQUIRE_ENV_DEFAULT_PATTERN =
  /(?:requireEnv|optionalEnv)\(\s*["'`]([A-Z_][A-Z0-9_]*)["'`][^)]*\)\s*(?:\|\||\?\?)\s*["'`]/;

// devFallbackEnv() is the sanctioned shape: it throws in production and only
// returns its literal in development, so it is not a production default.
const SANCTIONED_FALLBACK = /\bdevFallbackEnv\s*\(/;

/** Names whose value decides identity or authenticity — a literal is never right. */
function noDefaultNames(): Set<string> {
  const names = new Set<string>();
  for (const def of ENV_REGISTRY) {
    if (
      (def.required === "always" || def.required === "production") &&
      (def.kind === "url" || def.kind === "secret" || def.secret)
    ) {
      names.add(def.name);
    }
  }
  for (const rule of DEPRECATED_ENV_NAMES) {
    names.add(rule.bannedName);
  }
  return names;
}

function scanLineForAliases(
  relPath: string,
  line: string,
  lineNumber: number,
  found: EnvNameViolation[]
): void {
  for (const rule of DEPRECATED_ENV_NAMES) {
    if (buildAliasPatterns(rule.bannedName).some((p) => p.test(line))) {
      found.push({
        file: relPath,
        line: lineNumber,
        kind: "deprecated-alias",
        name: rule.bannedName,
        advice: `Use "${rule.replacement}" — env-contract.md §7.2`,
        codeSnippet: line.trim(),
      });
    }
  }
}

function scanLineForDefaults(
  relPath: string,
  line: string,
  lineNumber: number,
  banned: Set<string>,
  found: EnvNameViolation[]
): void {
  if (SANCTIONED_FALLBACK.test(line)) {
    return;
  }

  const direct = HARDCODED_DEFAULT_PATTERN.exec(line);
  if (direct?.[1] && banned.has(direct[1])) {
    found.push({
      file: relPath,
      line: lineNumber,
      kind: "hardcoded-default",
      name: direct[1],
      advice: `Use requireEnv("${direct[1]}") and let startup fail — BR-ENV-03`,
      codeSnippet: line.trim(),
    });
    return;
  }

  const wrapped = REQUIRE_ENV_DEFAULT_PATTERN.exec(line);
  if (wrapped?.[1] && banned.has(wrapped[1])) {
    found.push({
      file: relPath,
      line: lineNumber,
      kind: "hardcoded-default",
      name: wrapped[1],
      advice: `Drop the literal fallback for ${wrapped[1]} — BR-ENV-03`,
      codeSnippet: line.trim(),
    });
  }
}

export function scanContentForEnvNames(
  relPath: string,
  content: string
): EnvNameViolation[] {
  const found: EnvNameViolation[] = [];
  const banned = noDefaultNames();
  const lines = content.split("\n");
  const skipDefaults = isTestPath(relPath);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    scanLineForAliases(relPath, line, i + 1, found);
    if (!skipDefaults) {
      scanLineForDefaults(relPath, line, i + 1, banned, found);
    }
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
      if (!SKIP_DIRS.has(entry.name)) {
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

export function scanAllEnvNames(root = process.cwd()): EnvNameViolation[] {
  const found: EnvNameViolation[] = [];
  for (const scanDir of SCAN_DIRS) {
    walkDirectory(resolve(root, scanDir), root, found);
  }
  return found;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const violations = scanAllEnvNames();
  if (violations.length === 0) {
    console.log(
      "✅ [lint:env-names] Canonical names only, no hardcoded fallbacks (BR-ENV-02, BR-ENV-03)."
    );
    process.exit(0);
  }
  console.error(`❌ [lint:env-names] ${violations.length} violations:`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} [${v.kind}] ${v.name} — ${v.advice}`);
    console.error(`      ${v.codeSnippet}`);
  }
  process.exit(1);
}

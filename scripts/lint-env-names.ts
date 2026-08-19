import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

/**
 * Gate: lint:env-names (BR-ENV-02, BR-ENV-03)
 * Enforces canonical environment variable names and bans deprecated aliases / hardcoded site defaults.
 */

export interface DeprecatedEnvRule {
  pattern: RegExp;
  bannedName: string;
  replacement: string;
}

export const DEPRECATED_ENV_NAMES: readonly DeprecatedEnvRule[] = [
  {
    pattern: /\bprocess\.env\.SESSION_SECRET\b/,
    bannedName: "SESSION_SECRET",
    replacement: "NUXT_SESSION_PASSWORD",
  },
  {
    pattern: /\bprocess\.env\.JWT_SECRET\b/,
    bannedName: "JWT_SECRET",
    replacement: "WEB_JWT_SECRET",
  },
  {
    pattern: /\bprocess\.env\.JWT_ACCESS_SECRET\b/,
    bannedName: "JWT_ACCESS_SECRET",
    replacement: "WEB_JWT_SECRET",
  },
  {
    pattern: /\bprocess\.env\.NUXT_WEB_JWT_SECRET\b/,
    bannedName: "NUXT_WEB_JWT_SECRET",
    replacement: "WEB_JWT_SECRET",
  },
  {
    pattern: /\bprocess\.env\.NUXT_ADMIN_JWT_SECRET\b/,
    bannedName: "NUXT_ADMIN_JWT_SECRET",
    replacement: "ADMIN_JWT_SECRET",
  },
  {
    pattern: /\bprocess\.env\.REDIS_URL\b/,
    bannedName: "REDIS_URL",
    replacement: "VALKEY_URL",
  },
  {
    pattern: /\bprocess\.env\.VALKEY_HOST\b/,
    bannedName: "VALKEY_HOST",
    replacement: "VALKEY_URL",
  },
  {
    pattern: /\bprocess\.env\.AUTH_REDIS_URL\b/,
    bannedName: "AUTH_REDIS_URL",
    replacement: "VALKEY_URL",
  },
  {
    pattern: /\bprocess\.env\.NUXT_SITE_URL\b/,
    bannedName: "NUXT_SITE_URL",
    replacement: "SITE_URL",
  },
  {
    pattern: /\bprocess\.env\.NUXT_PUBLIC_SITE_URL\b/,
    bannedName: "NUXT_PUBLIC_SITE_URL",
    replacement: "SITE_URL",
  },
  {
    pattern: /\bprocess\.env\.NUXT_PARENT_GATE_SECRET\b/,
    bannedName: "NUXT_PARENT_GATE_SECRET",
    replacement: "PARENT_GATE_SECRET",
  },
];

export interface EnvNameViolation {
  file: string;
  line: number;
  bannedName: string;
  replacement: string;
  codeSnippet: string;
}

const SCAN_DIRS = ["apps", "packages"];
const SCAN_EXTS = [".ts", ".js", ".vue", ".cjs", ".mjs"];
const SKIP_DIRS = new Set([
  "node_modules",
  ".output",
  ".nuxt",
  "dist",
  "fixtures",
]);

export function scanContentForEnvNames(
  relPath: string,
  content: string
): EnvNameViolation[] {
  const violations: EnvNameViolation[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    for (const rule of DEPRECATED_ENV_NAMES) {
      if (rule.pattern.test(line)) {
        violations.push({
          file: relPath,
          line: i + 1,
          bannedName: rule.bannedName,
          replacement: rule.replacement,
          codeSnippet: line.trim(),
        });
      }
    }
  }

  return violations;
}

function processDirectoryEntry(
  entry: import("node:fs").Dirent,
  dir: string,
  root: string,
  allViolations: EnvNameViolation[],
  walk: (d: string) => void
) {
  const fullPath = join(dir, entry.name);
  if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) {
    walk(fullPath);
    return;
  }
  if (entry.isFile()) {
    const hasValidExt = SCAN_EXTS.some((e) => entry.name.endsWith(e));
    if (hasValidExt) {
      const rel = relative(root, fullPath);
      const content = readFileSync(fullPath, "utf8");
      allViolations.push(...scanContentForEnvNames(rel, content));
    }
  }
}

export function scanAllEnvNames(root = process.cwd()): EnvNameViolation[] {
  const allViolations: EnvNameViolation[] = [];

  function walk(dir: string) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      processDirectoryEntry(entry, dir, root, allViolations, walk);
    }
  }

  for (const scanDir of SCAN_DIRS) {
    const fullScanDir = resolve(root, scanDir);
    walk(fullScanDir);
  }

  return allViolations;
}

// CLI entrypoint
if (import.meta.url === `file://${process.argv[1]}`) {
  const violations = scanAllEnvNames();
  if (violations.length === 0) {
    console.log(
      "✅ [lint:env-names] All environment variable names conform to canonical contract (BR-ENV-02)."
    );
    process.exit(0);
  } else {
    console.error(
      `❌ [lint:env-names] Found ${violations.length} deprecated environment variable alias usages:`
    );
    for (const v of violations) {
      console.error(
        `  ${v.file}:${v.line} — Use "${v.replacement}" instead of "${v.bannedName}": ${v.codeSnippet}`
      );
    }
    process.exit(1);
  }
}

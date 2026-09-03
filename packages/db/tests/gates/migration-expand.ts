#!/usr/bin/env node
/**
 * Gate: lint:migration-expand
 * Rules: BR-RBK-02 (a release may only add), BR-RBK-03 (drops take two releases)
 *
 * This is the precondition that makes "rollback only moves code" safe: if a new
 * schema removes something the previous release still reads, rolling the code
 * back breaks the site a second way.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";

export interface MigrationViolation {
  file: string;
  line: number;
  pattern: string;
  codeSnippet: string;
}

/**
 * Destructive in the expand/contract sense: anything a previously deployed
 * release could still be depending on.
 */
const DESTRUCTIVE_PATTERNS: readonly { regex: RegExp; name: string }[] = [
  { regex: /\bDROP\s+COLUMN\b/i, name: "DROP COLUMN" },
  { regex: /\bDROP\s+TABLE\b/i, name: "DROP TABLE" },
  { regex: /\bDROP\s+(?:MATERIALIZED\s+)?VIEW\b/i, name: "DROP VIEW" },
  { regex: /\bDROP\s+INDEX\b/i, name: "DROP INDEX" },
  { regex: /\bDROP\s+CONSTRAINT\b/i, name: "DROP CONSTRAINT" },
  { regex: /\bDROP\s+TYPE\b/i, name: "DROP TYPE" },
  { regex: /\bRENAME\s+COLUMN\b/i, name: "RENAME COLUMN" },
  { regex: /\bRENAME\s+TO\b/i, name: "RENAME TO" },
  {
    regex: /\bALTER\s+COLUMN\b[\s\S]*?\bSET\s+NOT\s+NULL\b/i,
    name: "SET NOT NULL",
  },
  { regex: /\bALTER\s+COLUMN\b[\s\S]*?\bTYPE\b/i, name: "ALTER COLUMN TYPE" },
  { regex: /\bTRUNCATE\b/i, name: "TRUNCATE" },
];

/** Directories drizzle-kit may be configured to emit into. */
const MIGRATION_DIRS = [
  "packages/db/src/migrations",
  "packages/db/drizzle",
  "packages/db/migrations",
];

function isComment(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("--") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("*")
  );
}

export function scanMigrationContent(
  relPath: string,
  content: string
): MigrationViolation[] {
  const violations: MigrationViolation[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (isComment(line)) {
      continue;
    }
    const prevLine = i > 0 ? (lines[i - 1] ?? "") : "";
    if (
      line.includes("-- contract-drop") ||
      line.includes("-- allow-destructive") ||
      prevLine.includes("-- contract-drop") ||
      prevLine.includes("-- allow-destructive")
    ) {
      continue;
    }
    for (const pat of DESTRUCTIVE_PATTERNS) {
      if (pat.regex.test(line)) {
        violations.push({
          file: relPath,
          line: i + 1,
          pattern: pat.name,
          codeSnippet: line.trim(),
        });
      }
    }
  }

  return violations;
}

function collectFiles(dir: string, found: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      // drizzle keeps journal/snapshot JSON under meta/; not migrations.
      if (entry !== "meta") {
        collectFiles(full, found);
      }
      continue;
    }
    if (entry.endsWith(".sql")) {
      found.push(full);
    }
  }
}

export interface MigrationScanResult {
  violations: MigrationViolation[];
  scannedFiles: number;
}

/**
 * Returns the file count as well as the findings: a gate that silently scans
 * zero files reports success forever, which is how this one passed while the
 * only migration in the repository was never read.
 */
export function scanAllMigrations(root = REPO_ROOT): MigrationScanResult {
  const files: string[] = [];
  for (const dir of MIGRATION_DIRS) {
    collectFiles(resolve(root, dir), files);
  }

  const violations: MigrationViolation[] = [];
  for (const file of files) {
    violations.push(
      ...scanMigrationContent(relative(root, file), readFileSync(file, "utf8"))
    );
  }

  return { violations, scannedFiles: files.length };
}

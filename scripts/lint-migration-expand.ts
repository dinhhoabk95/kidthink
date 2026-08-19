import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

/**
 * Gate: lint:migration-expand (BR-RBK-02)
 * Ensures all database migrations are expand-only (no destructive DROP COLUMN/TABLE or RENAME).
 */

export interface MigrationViolation {
  file: string;
  line: number;
  pattern: string;
  codeSnippet: string;
}

const DESTRUCTIVE_PATTERNS: { regex: RegExp; name: string }[] = [
  { regex: /\bDROP\s+COLUMN\b/i, name: "DROP COLUMN" },
  { regex: /\bDROP\s+TABLE\b/i, name: "DROP TABLE" },
  { regex: /\bRENAME\s+COLUMN\b/i, name: "RENAME COLUMN" },
  { regex: /\bRENAME\s+TO\b/i, name: "RENAME TABLE" },
];

export function scanMigrationContent(
  relPath: string,
  content: string
): MigrationViolation[] {
  const violations: MigrationViolation[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    // Allow intentional comments explaining expand-contract
    if (line.trim().startsWith("--") || line.trim().startsWith("//")) {
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

export function scanAllMigrations(root = process.cwd()): MigrationViolation[] {
  const violations: MigrationViolation[] = [];
  const migrationDirs = [
    resolve(root, "packages/db/drizzle"),
    resolve(root, "packages/db/migrations"),
  ];

  for (const dir of migrationDirs) {
    try {
      const files = readdirSync(dir);
      for (const file of files) {
        if (file.endsWith(".sql") || file.endsWith(".ts")) {
          const fullPath = join(dir, file);
          const content = readFileSync(fullPath, "utf8");
          const rel = relative(root, fullPath);
          violations.push(...scanMigrationContent(rel, content));
        }
      }
    } catch {
      // Directory may not exist yet
    }
  }

  return violations;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const violations = scanAllMigrations();
  if (violations.length === 0) {
    console.log(
      "✅ [lint:migration-expand] All database migrations are expand-only (BR-RBK-02)."
    );
    process.exit(0);
  } else {
    console.error(
      `❌ [lint:migration-expand] Found ${violations.length} destructive migration patterns:`
    );
    for (const v of violations) {
      console.error(
        `  ${v.file}:${v.line} — Banned ${v.pattern}: ${v.codeSnippet}`
      );
    }
    process.exit(1);
  }
}

import fs from "node:fs";
import path from "node:path";
import type { DatabaseSync as NodeDatabaseSync } from "node:sqlite";

const MIGRATIONS_DIR = path.resolve(import.meta.dirname, "..", "migrations");

const CREATE_IF_NOT_EXISTS_REGEX =
  /^(CREATE\s+(?:UNIQUE\s+)?(?:TABLE|INDEX|TRIGGER)\s+)(?!IF\s+NOT\s+EXISTS\b)/i;

let cachedStatements: readonly string[] | undefined;

export function loadSquashedMigrationStatements(): readonly string[] {
  if (cachedStatements) {
    return cachedStatements;
  }
  const entries = fs.readdirSync(MIGRATIONS_DIR, { withFileTypes: true });
  const migrationDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  if (migrationDirs.length === 0) {
    throw new Error(`No migration folders found in ${MIGRATIONS_DIR}`);
  }
  const latestDir = migrationDirs.at(-1);
  if (!latestDir) {
    throw new Error(`No migration folder resolved in ${MIGRATIONS_DIR}`);
  }
  const sqlPath = path.join(MIGRATIONS_DIR, latestDir, "migration.sql");
  const rawSql = fs.readFileSync(sqlPath, "utf8");
  cachedStatements = rawSql
    .split("--> statement-breakpoint")
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .map((stmt) =>
      stmt.replace(CREATE_IF_NOT_EXISTS_REGEX, "$1IF NOT EXISTS ")
    );
  return cachedStatements;
}

export function applySquashedSqliteMigration(db: NodeDatabaseSync): void {
  const statements = loadSquashedMigrationStatements();
  for (const stmt of statements) {
    db.exec(stmt);
  }
}

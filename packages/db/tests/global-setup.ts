import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import type { DatabaseSync as NodeDatabaseSync } from "node:sqlite";
import { testDatabaseUrls } from "@mindkid/config/vitest/test-database";
import { getTableName, is } from "drizzle-orm";
import { SQLiteTable } from "drizzle-orm/sqlite-core";
import { resolveSqliteDatabasePath } from "#src/drivers/sqlite-local-driver";
import { applySquashedSqliteMigration } from "#src/drivers/sqlite-migration-runner";
// biome-ignore lint/performance/noNamespaceImport: dynamically iterates all schema tables
import * as schema from "#src/schema/index";

interface NodeSqliteModule {
  readonly DatabaseSync: typeof NodeDatabaseSync;
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
const SAFE_IDENT_REGEX = /^[a-zA-Z0-9_]+$/;
const PREPARED_FLAG = "MINDKID_TEST_DB_PREPARED";
const RUN_LOCK_KEY = "8314002";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const TEST_SQLITE_FALLBACK_DIR = path.join(REPO_ROOT, ".data", "sqlite-test");

const PROTECTED_TRIGGERS = [
  "trg_prevent_consent_logs_update",
  "trg_prevent_consent_logs_delete",
  "trg_prevent_audit_logs_update",
  "trg_prevent_audit_logs_delete",
  "trg_prevent_completed_play_sessions_update",
] as const;

let cachedSqliteModule: NodeSqliteModule | undefined;

function loadNodeSqlite(): NodeSqliteModule {
  if (!cachedSqliteModule) {
    const req = createRequire(import.meta.url);
    cachedSqliteModule = req("node:sqlite") as NodeSqliteModule;
  }
  return cachedSqliteModule;
}

export function extractTableNamesFromSchema(schemaObj: object): string[] {
  const tableNames = new Set<string>();
  for (const value of Object.values(schemaObj)) {
    if (is(value, SQLiteTable)) {
      tableNames.add(getTableName(value));
    }
  }
  return Array.from(tableNames).sort();
}

export const TABLES = extractTableNamesFromSchema(schema);

/** BR-TST-05: destructive test cleanup may only target this machine. */
export function assertDisposableDatabaseUrl(databaseUrl: string): void {
  const { hostname } = new URL(databaseUrl);
  if (!LOOPBACK_HOSTS.has(hostname)) {
    throw new Error(
      "Refusing destructive test cleanup: DATABASE_URL must use a loopback host"
    );
  }
}

export function assertDisposableSqliteDir(dataDir: string): void {
  if (dataDir === ":memory:") {
    return;
  }
  const resolved = path.resolve(dataDir);
  const tmpRoot = path.resolve(os.tmpdir());
  const isUnderTmp =
    resolved === tmpRoot || resolved.startsWith(`${tmpRoot}${path.sep}`);
  const isTestSqliteDir =
    resolved === TEST_SQLITE_FALLBACK_DIR ||
    resolved.includes("sqlite-test") ||
    path.basename(resolved).includes("test");
  if (!(isUnderTmp || isTestSqliteDir)) {
    throw new Error(
      `Từ chối dọn SQLite tại '${resolved}': không nằm trong thư mục test hợp lệ.`
    );
  }
}

function resolveTargetSqliteDir(target?: string): string {
  if (!target) {
    return process.env.SQLITE_DATA_DIR || TEST_SQLITE_FALLBACK_DIR;
  }
  if (target.startsWith("postgres://") || target.startsWith("postgresql://")) {
    assertDisposableDatabaseUrl(target);
    return process.env.SQLITE_DATA_DIR || TEST_SQLITE_FALLBACK_DIR;
  }
  return target;
}

export function truncateAllTestTables(
  target?: string,
  tables: readonly string[] = TABLES
): Promise<void> {
  const targetDir = resolveTargetSqliteDir(target);
  const resolved = resolveSqliteDatabasePath(targetDir);
  if (!resolved.isMemory) {
    assertDisposableSqliteDir(resolved.dataDir);
    fs.mkdirSync(resolved.dataDir, { recursive: true });
  }

  const { DatabaseSync } = loadNodeSqlite();
  const rawDb = new DatabaseSync(resolved.dbPath);
  const touchesProtected =
    tables.includes("audit_logs") ||
    tables.includes("consent_logs") ||
    tables.includes("play_sessions");

  try {
    rawDb.exec("PRAGMA busy_timeout = 5000;");
    rawDb.exec("PRAGMA journal_mode = WAL;");
    if (tables === TABLES) {
      applySquashedSqliteMigration(rawDb);
    }

    rawDb.exec("PRAGMA foreign_keys = OFF;");
    rawDb.exec("BEGIN IMMEDIATE;");
    try {
      if (touchesProtected) {
        for (const trig of PROTECTED_TRIGGERS) {
          rawDb.exec(`DROP TRIGGER IF EXISTS "${trig}";`);
        }
      }
      for (const table of tables) {
        if (!SAFE_IDENT_REGEX.test(table)) {
          throw new Error(`Invalid SQLite table name: ${table}`);
        }
        rawDb.exec(`DELETE FROM "${table}";`);
      }
      const seqRow = rawDb
        .prepare(
          "SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = 'sqlite_sequence';"
        )
        .get();
      if (seqRow) {
        rawDb.exec("DELETE FROM sqlite_sequence;");
      }
      rawDb.exec("COMMIT;");
    } catch (err) {
      rawDb.exec("ROLLBACK;");
      throw err;
    } finally {
      rawDb.exec("PRAGMA foreign_keys = ON;");
    }

    if (touchesProtected) {
      applySquashedSqliteMigration(rawDb);
    }
  } finally {
    rawDb.close();
  }
  return Promise.resolve();
}

function isPidAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function acquireRunLock(
  lockDirOrUrl: string = TEST_SQLITE_FALLBACK_DIR,
  key: string | number = RUN_LOCK_KEY
): Promise<() => void> {
  const baseDir =
    lockDirOrUrl.startsWith("postgres://") ||
    lockDirOrUrl.startsWith("postgresql://") ||
    lockDirOrUrl === ":memory:"
      ? TEST_SQLITE_FALLBACK_DIR
      : lockDirOrUrl;
  fs.mkdirSync(baseDir, { recursive: true });
  const lockPath = path.join(baseDir, `.vitest-run-${String(key)}.lock`);

  while (true) {
    try {
      const fd = fs.openSync(lockPath, "wx");
      fs.writeFileSync(fd, String(process.pid), "utf8");
      fs.closeSync(fd);
      return () => {
        fs.rmSync(lockPath, { force: true });
      };
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code !== "EEXIST") {
        throw err;
      }
      try {
        const holderPid = Number.parseInt(
          fs.readFileSync(lockPath, "utf8").trim(),
          10
        );
        if (!isPidAlive(holderPid)) {
          fs.rmSync(lockPath, { force: true });
          continue;
        }
      } catch {
        continue;
      }
      await new Promise<void>((resolve) => setImmediate(resolve));
    }
  }
}

export function claimDatabasePreparation(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  if (env[PREPARED_FLAG] === "1") {
    return false;
  }
  env[PREPARED_FLAG] = "1";
  return true;
}

export default async function setup(): Promise<(() => void) | undefined> {
  if (!claimDatabasePreparation()) {
    return;
  }
  const url = testDatabaseUrls().owner;
  assertDisposableDatabaseUrl(url);

  const targetDir = process.env.SQLITE_DATA_DIR || TEST_SQLITE_FALLBACK_DIR;
  assertDisposableSqliteDir(targetDir);

  const release = await acquireRunLock(targetDir);
  await truncateAllTestTables(targetDir);
  console.log(
    `[test-db] đã dựng & dọn SQLite test tại ${resolveSqliteDatabasePath(targetDir).dbPath} (${TABLES.length} bảng)`
  );
  return release;
}

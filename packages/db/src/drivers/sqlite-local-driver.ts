import { AsyncLocalStorage } from "node:async_hooks";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type {
  DatabaseSync as NodeDatabaseSync,
  SQLInputValue,
  SQLOutputValue,
} from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { applySquashedSqliteMigration } from "#src/drivers/sqlite-migration-runner";
import {
  type AppDb,
  type DatabaseDriver,
  type OwnerDb,
  SQLITE_DRIZZLE_CODECS,
  type SqliteCellValue,
  type SqliteDatabasePath,
  type SqliteDriverOptions,
  type SqliteParamValue,
  type SqliteRunResult,
} from "#src/drivers/types";
import { dbRelations } from "#src/schema/relations";

interface NodeSqliteModule {
  readonly DatabaseSync: typeof NodeDatabaseSync;
}

const TX_CONTROL_REGEX =
  /^\s*(?:BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE\s+SAVEPOINT|ROLLBACK\s+TO\s+SAVEPOINT)\b/i;

const DEFAULT_REPO_SQLITE_DIR = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  ".data",
  "sqlite"
);

let cachedSqliteModule: NodeSqliteModule | undefined;

function loadNodeSqlite(): NodeSqliteModule {
  if (!cachedSqliteModule) {
    const req = createRequire(import.meta.url);
    cachedSqliteModule = req("node:sqlite") as NodeSqliteModule;
  }
  return cachedSqliteModule;
}

export function resolveSqliteDatabasePath(
  configuredDir?: string
): SqliteDatabasePath {
  const rawDir = configuredDir ?? process.env.SQLITE_DATA_DIR;
  if (rawDir === ":memory:") {
    return {
      isMemory: true,
      dataDir: ":memory:",
      dbPath: ":memory:",
    };
  }
  const resolvedDir =
    rawDir && rawDir.trim().length > 0
      ? path.resolve(rawDir)
      : DEFAULT_REPO_SQLITE_DIR;
  return {
    isMemory: false,
    dataDir: resolvedDir,
    dbPath: path.join(resolvedDir, "mindkid.sqlite"),
  };
}

function toSqlInput(value: SqliteParamValue): SQLInputValue {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  return value;
}

function normalizeCell(value: SQLOutputValue | undefined): SqliteCellValue {
  if (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    value instanceof Uint8Array
  ) {
    return value ?? null;
  }
  return Number(value);
}

function normalizeArrayRow(
  row: SQLOutputValue[],
  colCount: number
): SqliteCellValue[] {
  const out: SqliteCellValue[] = [];
  for (let i = 0; i < colCount; i++) {
    out.push(normalizeCell(row[i]));
  }
  return out;
}

function normalizeObjectRow(
  row: Record<string, SQLOutputValue>
): Record<string, SqliteCellValue> {
  const out: Record<string, SqliteCellValue> = {};
  for (const [key, val] of Object.entries(row)) {
    out[key] = normalizeCell(val);
  }
  return out;
}

function toNormalizedArrayRow(
  row: Record<string, SQLOutputValue> | SQLOutputValue[],
  colCount: number
): SqliteCellValue[] {
  return Array.isArray(row)
    ? normalizeArrayRow(row, colCount)
    : normalizeArrayRow(Object.values(row), colCount);
}

function createSqliteProxyDb(rawDb: NodeDatabaseSync): AppDb {
  function getRow(
    sqlText: string,
    params: SqliteParamValue[],
    rowMode?: "array" | undefined
  ): Promise<SqliteCellValue[] | undefined>;
  function getRow(
    sqlText: string,
    params: SqliteParamValue[],
    rowMode: "object"
  ): Promise<Record<string, SqliteCellValue> | undefined>;
  function getRow(
    sqlText: string,
    params: SqliteParamValue[],
    rowMode?: "array" | "object" | undefined
  ): Promise<Record<string, SqliteCellValue> | undefined>;
  function getRow(
    sqlText: string,
    params: SqliteParamValue[],
    rowMode?: "array" | "object"
  ): Promise<SqliteCellValue[] | Record<string, SqliteCellValue> | undefined> {
    const stmt = rawDb.prepare(sqlText);
    const inputs = params.map(toSqlInput);
    if (rowMode === "object") {
      const row = stmt.get(...inputs);
      return Promise.resolve(row ? normalizeObjectRow(row) : undefined);
    }
    const colCount = stmt.columns().length;
    stmt.setReturnArrays(true);
    const row: Record<string, SQLOutputValue> | SQLOutputValue[] | undefined =
      stmt.get(...inputs);
    return Promise.resolve(
      row ? toNormalizedArrayRow(row, colCount) : undefined
    );
  }

  function allRows(
    sqlText: string,
    params: SqliteParamValue[],
    rowMode?: "array" | undefined
  ): Promise<SqliteCellValue[][]>;
  function allRows(
    sqlText: string,
    params: SqliteParamValue[],
    rowMode: "object"
  ): Promise<Record<string, SqliteCellValue>[]>;
  function allRows(
    sqlText: string,
    params: SqliteParamValue[],
    rowMode?: "array" | "object" | undefined
  ): Promise<Record<string, SqliteCellValue>[]>;
  function allRows(
    sqlText: string,
    params: SqliteParamValue[],
    rowMode?: "array" | "object"
  ): Promise<SqliteCellValue[][] | Record<string, SqliteCellValue>[]> {
    const stmt = rawDb.prepare(sqlText);
    const inputs = params.map(toSqlInput);
    if (rowMode === "object") {
      const rows = stmt.all(...inputs);
      return Promise.resolve(rows.map(normalizeObjectRow));
    }
    const colCount = stmt.columns().length;
    stmt.setReturnArrays(true);
    const rows: readonly (Record<string, SQLOutputValue> | SQLOutputValue[])[] =
      stmt.all(...inputs);
    return Promise.resolve(
      rows.map((row) => toNormalizedArrayRow(row, colCount))
    );
  }

  const db = drizzle<typeof dbRelations, SqliteRunResult>(
    {
      get: getRow,
      all: allRows,
      run(
        sqlText: string,
        params: SqliteParamValue[]
      ): Promise<SqliteRunResult> {
        if (params.length === 0 && TX_CONTROL_REGEX.test(sqlText)) {
          rawDb.exec(sqlText);
          return Promise.resolve({ changes: 0, lastInsertRowid: 0 });
        }
        const stmt = rawDb.prepare(sqlText);
        const res = stmt.run(...params.map(toSqlInput));
        return Promise.resolve({
          changes: Number(res.changes),
          lastInsertRowid: Number(res.lastInsertRowid),
        });
      },
    },
    { relations: dbRelations, codecs: SQLITE_DRIZZLE_CODECS }
  );

  // Serialize top-level transactions on a single DatabaseSync handle while letting nested savepoints run inline.
  const txContext = new AsyncLocalStorage<boolean>();
  let txTail: Promise<void> = Promise.resolve();
  const originalTransaction: AppDb["transaction"] = db.transaction.bind(db);
  const serializedTransaction: AppDb["transaction"] = (transaction, config) => {
    if (txContext.getStore() === true) {
      return originalTransaction(transaction, config);
    }
    const previous = txTail;
    let releaseQueue: () => void = () => undefined;
    txTail = new Promise<void>((resolve) => {
      releaseQueue = resolve;
    });
    return previous
      .then(() =>
        txContext.run(true, () => originalTransaction(transaction, config))
      )
      .finally(() => {
        releaseQueue();
      });
  };
  db.transaction = serializedTransaction;
  return db;
}

export class SqliteLocalDriver implements DatabaseDriver {
  readonly name = "sqlite" as const;
  private options: SqliteDriverOptions;
  private rawDb: NodeDatabaseSync | undefined;
  private drizzleDb: AppDb | undefined;
  private currentPath: SqliteDatabasePath | undefined;

  constructor(options: SqliteDriverOptions = {}) {
    this.options = options;
  }

  configure(options: SqliteDriverOptions): void {
    this.closeSync();
    this.options = options;
  }

  private ensureOpen(): { rawDb: NodeDatabaseSync; db: AppDb } {
    if (!(this.rawDb && this.drizzleDb)) {
      const target = resolveSqliteDatabasePath(this.options.dataDir);
      if (!target.isMemory) {
        fs.mkdirSync(target.dataDir, { recursive: true });
      }
      const { DatabaseSync } = loadNodeSqlite();
      const rawDb = new DatabaseSync(target.dbPath);
      rawDb.exec("PRAGMA journal_mode = WAL;");
      rawDb.exec("PRAGMA foreign_keys = ON;");
      rawDb.exec("PRAGMA busy_timeout = 5000;");
      applySquashedSqliteMigration(rawDb);
      this.currentPath = target;
      this.rawDb = rawDb;
      this.drizzleDb = createSqliteProxyDb(rawDb);
    }
    return { rawDb: this.rawDb, db: this.drizzleDb };
  }

  getAppDb(): AppDb {
    return this.ensureOpen().db;
  }

  getOwnerDb(): OwnerDb {
    return this.ensureOpen().db;
  }

  getRawDatabase(): NodeDatabaseSync {
    return this.ensureOpen().rawDb;
  }

  getPaths(): SqliteDatabasePath {
    return this.currentPath ?? resolveSqliteDatabasePath(this.options.dataDir);
  }

  closeSync(): void {
    if (this.rawDb?.isOpen) {
      this.rawDb.close();
    }
    this.rawDb = undefined;
    this.drizzleDb = undefined;
    this.currentPath = undefined;
  }

  disconnect(): Promise<void> {
    this.closeSync();
    return Promise.resolve();
  }
}

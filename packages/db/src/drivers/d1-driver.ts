import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import type {
  D1BindingInput,
  D1BindValue,
  MinimalD1Database,
} from "#src/d1/types";
import {
  type AppDb,
  type DatabaseDriver,
  type OwnerDb,
  SQLITE_DRIZZLE_CODECS,
  type SqliteCellValue,
  type SqliteParamValue,
  type SqliteRunResult,
} from "#src/drivers/types";
import { dbRelations } from "#src/schema/relations";

const TX_CONTROL_REGEX =
  /^\s*(?:BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE\s+SAVEPOINT|ROLLBACK\s+TO\s+SAVEPOINT)\b/i;

function unwrapD1Binding(input: D1BindingInput): MinimalD1Database {
  return "core" in input ? input.core : input;
}

function toD1BindValue(value: SqliteParamValue): D1BindValue {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  return value;
}

function toCell(
  value: string | number | boolean | Uint8Array | null
): SqliteCellValue {
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  return value;
}

function createD1ProxyDb(resolveBinding: () => MinimalD1Database): AppDb {
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
  async function getRow(
    sqlText: string,
    params: SqliteParamValue[],
    rowMode?: "array" | "object"
  ): Promise<SqliteCellValue[] | Record<string, SqliteCellValue> | undefined> {
    const d1 = resolveBinding();
    const stmt = d1.prepare(sqlText).bind(...params.map(toD1BindValue));
    const res = await stmt.raw({ columnNames: true });
    if (res.length < 2) {
      return undefined;
    }
    const [cols, firstRow] = res;
    if (!firstRow) {
      return undefined;
    }
    if (rowMode === "object") {
      const obj: Record<string, SqliteCellValue> = {};
      for (let i = 0; i < cols.length; i++) {
        const col = cols[i];
        if (col !== undefined) {
          obj[col] = toCell(firstRow[i] ?? null);
        }
      }
      return obj;
    }
    return firstRow.map(toCell);
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
  async function allRows(
    sqlText: string,
    params: SqliteParamValue[],
    rowMode?: "array" | "object"
  ): Promise<SqliteCellValue[][] | Record<string, SqliteCellValue>[]> {
    const d1 = resolveBinding();
    const stmt = d1.prepare(sqlText).bind(...params.map(toD1BindValue));
    const res = await stmt.raw({ columnNames: true });
    if (res.length < 2) {
      return [];
    }
    const [cols, ...rows] = res;
    if (rowMode === "object") {
      return rows.map((row) => {
        const obj: Record<string, SqliteCellValue> = {};
        for (let i = 0; i < cols.length; i++) {
          const col = cols[i];
          if (col !== undefined) {
            obj[col] = toCell(row[i] ?? null);
          }
        }
        return obj;
      });
    }
    return rows.map((row) => row.map(toCell));
  }

  return drizzle<typeof dbRelations, SqliteRunResult>(
    {
      get: getRow,
      all: allRows,
      async run(
        sqlText: string,
        params: SqliteParamValue[]
      ): Promise<SqliteRunResult> {
        const d1 = resolveBinding();
        if (params.length === 0 && TX_CONTROL_REGEX.test(sqlText)) {
          // Cloudflare D1 does not support interactive BEGIN/COMMIT/SAVEPOINT over RPC; atomicity is via d1.batch().
          return { changes: 0, lastInsertRowid: 0 };
        }
        const res = await d1
          .prepare(sqlText)
          .bind(...params.map(toD1BindValue))
          .run();
        return {
          changes: res.meta?.changes ?? 0,
          lastInsertRowid: res.meta?.last_row_id ?? 0,
        };
      },
    },
    { relations: dbRelations, codecs: SQLITE_DRIZZLE_CODECS }
  );
}

export class D1Driver implements DatabaseDriver {
  readonly name = "d1" as const;
  private binding: MinimalD1Database | undefined;
  private readonly requestBindingAls =
    new AsyncLocalStorage<MinimalD1Database>();
  private proxyDb: AppDb | undefined;

  constructor(binding?: D1BindingInput) {
    if (binding) {
      this.setBindings(binding);
    }
  }

  private resolveActiveBinding(): MinimalD1Database {
    const active = this.requestBindingAls.getStore() ?? this.binding;
    if (!active) {
      throw new Error(
        "Cloudflare D1 binding is not registered. Call DB.registerD1Bindings(db) before using connection 'd1'."
      );
    }
    return active;
  }

  private ensureProxyDb(): AppDb {
    if (!this.proxyDb) {
      this.proxyDb = createD1ProxyDb(() => this.resolveActiveBinding());
    }
    return this.proxyDb;
  }

  setBindings(binding: D1BindingInput): AppDb {
    this.binding = unwrapD1Binding(binding);
    return this.ensureProxyDb();
  }

  enterRequestBinding(binding: D1BindingInput): AppDb {
    this.requestBindingAls.enterWith(unwrapD1Binding(binding));
    return this.ensureProxyDb();
  }

  async runWithBinding<T>(
    binding: D1BindingInput,
    fn: () => Promise<T>
  ): Promise<T> {
    return await this.requestBindingAls.run(unwrapD1Binding(binding), fn);
  }

  hasBindings(): boolean {
    return (
      this.requestBindingAls.getStore() !== undefined ||
      this.binding !== undefined
    );
  }

  clearBindings(): void {
    this.binding = undefined;
    this.proxyDb = undefined;
  }

  private ensureDb(): AppDb {
    if (!this.hasBindings()) {
      throw new Error(
        "Cloudflare D1 binding is not registered. Call DB.registerD1Bindings(db) before using connection 'd1'."
      );
    }
    return this.ensureProxyDb();
  }

  getAppDb(): AppDb {
    return this.ensureDb();
  }

  getOwnerDb(): OwnerDb {
    return this.ensureDb();
  }

  disconnect(): Promise<void> {
    this.clearBindings();
    return Promise.resolve();
  }
}

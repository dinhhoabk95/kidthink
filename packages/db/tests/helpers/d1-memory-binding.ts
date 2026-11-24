import { createRequire } from "node:module";
import type {
  DatabaseSync as NodeDatabaseSync,
  SQLInputValue,
} from "node:sqlite";
import type {
  D1BindValue,
  D1CellValue,
  MinimalD1Database,
  MinimalD1ExecResult,
  MinimalD1PreparedStatement,
  MinimalD1RunResult,
} from "#src/d1/types";
import { applySquashedSqliteMigration } from "#src/drivers/sqlite-migration-runner";

interface NodeSqliteModule {
  readonly DatabaseSync: typeof NodeDatabaseSync;
}

let cachedSqliteModule: NodeSqliteModule | undefined;

function loadNodeSqlite(): NodeSqliteModule {
  if (!cachedSqliteModule) {
    const req = createRequire(import.meta.url);
    cachedSqliteModule = req("node:sqlite") as NodeSqliteModule;
  }
  return cachedSqliteModule;
}

function toSqlInput(value: D1BindValue): SQLInputValue {
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  return value;
}

function normalizeD1Cell(
  value: string | number | bigint | Uint8Array | null | undefined
): D1CellValue {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  return value;
}

export interface InMemoryD1Context {
  readonly d1: MinimalD1Database;
  close(): void;
}

export function createInMemoryD1Database(): InMemoryD1Context {
  const { DatabaseSync } = loadNodeSqlite();
  const rawDb = new DatabaseSync(":memory:");
  rawDb.exec("PRAGMA foreign_keys = ON;");
  applySquashedSqliteMigration(rawDb);

  const makeStatement = (
    query: string,
    boundValues: readonly D1BindValue[] = []
  ): MinimalD1PreparedStatement => ({
    bind(...values: D1BindValue[]): MinimalD1PreparedStatement {
      return makeStatement(query, values);
    },
    raw: ((options?: { columnNames?: boolean }) => {
      const stmt = rawDb.prepare(query);
      stmt.setReturnArrays(true);
      const arrayRows: D1CellValue[][] = [];
      for (const rawRow of stmt.all(...boundValues.map(toSqlInput))) {
        if (Array.isArray(rawRow)) {
          arrayRows.push(rawRow.map(normalizeD1Cell));
        }
      }
      if (options?.columnNames) {
        if (arrayRows.length === 0) {
          return Promise.resolve([]);
        }
        const cols = stmt.columns().map((col) => col.name);
        return Promise.resolve([cols, ...arrayRows] as [
          string[],
          ...D1CellValue[][],
        ]);
      }
      return Promise.resolve(arrayRows);
    }) as MinimalD1PreparedStatement["raw"],
    run(): Promise<MinimalD1RunResult> {
      const stmt = rawDb.prepare(query);
      stmt.run(...boundValues.map(toSqlInput));
      return Promise.resolve({ success: true });
    },
  });

  const d1: MinimalD1Database = {
    prepare(query: string): MinimalD1PreparedStatement {
      return makeStatement(query);
    },
    async batch(
      statements: MinimalD1PreparedStatement[]
    ): Promise<MinimalD1RunResult[]> {
      const results: MinimalD1RunResult[] = [];
      for (const stmt of statements) {
        results.push(await stmt.run());
      }
      return results;
    },
    exec(query: string): Promise<MinimalD1ExecResult> {
      rawDb.exec(query);
      return Promise.resolve({ count: 0, duration: 0 });
    },
  };

  return {
    d1,
    close(): void {
      if (rawDb.isOpen) {
        rawDb.close();
      }
    },
  };
}

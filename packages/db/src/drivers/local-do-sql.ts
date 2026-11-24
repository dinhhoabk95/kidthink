import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type {
  DatabaseSync as NodeDatabaseSync,
  SQLInputValue,
  SQLOutputValue,
} from "node:sqlite";

/**
 * Adapter `node:sqlite` cho engine Durable Object chạy trong tiến trình (D15).
 *
 * Hình dạng `exec(query, ...bindings).toArray()` khớp phần `ctx.storage.sql` mà
 * `AuthCoordinatorEngine` và `JobQueueSqlEngine` dùng, nên cùng một engine chạy
 * được ở dev/test mà không đổi dòng nào. Nằm ở `packages/db` vì đây là chỗ duy
 * nhất được phép nạp `node:sqlite` (BR-MPA-01, rule `no-bypass-db-driver`).
 */
export type LocalDoSqlCell = string | number | null;

export interface LocalDoSqlStorage {
  /** Đóng handle; gọi `exec` sau đó ném lỗi. */
  close(): void;
  exec(
    query: string,
    ...bindings: LocalDoSqlCell[]
  ): { toArray(): Record<string, LocalDoSqlCell>[] };
}

interface NodeSqliteModule {
  readonly DatabaseSync: typeof NodeDatabaseSync;
}

const BUSY_TIMEOUT_MS = 5000;

let cachedModule: NodeSqliteModule | undefined;

/** Nạp lười qua `createRequire` để bundler Nitro/wrangler không phải giải `node:sqlite`. */
function loadNodeSqlite(): NodeSqliteModule {
  if (!cachedModule) {
    cachedModule = createRequire(import.meta.url)(
      "node:sqlite"
    ) as NodeSqliteModule;
  }
  return cachedModule;
}

function normalizeCell(value: SQLOutputValue | undefined): LocalDoSqlCell {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  return String(value);
}

function toRecord(
  row: Record<string, SQLOutputValue>
): Record<string, LocalDoSqlCell> {
  const record: Record<string, LocalDoSqlCell> = {};
  for (const [key, value] of Object.entries(row)) {
    record[key] = normalizeCell(value);
  }
  return record;
}

/**
 * `filePath` là đường dẫn file hoặc `":memory:"`. File dùng WAL + `busy_timeout`
 * để hai tiến trình dev (web producer, worker consumer) chia nhau một file queue.
 */
export function createLocalDoSqlStorage(filePath: string): LocalDoSqlStorage {
  const { DatabaseSync } = loadNodeSqlite();
  const inMemory = filePath === ":memory:";
  if (!inMemory) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }
  const db = new DatabaseSync(filePath);
  db.exec(`PRAGMA busy_timeout = ${BUSY_TIMEOUT_MS}`);
  if (!inMemory) {
    db.exec("PRAGMA journal_mode = WAL");
  }

  return {
    close: () => db.close(),
    exec(query, ...bindings) {
      const statement = db.prepare(query);
      const inputs: SQLInputValue[] = bindings;
      if (statement.columns().length > 0) {
        const rows = statement.all(...inputs).map(toRecord);
        return { toArray: () => rows };
      }
      statement.run(...inputs);
      return { toArray: () => [] };
    },
  };
}

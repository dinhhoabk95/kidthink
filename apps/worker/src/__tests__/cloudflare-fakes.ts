import type {
  D1CellValue,
  MinimalD1Database,
  MinimalD1PreparedStatement,
} from "@mindkid/db";
import type { MinimalDoSqlStorage, QueueRowCell } from "@mindkid/queue";
import type {
  DurableObjectNamespaceBinding,
  WorkerAuthCoordinatorStub,
} from "#src/cloudflare-runtime";

export function createFakeDoSql(): MinimalDoSqlStorage {
  const rows: Record<string, QueueRowCell>[] = [];
  let nextId = 1;
  return {
    exec(query: string, ...bindings: QueueRowCell[]) {
      if (query.includes("INSERT INTO queued_jobs")) {
        rows.push({
          id: nextId++,
          job_id: bindings[0] ?? null,
          name: bindings[1] ?? null,
          payload_json: bindings[2] ?? null,
          attempts: 0,
          max_attempts: bindings[3] ?? 1,
          backoff_type: bindings[4] ?? "fixed",
          backoff_delay_ms: bindings[5] ?? 1000,
          timeout_seconds: bindings[6] ?? 30,
          alert_immediate: bindings[7] ?? 0,
          run_at_ms: bindings[8] ?? 0,
          created_at_ms: bindings[9] ?? 0,
        });
        return { toArray: () => [] };
      }
      if (query.includes("COUNT(*) AS cnt FROM queued_jobs")) {
        return { toArray: () => [{ cnt: rows.length }] };
      }
      if (
        query.includes("FROM queued_jobs") &&
        query.includes("run_at_ms <=")
      ) {
        const nowMs = Number(bindings[0] ?? 0);
        return {
          toArray: () => rows.filter((r) => Number(r.run_at_ms ?? 0) <= nowMs),
        };
      }
      if (query.startsWith("DELETE FROM queued_jobs")) {
        const deletedIds = new Set(bindings.map(Number));
        for (let i = rows.length - 1; i >= 0; i--) {
          if (deletedIds.has(Number(rows[i]?.id ?? 0))) {
            rows.splice(i, 1);
          }
        }
        return { toArray: () => [] };
      }
      return { toArray: () => [] };
    },
  };
}

export function createFakeD1(): MinimalD1Database {
  function raw(options: {
    columnNames: true;
  }): Promise<[string[], ...D1CellValue[][]]>;
  function raw(options?: { columnNames?: false }): Promise<D1CellValue[][]>;
  function raw(options?: {
    columnNames?: boolean;
  }): Promise<[string[], ...D1CellValue[][]] | D1CellValue[][]> {
    if (options?.columnNames) {
      return Promise.resolve([[]]);
    }
    return Promise.resolve([]);
  }

  const stmt: MinimalD1PreparedStatement = {
    bind: () => stmt,
    raw,
    run: () =>
      Promise.resolve({
        success: true,
        meta: { changes: 0, last_row_id: 0 },
      }),
  };

  return {
    prepare: () => stmt,
    batch: () => Promise.resolve([]),
    exec: () => Promise.resolve({ count: 0, duration: 0 }),
  };
}

/** Namespace `AUTH_COORDINATOR` giả: đủ cho các test chỉ cần binding tồn tại. */
export function createFakeAuthCoordinator(): DurableObjectNamespaceBinding<WorkerAuthCoordinatorStub> {
  const stub: WorkerAuthCoordinatorStub = {
    kvGet: () => Promise.resolve(null),
    kvGetDel: () => Promise.resolve(null),
    kvSet: () => Promise.resolve("OK"),
    kvDel: () => Promise.resolve(0),
    kvIncr: () => Promise.resolve(1),
    kvExpire: () => Promise.resolve(1),
    kvDeleteByPrefix: () => Promise.resolve(0),
    consumeRateLimit: () =>
      Promise.resolve({ allowed: true, remaining: 1, resetSeconds: 60 }),
  };
  return { idFromName: () => ({}), get: () => stub };
}

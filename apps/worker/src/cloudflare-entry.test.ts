import { enterAuthCoordinatorPort } from "@mindkid/auth";
import { enterCloudflareCachePort } from "@mindkid/cache";
import type {
  D1CellValue,
  MinimalD1Database,
  MinimalD1PreparedStatement,
} from "@mindkid/db";
import type { MinimalDoSqlStorage, QueueRowCell } from "@mindkid/queue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CloudflareJobQueueController,
  type CloudflareWorkerEnv,
  type WorkerAuthCoordinatorStub,
} from "./cloudflare-entry.js";

vi.mock("@mindkid/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mindkid/auth")>();
  return {
    ...actual,
    enterAuthCoordinatorPort: vi.fn(),
  };
});

vi.mock("@mindkid/cache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mindkid/cache")>();
  return {
    ...actual,
    enterCloudflareCachePort: vi.fn(),
  };
});

vi.mock("#src/consumers/index", () => ({
  CONSUMERS: {
    "sweep:abandoned": vi.fn(() => Promise.resolve()),
  },
}));

function createFakeDoSql(): MinimalDoSqlStorage {
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

function createFakeD1(): MinimalD1Database {
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

describe("CloudflareJobQueueController (#31-CF DO bindings)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("binds AUTH_COORDINATOR to enterAuthCoordinatorPort and enterCloudflareCachePort before running consumer", async () => {
    const stub: WorkerAuthCoordinatorStub = {
      kvGet: vi.fn(() => Promise.resolve("val")),
      kvGetDel: vi.fn(() => Promise.resolve(null)),
      kvSet: vi.fn(() => Promise.resolve("OK")),
      kvDel: vi.fn(() => Promise.resolve(2)),
      kvIncr: vi.fn(() => Promise.resolve(1)),
      kvExpire: vi.fn(() => Promise.resolve(1)),
      kvDeleteByPrefix: vi.fn(() => Promise.resolve(5)),
    };

    const idObj = { name: "global-auth-v1" };
    const idFromName = vi.fn(() => idObj);
    const getStub = vi.fn(() => stub);
    const fakeD1 = createFakeD1();

    const env: CloudflareWorkerEnv = {
      DB_CORE: fakeD1,
      DB_LOGS: fakeD1,
      DB_BLOBS: fakeD1,
      MINDKID_RUNTIME: "cloudflare",
      AUTH_COORDINATOR: {
        idFromName,
        get: getStub,
      },
    };

    let alarmTime: number | null = null;
    const controller = new CloudflareJobQueueController(
      {
        storage: {
          sql: createFakeDoSql(),
          getAlarm: () => Promise.resolve(alarmTime),
          setAlarm: (ms: number) => {
            alarmTime = ms;
            return Promise.resolve();
          },
        },
      },
      env
    );

    await controller.enqueueBatch([
      {
        jobId: "sweep:test:1",
        name: "sweep:abandoned",
        payloadJson: JSON.stringify({ windowStart: "2026-11-22T00:00:00Z" }),
        delayMs: 0,
        maxAttempts: 1,
        backoffType: "fixed",
        backoffDelayMs: 1000,
        timeoutSeconds: 30,
        alertOnFailImmediately: false,
      },
    ]);

    const drained = await controller.alarm();
    expect(drained.processed).toBe(1);
    expect(drained.failed).toBe(0);
    expect(idFromName).toHaveBeenCalledWith("global-auth-v1");
    expect(getStub).toHaveBeenCalledWith(idObj);
    expect(enterAuthCoordinatorPort).toHaveBeenCalledWith(stub);
    expect(enterCloudflareCachePort).toHaveBeenCalledTimes(1);

    const cachePort = vi.mocked(enterCloudflareCachePort).mock.calls[0]?.[0];
    expect(cachePort).toBeDefined();
    if (cachePort) {
      expect(await cachePort.get("k1")).toBe("val");
      await cachePort.set("k1", "v1", 60);
      expect(stub.kvSet).toHaveBeenCalledWith("k1", "v1", 60);
      expect(await cachePort.del("k1", "k2")).toBe(2);
      expect(stub.kvDel).toHaveBeenCalledWith(["k1", "k2"]);
      expect(await cachePort.deleteByPrefix?.("ba:v1:user:")).toBe(5);
      expect(stub.kvDeleteByPrefix).toHaveBeenCalledWith("ba:v1:user:");
    }
  });
});

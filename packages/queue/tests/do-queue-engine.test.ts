import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { describe, expect, it } from "vitest";
import {
  JobQueueSqlEngine,
  type MinimalDoSqlStorage,
  type QueuedJobEnvelope,
  type QueueRowCell,
} from "#src/do-queue-driver";

function createSqliteDoStorage(): MinimalDoSqlStorage {
  const db = new DatabaseSync(":memory:");
  return {
    exec(query: string, ...bindings: QueueRowCell[]) {
      const trimmed = query.trim().toUpperCase();
      const sqlInputs: SQLInputValue[] = bindings;
      if (trimmed.startsWith("SELECT")) {
        const rows = db.prepare(query).all(...sqlInputs) as Record<
          string,
          QueueRowCell
        >[];
        return { toArray: () => rows };
      }
      if (bindings.length > 0) {
        db.prepare(query).run(...sqlInputs);
      } else {
        db.exec(query);
      }
      return { toArray: () => [] };
    },
  };
}

describe("JobQueueSqlEngine (Cloudflare DO > 50k-200k jobs/day Batch Coalescing)", () => {
  it("coalesces 500 enqueued jobs into ONLY 1 setAlarm write and drains in batch with idempotency & DLQ", async () => {
    const sql = createSqliteDoStorage();
    let scheduledAlarmMs: number | null = null;
    let setAlarmWriteCount = 0;
    const processedIds: string[] = [];
    const deadLetters: string[] = [];

    const engine = new JobQueueSqlEngine({
      sql,
      batchWindowMs: 0,
      alarms: {
        getAlarm: () => Promise.resolve(scheduledAlarmMs),
        setAlarm: (ms) => {
          scheduledAlarmMs = ms;
          setAlarmWriteCount += 1;
          return Promise.resolve();
        },
      },
      handler: ({ jobId }) => {
        if (jobId === "rollup:session:poison") {
          return Promise.reject(new Error("Simulated permanent failure"));
        }
        processedIds.push(jobId);
        return Promise.resolve();
      },
      onDeadLetter: ({ jobId }) => {
        deadLetters.push(jobId);
        return Promise.resolve();
      },
    });

    // Bắn dồn dập 500 lần gọi riêng lẻ (kèm 1 job trùng idempotency key + 1 poison job):
    for (let i = 0; i < 500; i++) {
      const item: QueuedJobEnvelope = {
        jobId: `rollup:session:s-${i}`,
        name: "rollup:session",
        payloadJson: JSON.stringify({ sessionUuid: `uuid-${i}` }),
        maxAttempts: 2,
        backoffType: "none",
        backoffDelayMs: 0,
        timeoutSeconds: 10,
      };
      await engine.enqueueBatch([item]);
    }

    // Thử đẩy trùng job s-0 (BR-JOB-02 idempotency deduplication)
    await engine.enqueueBatch([
      {
        jobId: "rollup:session:s-0",
        name: "rollup:session",
        payloadJson: JSON.stringify({ sessionUuid: "uuid-0" }),
        maxAttempts: 2,
        backoffType: "none",
        backoffDelayMs: 0,
        timeoutSeconds: 10,
      },
      {
        jobId: "rollup:session:poison",
        name: "rollup:session",
        payloadJson: JSON.stringify({ sessionUuid: "poison" }),
        maxAttempts: 1,
        backoffType: "none",
        backoffDelayMs: 0,
        timeoutSeconds: 10,
        alertOnFailImmediately: true,
      },
    ]);

    // Cực kỳ quan trọng: 501 lần enqueue liên tiếp chỉ tốn ĐÚNG 1 lần ghi `setAlarm()`!
    expect(setAlarmWriteCount).toBe(1);
    expect((await engine.getStats()).waiting).toBe(501);

    // Drain 6 lô (mỗi lô 100 job)
    for (let batch = 0; batch < 6; batch++) {
      await engine.drainBatch(100);
    }

    expect(processedIds).toHaveLength(500);
    expect(deadLetters).toEqual(["rollup:session:poison"]);
    expect(await engine.getStats()).toEqual({ waiting: 0, failed: 1 });
  });
});

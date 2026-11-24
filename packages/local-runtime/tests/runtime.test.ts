import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { getAuthRedisClient } from "@mindkid/auth";
import type { QueuedJobEnvelope } from "@mindkid/queue";
import { afterEach, describe, expect, it } from "vitest";
import {
  getLocalQueueRuntime,
  type LocalAuthRuntime,
  type LocalQueueRuntime,
  startLocalAuthRuntime,
  startLocalQueueConsumer,
  startLocalQueueProducer,
} from "#src/index";

function envelope(jobId: string): QueuedJobEnvelope {
  return {
    jobId,
    name: "rollup:session",
    payloadJson: JSON.stringify({ sessionUuid: jobId }),
    maxAttempts: 1,
    backoffType: "none",
    backoffDelayMs: 0,
    timeoutSeconds: 10,
  };
}

describe("local runtime — auth keyspace, cache, rate limit trên engine DO (D15)", () => {
  let runtime: LocalAuthRuntime | undefined;

  afterEach(() => {
    runtime?.close();
    runtime = undefined;
  });

  it("nối port auth vào engine SQLite; reset xoá keyspace", async () => {
    runtime = startLocalAuthRuntime(":memory:");

    const auth = getAuthRedisClient();
    await auth.set("ba:v1:user:k", "v", "EX", 60);
    expect(await auth.get("ba:v1:user:k")).toBe("v");
    const first = await runtime.engine.consumeRateLimit({
      key: "k",
      limit: 1,
      windowSeconds: 60,
    });
    const second = await runtime.engine.consumeRateLimit({
      key: "k",
      limit: 1,
      windowSeconds: 60,
    });
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);

    runtime.reset();
    expect(await auth.get("ba:v1:user:k")).toBeNull();
  });
});

describe("local runtime — queue trên JobQueueSqlEngine (BR-JOB-16)", () => {
  const dirs: string[] = [];
  const runtimes: LocalQueueRuntime[] = [];

  afterEach(() => {
    for (const r of runtimes.splice(0)) {
      r.close();
    }
    for (const d of dirs.splice(0)) {
      rmSync(d, { recursive: true, force: true });
    }
  });

  it("producer chỉ đẩy job, không chạy; peek thấy job trong hàng đợi", async () => {
    const producer = startLocalQueueProducer(":memory:");
    runtimes.push(producer);
    expect(getLocalQueueRuntime()).toBe(producer);

    await producer.engine.enqueueBatch([envelope("a")]);
    expect(producer.peek("a")?.name).toBe("rollup:session");
    expect(await producer.engine.getStats()).toEqual({ waiting: 1, failed: 0 });
  });

  it("consumer ở tiến trình khác nhặt job do producer đẩy vào cùng file (poll)", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "mk-queue-"));
    dirs.push(dir);
    const file = path.join(dir, "do-queue.sqlite");

    const ran: string[] = [];
    const consumer = startLocalQueueConsumer({
      filePath: file,
      pollIntervalMs: 20,
      handler: ({ jobId }) => {
        ran.push(jobId);
        return Promise.resolve();
      },
    });
    runtimes.push(consumer);
    const producer = startLocalQueueProducer(file);
    runtimes.push(producer);

    await producer.engine.enqueueBatch([envelope("b"), envelope("b")]);
    await expect.poll(() => ran, { timeout: 5000 }).toEqual(["b"]);
    expect(await consumer.engine.getStats()).toEqual({ waiting: 0, failed: 0 });
  });
});

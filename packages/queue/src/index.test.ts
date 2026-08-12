import { afterAll, describe, expect, it } from "vitest";
import { disconnectQueue, enqueue } from "./index.js";

describe("packages/queue", () => {
  afterAll(async () => {
    await disconnectQueue();
  });

  it("enqueues a backup:postgres job successfully", async () => {
    const job = await enqueue(
      "backup:postgres",
      {},
      { jobId: "test-backup-1" }
    );
    expect(job).toBeDefined();
    expect(job?.id).toBe("test-backup-1");
  });

  it("enqueues a backup:verify job successfully", async () => {
    const job = await enqueue(
      "backup:verify",
      { source: "s3://bucket/test.dump" },
      { jobId: "test-verify-1" }
    );
    expect(job).toBeDefined();
    expect(job?.id).toBe("test-verify-1");
  });

  it("enqueue twice with same jobId only creates one job", async () => {
    const job1 = await enqueue(
      "backup:postgres",
      {},
      { jobId: "test-idempotent" }
    );
    const job2 = await enqueue(
      "backup:postgres",
      {},
      { jobId: "test-idempotent" }
    );

    // In BullMQ, if you pass a jobId that already exists and hasn't finished,
    // the returned Job object represents the existing job, or it's ignored if we use certain methods.
    // BullMQ `add` returns the existing job if jobId matches an active/waiting one.
    expect(job1).toBeDefined();
    expect(job2?.id).toBe(job1?.id);
  });
});

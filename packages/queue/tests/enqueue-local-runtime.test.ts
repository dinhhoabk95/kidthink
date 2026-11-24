import { getLocalQueueRuntime } from "@mindkid/local-runtime";
import { describe, expect, it } from "vitest";
import {
  enqueue,
  enqueueBatch,
  getFailedCount,
  getWaitingCount,
} from "#src/index";

describe("enqueue qua JobQueueSqlEngine chạy trong tiến trình (BR-JOB-16)", () => {
  it("enqueue ghi job vào hàng đợi với jobId do caller đặt", async () => {
    const job = await enqueue(
      "backup:postgres",
      {},
      { jobId: "test-backup-1" }
    );
    expect(job.id).toBe("test-backup-1");
    expect(getLocalQueueRuntime()?.peek("test-backup-1")?.name).toBe(
      "backup:postgres"
    );
  });

  it("enqueue hai lần cùng jobId chỉ tạo một job (BR-JOB-02)", async () => {
    const before = await getWaitingCount();
    await enqueue("backup:postgres", {}, { jobId: "test-idempotent" });
    await enqueue("backup:postgres", {}, { jobId: "test-idempotent" });
    expect(await getWaitingCount()).toBe(before + 1);
  });

  it("enqueueBatch đếm đúng và payload được parse trước khi ghi", async () => {
    const result = await enqueueBatch([
      {
        name: "backup:verify",
        payload: { source: "s3://bucket/test.dump" },
        options: { jobId: "test-verify-1" },
      },
    ]);
    expect(result.accepted).toBe(1);
    const peeked = getLocalQueueRuntime()?.peek("test-verify-1");
    expect(peeked?.data).toEqual({ source: "s3://bucket/test.dump" });
    expect(await getFailedCount()).toBe(0);
  });
});

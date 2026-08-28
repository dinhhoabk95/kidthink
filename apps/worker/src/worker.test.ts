import { alert, JOB_DEFINITIONS } from "@mindkid/queue";
import type { Job } from "bullmq";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CONSUMERS } from "./consumers/index.js";
import {
  closeWorker,
  onJobFailed,
  processJob,
  runWithTimeout,
  startWorker,
} from "./worker.js";

const UNREGISTERED_JOB = /chưa được khai/;
const TIMEOUT_MESSAGE = /vượt timeout/;
/** Consumer không bao giờ xong — chỉ timeout mới kết thúc được phép thử. */
const NEVER = () => {
  // cố ý không gọi resolve/reject
};

vi.mock("@mindkid/queue", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mindkid/queue")>();
  return { ...actual, alert: vi.fn() };
});

function fakeJob(overrides: Partial<Job>): Job {
  return {
    id: "fake-id",
    name: "rollup:session",
    data: {},
    attemptsMade: 0,
    ...overrides,
  } as Job;
}

describe("apps/worker dispatcher", () => {
  beforeEach(() => {
    vi.mocked(alert).mockClear();
  });

  afterAll(async () => {
    await closeWorker();
    vi.restoreAllMocks();
  });

  it("từ chối tên job không đăng ký", async () => {
    await expect(processJob(fakeJob({ name: "unknown:job" }))).rejects.toThrow(
      UNREGISTERED_JOB
    );
  });

  it("từ chối payload sai hình dạng trước khi chạm consumer (BR-JOB-02)", async () => {
    await expect(
      processJob(fakeJob({ name: "rollup:session", data: {} }))
    ).rejects.toThrow();
  });

  it("bảng consumer phủ đủ mọi job đã đăng ký", () => {
    const registered = JOB_DEFINITIONS.map((job) => job.name).sort();
    expect(Object.keys(CONSUMERS).sort()).toEqual(registered);
  });
});

describe("apps/worker cảnh báo thất bại (BR-JOB-05)", () => {
  beforeEach(() => {
    vi.mocked(alert).mockClear();
  });

  it("không alert khi còn lượt retry", async () => {
    await onJobFailed(
      fakeJob({ name: "email:send", attemptsMade: 1 }),
      new Error("tạm thời")
    );
    expect(alert).not.toHaveBeenCalled();
  });

  it("alert khi đã cạn retry", async () => {
    await onJobFailed(
      fakeJob({ name: "email:send", attemptsMade: 5 }),
      new Error("hết lượt")
    );
    expect(alert).toHaveBeenCalledWith(
      "error",
      "Job email:send failed",
      expect.objectContaining({ jobId: "fake-id", attempt: 5, maxAttempts: 5 })
    );
  });

  it("alert ngay lần fail đầu với job phá huỷ dữ liệu (BR-ADL-08)", async () => {
    await onJobFailed(
      fakeJob({ name: "account:purge", attemptsMade: 0 }),
      new Error("xoá hỏng")
    );
    expect(alert).toHaveBeenCalledWith(
      "critical",
      "Job account:purge failed",
      expect.objectContaining({ jobId: "fake-id" })
    );
  });
});

describe("apps/worker timeout theo loại job (job-queue.md §5)", () => {
  it("trả kết quả khi consumer xong trước hạn", async () => {
    await expect(
      runWithTimeout("rollup:session", 5, () => Promise.resolve("xong"))
    ).resolves.toBe("xong");
  });

  it("ném JobTimeoutError khi consumer vượt hạn", async () => {
    await expect(
      // BR-TST-04 cấm chờ bằng setTimeout trong test: dùng promise không bao
      // giờ resolve, để chính đồng hồ của runWithTimeout kết thúc phép thử.
      runWithTimeout("backup:postgres", 0.05, () => new Promise(NEVER))
    ).rejects.toThrow(TIMEOUT_MESSAGE);
  });

  it("truyền signal đã abort cho consumer khi hết hạn", async () => {
    let seen: AbortSignal | undefined;
    await expect(
      runWithTimeout("backup:postgres", 0.05, (signal) => {
        seen = signal;
        return new Promise(NEVER);
      })
    ).rejects.toThrow(TIMEOUT_MESSAGE);
    expect(seen?.aborted).toBe(true);
  });
});

describe("apps/worker vòng đời", () => {
  it("worker can be started and closed cleanly", async () => {
    const worker = startWorker();
    expect(worker).toBeDefined();
    await closeWorker();
  });
});

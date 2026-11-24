import { alert, JOB_DEFINITIONS } from "@mindkid/queue";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CONSUMERS } from "./consumers/index.js";
import { reportJobDeadLetter, runJobConsumer } from "./job-runner.js";
import { runWithTimeout } from "./run-with-timeout.js";
import { closeWorker, startWorker } from "./worker.js";

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

function job(name: string, payload: object = {}, attempt = 1) {
  return {
    jobId: "fake-id",
    // Tên lạ được truyền xuyên kiểu để kiểm đường từ chối của `requireJob`.
    name: name as Parameters<typeof runJobConsumer>[0]["name"],
    payload,
    attempt,
    timeoutSeconds: 5,
  };
}

describe("apps/worker dispatcher", () => {
  beforeEach(() => {
    vi.mocked(alert).mockClear();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("từ chối tên job không đăng ký", async () => {
    await expect(runJobConsumer(job("unknown:job"))).rejects.toThrow(
      UNREGISTERED_JOB
    );
  });

  it("từ chối payload sai hình dạng trước khi chạm consumer (BR-JOB-02)", async () => {
    await expect(runJobConsumer(job("rollup:session", {}))).rejects.toThrow();
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

  it("job hết lượt retry phát alert mức error", async () => {
    await reportJobDeadLetter({
      jobId: "fake-id",
      name: "email:send",
      attempts: 5,
      maxAttempts: 5,
      errorMessage: "hết lượt",
      critical: false,
    });
    expect(alert).toHaveBeenCalledWith(
      "error",
      "Job email:send failed",
      expect.objectContaining({
        jobId: "fake-id",
        attempts: 5,
        maxAttempts: 5,
      })
    );
  });

  it("alert ngay lần fail đầu với job phá huỷ dữ liệu (BR-ADL-08)", async () => {
    await reportJobDeadLetter({
      jobId: "fake-id",
      name: "account:purge",
      attempts: 1,
      maxAttempts: 3,
      errorMessage: "xoá hỏng",
      critical: true,
    });
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
  it("worker dev khởi động và đóng sạch trên SQLite trong bộ nhớ", () => {
    vi.stubEnv("SQLITE_DATA_DIR", ":memory:");
    try {
      const queue = startWorker();
      expect(queue.engine).toBeDefined();
      expect(startWorker()).toBe(queue);
    } finally {
      closeWorker();
      vi.unstubAllEnvs();
    }
  });
});

import { alert, getFailedCount, getWaitingCount } from "@mindkid/queue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkQueueHealth,
  initialMonitorState,
  type MonitorState,
} from "./monitor.js";

vi.mock("@mindkid/queue", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mindkid/queue")>();
  return {
    ...actual,
    alert: vi.fn(),
    getWaitingCount: vi.fn(),
    getFailedCount: vi.fn(),
  };
});

const HOUR_MS = 60 * 60 * 1000;

function sample(waiting: number, failed: number): void {
  vi.mocked(getWaitingCount).mockResolvedValue(waiting);
  vi.mocked(getFailedCount).mockResolvedValue(failed);
}

/** Trạng thái lúc worker vừa khởi động — chưa có mẫu nào. */
function freshState(now: number): MonitorState {
  return initialMonitorState(now);
}

describe("checkQueueHealth — cửa sổ job thất bại (BR-JOB-03, job-queue.md §7.3)", () => {
  beforeEach(() => {
    vi.mocked(alert).mockClear();
  });

  it("trạng thái khởi động Cấm — NEVER gieo mốc bằng 0", async () => {
    // Đây chính là dòng đã gây báo động giả: `failedAtWindowStart: 0`.
    expect(initialMonitorState(1000).failedAtWindowStart).toBeUndefined();

    // Và ca âm cho chính nó: gieo bằng 0 thì tick đầu tiên bắn alert.
    sample(0, 500);
    await checkQueueHealth(
      { failedWindowStart: 1000, failedAtWindowStart: 0 },
      1000
    );
    expect(alert).toHaveBeenCalledTimes(1);
  });

  it("mẫu đầu tiên chỉ đặt mốc, Cấm — NEVER báo động", async () => {
    // `getFailedCount()` là tổng TRỌN ĐỜI của queue. Trước sửa đổi này mốc được
    // gieo bằng 0, nên mọi lần khởi động lại đều thấy "500 job thất bại trong
    // cửa sổ" và bắn alert — đúng kênh mà §1 gọi là chế độ hỏng tệ nhất.
    sample(0, 500);

    const next = await checkQueueHealth(freshState(1000), 1000);

    expect(alert).not.toHaveBeenCalled();
    expect(next.failedAtWindowStart).toBe(500);
  });

  it("ca âm: vượt ngưỡng SAU khi đã có mốc thì báo động", async () => {
    sample(0, 500);
    const seeded = await checkQueueHealth(freshState(1000), 1000);

    sample(0, 511);
    await checkQueueHealth(seeded, 2000);

    expect(alert).toHaveBeenCalledTimes(1);
    expect(vi.mocked(alert).mock.calls[0]?.[1]).toContain("thất bại");
  });

  it("tăng nhưng chưa quá ngưỡng thì im", async () => {
    sample(0, 500);
    const seeded = await checkQueueHealth(freshState(1000), 1000);

    sample(0, 510);
    await checkQueueHealth(seeded, 2000);

    expect(alert).not.toHaveBeenCalled();
  });

  it("hết một giờ thì mốc dời theo số hiện tại, không cộng dồn trọn đời", async () => {
    sample(0, 500);
    const seeded = await checkQueueHealth(freshState(1000), 1000);

    sample(0, 505);
    const rolled = await checkQueueHealth(seeded, 1000 + HOUR_MS);

    expect(alert).not.toHaveBeenCalled();
    expect(rolled.failedAtWindowStart).toBe(505);
    expect(rolled.failedWindowStart).toBe(1000 + HOUR_MS);
  });
});

describe("checkQueueHealth — backlog waiting", () => {
  beforeEach(() => {
    vi.mocked(alert).mockClear();
  });

  it("dưới ngưỡng thì xoá mốc backlog", async () => {
    sample(10, 0);

    const next = await checkQueueHealth(
      {
        failedWindowStart: 1000,
        failedAtWindowStart: 0,
        waitingHighSince: 500,
      },
      1000
    );

    expect(next.waitingHighSince).toBeUndefined();
    expect(alert).not.toHaveBeenCalled();
  });

  it("vượt ngưỡng nhưng chưa đủ 5 phút thì chưa báo động", async () => {
    sample(501, 0);

    const next = await checkQueueHealth(
      { failedWindowStart: 1000, failedAtWindowStart: 0 },
      1000
    );

    expect(next.waitingHighSince).toBe(1000);
    expect(alert).not.toHaveBeenCalled();
  });

  it("ca âm: vượt ngưỡng liên tục quá 5 phút thì báo động critical", async () => {
    sample(501, 0);

    await checkQueueHealth(
      {
        failedWindowStart: 1000,
        failedAtWindowStart: 0,
        waitingHighSince: 1000,
      },
      1000 + 5 * 60 * 1000
    );

    expect(alert).toHaveBeenCalledTimes(1);
    expect(vi.mocked(alert).mock.calls[0]?.[0]).toBe("critical");
  });
});

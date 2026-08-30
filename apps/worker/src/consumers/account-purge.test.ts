import { hardPurgeUser } from "@mindkid/db";
import { alert } from "@mindkid/queue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { accountPurge } from "./account-purge.js";
import type { JobContext } from "./types.js";

const dueRows = [
  { id: 1, purgeAt: new Date("2026-08-01") },
  { id: 2, purgeAt: new Date("2026-08-02") },
  { id: 3, purgeAt: new Date("2026-08-03") },
];

vi.mock("@mindkid/db", () => ({
  getOwnerDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve(dueRows) }),
      }),
    }),
  }),
  hardPurgeUser: vi.fn(() => Promise.resolve({ purged: true })),
  users: { id: "id", status: "status", purgeAt: "purge_at" },
}));

vi.mock("@mindkid/queue", () => ({ alert: vi.fn() }));

function ctx(signal: AbortSignal): JobContext {
  return { jobId: "account:purge:test", attempt: 1, signal };
}

/** Signal đã abort — đúng trạng thái sau khi `runWithTimeout` hết giờ. */
function abortedSignal(): AbortSignal {
  const controller = new AbortController();
  controller.abort();
  return controller.signal;
}

describe("accountPurge — tôn trọng ctx.signal (job-queue.md §5)", () => {
  beforeEach(() => {
    vi.mocked(hardPurgeUser).mockClear();
    vi.mocked(alert).mockClear();
  });

  it("chạy hết danh sách khi signal còn sống", async () => {
    const result = await accountPurge({}, ctx(new AbortController().signal));

    expect(hardPurgeUser).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ purgedCount: 3, remaining: false });
  });

  it("ca âm: signal đã abort thì Cấm — NEVER xoá cứng thêm một tài khoản nào", async () => {
    // Trước sửa đổi này vòng lặp không đọc signal: `runWithTimeout` đánh job
    // `failed` và bắn alert `critical` "purge thất bại", trong khi vòng lặp vẫn
    // tiếp tục xoá cứng dữ liệu người dùng — không job, không lock, không ghi
    // lại nó dừng ở đâu.
    const result = await accountPurge({}, ctx(abortedSignal()));

    expect(hardPurgeUser).not.toHaveBeenCalled();
    expect(result).toEqual({ purgedCount: 0, remaining: false });
  });

  it("abort giữa chừng thì dừng ngay và báo đúng số đã xoá", async () => {
    const controller = new AbortController();
    vi.mocked(hardPurgeUser).mockImplementation(() => {
      controller.abort();
      return Promise.resolve({ purged: true });
    });

    const result = await accountPurge({}, ctx(controller.signal));

    expect(hardPurgeUser).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ purgedCount: 1, remaining: false });
  });
});

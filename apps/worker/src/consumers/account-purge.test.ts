import { hardPurgeChildProfile, hardPurgeUser } from "@mindkid/db";
import { alert } from "@mindkid/queue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { accountPurge } from "./account-purge.js";
import type { JobContext } from "./types.js";

const dueRows = [
  { id: 1, purgeAt: new Date("2026-08-01") },
  { id: 2, purgeAt: new Date("2026-08-02") },
  { id: 3, purgeAt: new Date("2026-08-03") },
];

const dueChildren: Array<{ id: number; uuid: string }> = [
  { id: 10, uuid: "child-10" },
  { id: 11, uuid: "child-11" },
];

vi.mock("@mindkid/db", () => ({
  getOwnerDb: () => ({
    select: (fields: Record<string, string>) => ({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve("uuid" in fields ? dueChildren : dueRows),
        }),
      }),
    }),
  }),
  hardPurgeUser: vi.fn(() => Promise.resolve({ purged: true })),
  hardPurgeChildProfile: vi.fn(() => Promise.resolve()),
  childProfiles: { id: "id", uuid: "uuid", status: "status", purgeAt: "pa" },
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
    vi.mocked(hardPurgeUser).mockReset();
    vi.mocked(hardPurgeUser).mockResolvedValue({ purged: true });
    vi.mocked(hardPurgeChildProfile).mockClear();
    vi.mocked(alert).mockClear();
  });

  it("chạy hết danh sách khi signal còn sống", async () => {
    const result = await accountPurge({}, ctx(new AbortController().signal));

    expect(hardPurgeUser).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      purgedCount: 3,
      purgedChildren: 2,
      remaining: false,
    });
  });

  it("ca âm: signal đã abort thì Cấm — NEVER xoá cứng thêm một tài khoản nào", async () => {
    // Trước sửa đổi này vòng lặp không đọc signal: `runWithTimeout` đánh job
    // `failed` và bắn alert `critical` "purge thất bại", trong khi vòng lặp vẫn
    // tiếp tục xoá cứng dữ liệu người dùng — không job, không lock, không ghi
    // lại nó dừng ở đâu.
    const result = await accountPurge({}, ctx(abortedSignal()));

    expect(hardPurgeUser).not.toHaveBeenCalled();
    expect(result).toEqual({
      purgedCount: 0,
      purgedChildren: 0,
      remaining: false,
    });
  });

  it("abort giữa chừng thì dừng ngay và báo đúng số đã xoá", async () => {
    const controller = new AbortController();
    vi.mocked(hardPurgeUser).mockImplementation(() => {
      controller.abort();
      return Promise.resolve({ purged: true });
    });

    const result = await accountPurge({}, ctx(controller.signal));

    expect(hardPurgeUser).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      purgedCount: 1,
      purgedChildren: 0,
      remaining: false,
    });
  });

  it("UC-019: xoá thật từng hồ sơ trẻ đến hạn (id + uuid)", async () => {
    await accountPurge({}, ctx(new AbortController().signal));

    expect(hardPurgeChildProfile).toHaveBeenCalledTimes(2);
    expect(hardPurgeChildProfile).toHaveBeenCalledWith(
      expect.anything(),
      10,
      "child-10"
    );
  });

  it("ca âm: signal đã abort thì không xoá hồ sơ trẻ nào", async () => {
    await accountPurge({}, ctx(abortedSignal()));

    expect(hardPurgeChildProfile).not.toHaveBeenCalled();
  });

  it("BR-008: xoá hồ sơ trẻ lỗi thì alert và ném lại, không im lặng", async () => {
    vi.mocked(hardPurgeChildProfile).mockRejectedValueOnce(new Error("boom"));

    await expect(
      accountPurge({}, ctx(new AbortController().signal))
    ).rejects.toThrow("boom");
    expect(alert).toHaveBeenCalledWith(
      "error",
      "Child profile purge job failed",
      expect.objectContaining({ childId: 10 })
    );
  });
});

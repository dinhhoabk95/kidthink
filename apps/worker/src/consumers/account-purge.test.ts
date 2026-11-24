import { getAuthRedisClient } from "@mindkid/auth";
import { invalidateUserEntitlementsCache } from "@mindkid/cache";
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

const mockFindUserSessions = vi.fn(
  async (args: { readonly where: { readonly userId: number } }) => [
    { id: args.where.userId * 100, token: `tok_${args.where.userId}` },
  ]
);

const mockRedisDel = vi.fn(async (..._keys: string[]) => 1);

vi.mock("@mindkid/auth", () => ({
  getAuthRedisClient: () => ({
    del: mockRedisDel,
  }),
}));

vi.mock("@mindkid/cache", () => ({
  invalidateUserEntitlementsCache: vi.fn(async () => undefined),
}));

vi.mock("@mindkid/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mindkid/db")>();
  return {
    ...actual,
    getOwnerDb: () => ({
      query: {
        userSessions: {
          findMany: mockFindUserSessions,
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: 1 }]),
        })),
      })),
    }),
    hardPurgeUser: vi.fn(() => Promise.resolve({ purged: true })),
    hardPurgeChildProfile: vi.fn(() => Promise.resolve()),
  };
});

vi.mock("@mindkid/db/repositories", () => ({
  createRepositories: () => ({
    users: {
      listDueForPurge: vi.fn(async () => dueRows),
    },
    childProfiles: {
      listDueForPurge: vi.fn(async () => dueChildren),
    },
  }),
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

describe("accountPurge — tôn trọng ctx.signal & thu hồi AuthStore (job-queue.md §5)", () => {
  beforeEach(() => {
    vi.mocked(hardPurgeUser).mockReset();
    vi.mocked(hardPurgeUser).mockResolvedValue({ purged: true });
    vi.mocked(hardPurgeChildProfile).mockClear();
    vi.mocked(alert).mockClear();
    mockFindUserSessions.mockClear();
    mockRedisDel.mockClear();
    vi.mocked(invalidateUserEntitlementsCache).mockClear();
  });

  it("chạy hết danh sách khi signal còn sống và thu hồi session AuthStore + cache quyền", async () => {
    const result = await accountPurge({}, ctx(new AbortController().signal));

    expect(hardPurgeUser).toHaveBeenCalledTimes(3);
    expect(getAuthRedisClient().del).toHaveBeenCalledWith(
      "ba:v1:user:active-sessions-1",
      "ba:v1:user:tok_1",
      "ba:v1:user:reauth:100"
    );
    expect(invalidateUserEntitlementsCache).toHaveBeenCalledTimes(3);
    expect(invalidateUserEntitlementsCache).toHaveBeenCalledWith(1);
    expect(invalidateUserEntitlementsCache).toHaveBeenCalledWith(2);
    expect(invalidateUserEntitlementsCache).toHaveBeenCalledWith(3);
    expect(result).toEqual({
      purgedCount: 3,
      purgedChildren: 2,
      remaining: false,
    });
  });

  it("ca âm: signal đã abort thì Cấm — NEVER xoá cứng thêm một tài khoản nào", async () => {
    const result = await accountPurge({}, ctx(abortedSignal()));

    expect(hardPurgeUser).not.toHaveBeenCalled();
    expect(mockRedisDel).not.toHaveBeenCalled();
    expect(invalidateUserEntitlementsCache).not.toHaveBeenCalled();
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

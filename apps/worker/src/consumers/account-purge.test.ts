import { getAuthRedisClient } from "@mindkid/auth";
import { invalidateUserEntitlementsCache } from "@mindkid/cache";
import {
  CHILD_STATUS,
  childProfiles,
  getOwnerDb,
  USER_STATUS,
  userSessions,
  users,
} from "@mindkid/db";
import { alert } from "@mindkid/queue";
import { inArray, sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accountPurge } from "./account-purge.js";
import type { JobContext } from "./types.js";

const mockRedisDel = vi.fn(async (..._keys: string[]) => 1);

vi.mock("@mindkid/auth", () => ({
  getAuthRedisClient: () => ({
    del: mockRedisDel,
  }),
}));

vi.mock("@mindkid/cache", () => ({
  invalidateUserEntitlementsCache: vi.fn(async () => undefined),
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

const PAST = new Date("2026-08-01T00:00:00Z");
const TRIGGER = "trg_account_purge_test_boom";

interface Seeded {
  readonly userIds: number[];
  readonly sessions: { id: number; token: string; userId: number }[];
  readonly childIds: number[];
  readonly boomChildId: number;
}

let seeded: Seeded;
let tag = 0;

async function seedDueRows(): Promise<Seeded> {
  const db = getOwnerDb();
  tag += 1;
  const stamp = `${Date.now()}-${tag}`;
  const userIds: number[] = [];
  const sessions: Seeded["sessions"] = [];
  for (let i = 1; i <= 3; i++) {
    const [u] = await db
      .insert(users)
      .values({
        email: `purge-${stamp}-${i}@example.com`,
        displayName: `Purge ${i}`,
        emailVerified: true,
        status: USER_STATUS.DELETED,
        purgeAt: new Date(PAST.getTime() + i * 1000),
      })
      .returning();
    if (!u) {
      throw new Error("seed user failed");
    }
    userIds.push(u.id);
    const [sess] = await db
      .insert(userSessions)
      .values({
        userId: u.id,
        token: `tok-${stamp}-${i}`,
        expiresAt: new Date("2030-01-01T00:00:00Z"),
      })
      .returning();
    if (!sess) {
      throw new Error("seed session failed");
    }
    sessions.push({ id: sess.id, token: sess.token, userId: u.id });
  }
  const [owner] = await db
    .insert(users)
    .values({
      email: `purge-owner-${stamp}@example.com`,
      displayName: "Owner",
      emailVerified: true,
      status: USER_STATUS.ACTIVE,
    })
    .returning();
  if (!owner) {
    throw new Error("seed owner failed");
  }
  userIds.push(owner.id);
  const childIds: number[] = [];
  let boomChildId = 0;
  for (const name of ["Bé A", "boom-child"]) {
    const [c] = await db
      .insert(childProfiles)
      .values({
        userId: owner.id,
        displayName: name,
        birthYear: 2021,
        avatarId: "preset_cat_01",
        status: CHILD_STATUS.PENDING_DELETION,
        purgeAt: PAST,
      })
      .returning();
    if (!c) {
      throw new Error("seed child failed");
    }
    childIds.push(c.id);
    if (name === "boom-child") {
      boomChildId = c.id;
    }
  }
  return { userIds, sessions, childIds, boomChildId };
}

/** `hardPurgeUser` ẩn danh hoá hàng user (xoá `purge_at`), không xoá hàng. */
async function stillDueUserIds(ids: readonly number[]): Promise<number[]> {
  const rows = await getOwnerDb()
    .select({ id: users.id, purgeAt: users.purgeAt })
    .from(users)
    .where(inArray(users.id, [...ids]));
  return rows.filter((r) => r.purgeAt !== null).map((r) => r.id);
}

async function existingChildIds(ids: readonly number[]): Promise<number[]> {
  const rows = await getOwnerDb()
    .select({ id: childProfiles.id })
    .from(childProfiles)
    .where(inArray(childProfiles.id, [...ids]));
  return rows.map((r) => r.id);
}

describe("accountPurge — tôn trọng ctx.signal & thu hồi AuthStore (job-queue.md §5)", () => {
  beforeEach(async () => {
    vi.mocked(alert).mockClear();
    mockRedisDel.mockReset();
    mockRedisDel.mockResolvedValue(1);
    vi.mocked(invalidateUserEntitlementsCache).mockClear();
    seeded = await seedDueRows();
  });

  afterEach(async () => {
    const db = getOwnerDb();
    await db.run(sql.raw(`DROP TRIGGER IF EXISTS ${TRIGGER}`));
    await db
      .delete(childProfiles)
      .where(inArray(childProfiles.id, seeded.childIds));
    await db.delete(users).where(inArray(users.id, seeded.userIds));
  });

  it("chạy hết danh sách khi signal còn sống và thu hồi session AuthStore + cache quyền", async () => {
    const result = await accountPurge({}, ctx(new AbortController().signal));

    const purgedUserIds = seeded.userIds.slice(0, 3);
    expect(await stillDueUserIds(purgedUserIds)).toEqual([]);
    for (const session of seeded.sessions) {
      expect(getAuthRedisClient().del).toHaveBeenCalledWith(
        `ba:v1:user:active-sessions-${session.userId}`,
        `ba:v1:user:${session.token}`,
        `ba:v1:user:reauth:${session.id}`
      );
    }
    expect(invalidateUserEntitlementsCache).toHaveBeenCalledTimes(3);
    for (const id of purgedUserIds) {
      expect(invalidateUserEntitlementsCache).toHaveBeenCalledWith(id);
    }
    expect(result).toEqual({
      purgedCount: 3,
      purgedChildren: 2,
      remaining: false,
    });
  });

  it("ca âm: signal đã abort thì Cấm — NEVER xoá cứng thêm một tài khoản nào", async () => {
    const result = await accountPurge({}, ctx(abortedSignal()));

    expect(await stillDueUserIds(seeded.userIds)).toHaveLength(3);
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
    // Thu hồi session chạy ngay sau mỗi lần xoá user: abort ở đây = abort giữa chừng.
    mockRedisDel.mockImplementation(() => {
      controller.abort();
      return Promise.resolve(1);
    });

    const result = await accountPurge({}, ctx(controller.signal));

    expect(await stillDueUserIds(seeded.userIds.slice(0, 3))).toHaveLength(2);
    expect(result).toEqual({
      purgedCount: 1,
      purgedChildren: 0,
      remaining: false,
    });
  });

  it("UC-019: xoá thật từng hồ sơ trẻ đến hạn (id + uuid)", async () => {
    await accountPurge({}, ctx(new AbortController().signal));

    expect(await existingChildIds(seeded.childIds)).toEqual([]);
  });

  it("ca âm: signal đã abort thì không xoá hồ sơ trẻ nào", async () => {
    await accountPurge({}, ctx(abortedSignal()));

    expect(await existingChildIds(seeded.childIds)).toHaveLength(2);
  });

  it("BR-008: xoá hồ sơ trẻ lỗi thì alert và ném lại, không im lặng", async () => {
    // Lỗi thật từ DB: trigger chặn xoá đúng hồ sơ `boom-child`.
    await getOwnerDb().run(
      sql.raw(
        `CREATE TRIGGER ${TRIGGER} BEFORE DELETE ON child_profiles WHEN OLD.display_name = 'boom-child' BEGIN SELECT RAISE(ABORT, 'boom'); END`
      )
    );

    await expect(
      accountPurge({}, ctx(new AbortController().signal))
    ).rejects.toThrow();
    expect(alert).toHaveBeenCalledWith(
      "error",
      "Child profile purge job failed",
      expect.objectContaining({ childId: seeded.boomChildId })
    );
  });
});

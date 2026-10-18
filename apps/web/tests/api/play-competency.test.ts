import crypto from "node:crypto";
import {
  childProfiles,
  entitlements,
  gameLevels,
  getOwnerDb,
  playSessions,
  users,
} from "@mindkid/db";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import getCompetencyHandler from "#server/api/users/play/competency/[code].get";
import type { ChildCompetencyResponse } from "#server/services/child-competency-explorer";
import { invalidateUserEntitlementsCache } from "#server/utils/entitlements-runtime";

interface ChildFixture {
  readonly userId: number;
  readonly childId: number;
  readonly childUuid: string;
}

function mockEvent(
  userId: number,
  childUuid: string | null,
  code: string
): Parameters<typeof getCompetencyHandler>[0] {
  const responseHeaders: Record<string, string> = {};
  const url = `/api/users/play/competency/${code}`;
  const cookies: string[] = [];
  if (childUuid) {
    cookies.push(`active_child_id=${childUuid}`);
  }
  return {
    method: "GET",
    node: {
      req: {
        headers: { cookie: cookies.join("; ") },
        url,
        originalUrl: url,
      },
      res: {
        setHeader: (name: string, value: string) => {
          responseHeaders[name.toLowerCase()] = value;
        },
        getHeader: (name: string) => responseHeaders[name.toLowerCase()],
        statusCode: 200,
      },
    },
    context: {
      params: { code },
      user: {
        user_id: userId,
        display_name: "Phụ huynh CCE",
        session_id: `sess_${userId}`,
      },
    },
  } as never;
}

async function createChildFixture(birthYear: number): Promise<ChildFixture> {
  const db = getOwnerDb();
  const hex = crypto.randomBytes(4).toString("hex");
  const [user] = await db
    .insert(users)
    .values({
      email: `cce-${hex}@example.com`,
      displayName: "Phụ huynh CCE",
    })
    .returning();
  if (!user) {
    throw new Error("Không tạo được user");
  }
  const [child] = await db
    .insert(childProfiles)
    .values({
      userId: user.id,
      displayName: "Bé CCE",
      birthYear,
      avatarId: "preset_01",
    })
    .returning();
  if (!child) {
    throw new Error("Không tạo được hồ sơ trẻ");
  }
  return { userId: user.id, childId: child.id, childUuid: child.uuid };
}

function statusOf(err: object): number | undefined {
  const candidate = err as { statusCode?: number; status?: number };
  return candidate.statusCode ?? candidate.status;
}

describe("Child Competency Explorer API (child-competency-explorer.md, BR-CCE-02, BR-CCE-07, bước 4)", () => {
  const db = getOwnerDb();
  const createdLevelIds: number[] = [];
  const createdUserIds: number[] = [];
  let levelAge56Code = "";
  let levelAge45Code = "";

  beforeAll(async () => {
    const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    // Đặt mã level 5-6 tuổi đứng trước theo thứ tự từ điển ("AA") để chứng minh
    // BR-CCE-02 xếp theo độ tuổi hợp band trước rồi mới theo code.
    levelAge56Code = `GL-C1-CCE-AA56-${suffix}`;
    levelAge45Code = `GL-C1-CCE-ZZ45-${suffix}`;

    const rows = await db
      .insert(gameLevels)
      .values([
        {
          entityId: crypto.randomInt(100_000_000, 2_000_000_000),
          code: levelAge56Code,
          templateCode: "GT-001",
          title: "Trò chơi C1 cho 5-6 tuổi",
          thumbnailEmoji: "🚀",
          contentPack: {},
          difficultyParams: {},
          ageMin: 5,
          ageMax: 6,
          accessTier: "premium",
          status: "published",
        },
        {
          entityId: crypto.randomInt(100_000_000, 2_000_000_000),
          code: levelAge45Code,
          templateCode: "GT-001",
          title: "Trò chơi C1 cho 4-5 tuổi",
          thumbnailEmoji: "🍎",
          contentPack: {},
          difficultyParams: {},
          ageMin: 4,
          ageMax: 5,
          accessTier: "free",
          status: "published",
        },
      ])
      .returning({ id: gameLevels.id });

    for (const row of rows) {
      createdLevelIds.push(row.id);
    }
  });

  afterAll(async () => {
    if (createdLevelIds.length > 0) {
      await db
        .delete(playSessions)
        .where(inArray(playSessions.gameLevelId, createdLevelIds));
      await db
        .delete(gameLevels)
        .where(inArray(gameLevels.id, createdLevelIds));
    }
    for (const uid of createdUserIds) {
      await db.delete(entitlements).where(eq(entitlements.userId, uid));
      await db.delete(users).where(eq(users.id, uid));
    }
  });

  it("BR-CCE-02: trả về cả level hợp tuổi và ngoài tuổi, xếp level hợp age_band đứng trước", async () => {
    const currentYear = new Date().getFullYear();
    // Trẻ 4 tuổi -> age_band "4-5"
    const fixture = await createChildFixture(currentYear - 4);
    createdUserIds.push(fixture.userId);

    const res = (await getCompetencyHandler(
      mockEvent(fixture.userId, fixture.childUuid, "C1")
    )) as ChildCompetencyResponse;

    expect(res.child.age_band).toBe("4-5");
    const idx45 = res.games.findIndex((g) => g.code === levelAge45Code);
    const idx56 = res.games.findIndex((g) => g.code === levelAge56Code);

    expect(idx45).toBeGreaterThanOrEqual(0);
    expect(idx56).toBeGreaterThanOrEqual(0);
    expect(idx45).toBeLessThan(idx56);
  });

  it("Main flow bước 4: tính is_locked theo entitlement thực tế của gia đình", async () => {
    const currentYear = new Date().getFullYear();
    const fixture = await createChildFixture(currentYear - 4);
    createdUserIds.push(fixture.userId);

    // 1. Khi chưa có gói, level premium bị khoá
    const beforeGrant = (await getCompetencyHandler(
      mockEvent(fixture.userId, fixture.childUuid, "C1")
    )) as ChildCompetencyResponse;
    const lockedItem = beforeGrant.games.find((g) => g.code === levelAge56Code);
    expect(lockedItem?.is_locked).toBe(true);

    // 2. Cấp entitlement play_premium_games cho gia đình
    await db.insert(entitlements).values({
      userId: fixture.userId,
      entitlementKey: "play_premium_games",
      source: "manual_grant",
      status: "active",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await invalidateUserEntitlementsCache(fixture.userId);

    const afterGrant = (await getCompetencyHandler(
      mockEvent(fixture.userId, fixture.childUuid, "C1")
    )) as ChildCompetencyResponse;
    const unlockedItem = afterGrant.games.find(
      (g) => g.code === levelAge56Code
    );
    expect(unlockedItem?.is_locked).toBe(false);
  });

  it("trả 404 khi mã năng lực không thuộc C1..C6", async () => {
    const currentYear = new Date().getFullYear();
    const fixture = await createChildFixture(currentYear - 4);
    createdUserIds.push(fixture.userId);

    await expect(
      getCompetencyHandler(mockEvent(fixture.userId, fixture.childUuid, "C9"))
    ).rejects.toSatisfy(
      (err: object) => typeof err === "object" && statusOf(err) === 404
    );
  });

  it("trả 428 NO_ACTIVE_CHILD khi chưa chọn hồ sơ trẻ", async () => {
    const currentYear = new Date().getFullYear();
    const fixture = await createChildFixture(currentYear - 4);
    createdUserIds.push(fixture.userId);

    await expect(
      getCompetencyHandler(mockEvent(fixture.userId, null, "C1"))
    ).rejects.toSatisfy(
      (err: object) => typeof err === "object" && statusOf(err) === 428
    );
  });
});

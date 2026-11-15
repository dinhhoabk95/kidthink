import crypto from "node:crypto";
import {
  childBadges,
  childProfiles,
  childStickers,
  gameLevels,
  getOwnerDb,
  users,
} from "@mindkid/db";
import { eq, getTableColumns, inArray } from "drizzle-orm";
import type { H3Event } from "h3";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import adventureGet from "#server/api/users/play/adventure.get";
import mascotGearGet from "#server/api/users/play/mascot-gear.get";
import mascotGearPut from "#server/api/users/play/mascot-gear.put";
import stickerDioramaGet from "#server/api/users/play/sticker-diorama.get";
import stickerDioramaPut from "#server/api/users/play/sticker-diorama.put";
import type { JsonRecord } from "#server/utils/request-body";

const CSRF_TOKEN = "k".repeat(64);

interface ChildFixture {
  readonly userId: number;
  readonly childId: number;
  readonly childUuid: string;
}

interface MockEventOptions {
  readonly userId: number;
  readonly childUuid?: string;
  readonly method: "GET" | "PUT";
  readonly url: string;
  readonly query?: JsonRecord;
  readonly body?: JsonRecord;
}

function createMockEvent(options: MockEventOptions): H3Event {
  const responseHeaders: Record<string, string> = {};
  const cookies = [`tm_u_csrf=${CSRF_TOKEN}`];
  if (options.childUuid) {
    cookies.push(`active_child_id=${options.childUuid}`);
  }
  const eventObj = {
    method: options.method,
    path: options.url,
    _query: options.query ?? {},
    _body: options.body ?? {},
    node: {
      req: {
        method: options.method,
        headers: {
          "x-csrf-token": CSRF_TOKEN,
          cookie: cookies.join("; "),
        },
        url: options.url,
        originalUrl: options.url,
      },
      res: {
        setHeader: (name: string, value: string): void => {
          responseHeaders[name.toLowerCase()] = value;
        },
        getHeader: (name: string): string | undefined =>
          responseHeaders[name.toLowerCase()],
        statusCode: 200,
      },
    },
    context: {
      params: {},
      user: {
        user_id: options.userId,
        display_name: "Phụ huynh KW",
        session_id: `sess_${options.userId}`,
      },
    },
  };
  return eventObj as never;
}

const createdUserIds: number[] = [];
const createdLevelIds: number[] = [];

async function createChildFixture(): Promise<ChildFixture> {
  const db = getOwnerDb();
  const hex = crypto.randomBytes(5).toString("hex");
  const [user] = await db
    .insert(users)
    .values({ email: `kw-${hex}@example.com`, displayName: "Phụ huynh KW" })
    .returning();
  if (!user) {
    throw new Error("Không tạo được user test");
  }
  createdUserIds.push(user.id);
  const [child] = await db
    .insert(childProfiles)
    .values({
      userId: user.id,
      displayName: "Bé Mầm",
      birthYear: new Date().getFullYear() - 4,
      avatarId: "preset_01",
    })
    .returning();
  if (!child) {
    throw new Error("Không tạo được child test");
  }
  return { userId: user.id, childId: child.id, childUuid: child.uuid };
}

async function seedFreePlayLevels(): Promise<void> {
  const db = getOwnerDb();
  const suffix = String(crypto.randomInt(1000, 9999));
  const inserted = await db
    .insert(gameLevels)
    .values([
      {
        code: `GL-C1-KWD-TSTA-${suffix}`,
        templateCode: "GT-003",
        title: "Đếm Táo Nông Trại",
        thumbnailEmoji: "🍎",
        contentPack: {},
        difficultyParams: {},
        accessTier: "free",
        ageMin: 3,
        ageMax: 6,
      },
      {
        code: `GL-C2-KWD-TSTB-${suffix}`,
        templateCode: "GT-021",
        title: "Ghép Bóng Bạn Thú",
        thumbnailEmoji: "🐘",
        contentPack: {},
        difficultyParams: {},
        accessTier: "free",
        ageMin: 3,
        ageMax: 6,
      },
    ])
    .returning({ id: gameLevels.id });
  for (const row of inserted) {
    createdLevelIds.push(row.id);
  }
}

describe("Kid World APIs — Adventure, Mascot Gear & Sticker Diorama", () => {
  let childA: ChildFixture;
  let childB: ChildFixture;

  beforeAll(async () => {
    childA = await createChildFixture();
    childB = await createChildFixture();
    await seedFreePlayLevels();
  });

  afterAll(async () => {
    const db = getOwnerDb();
    if (createdLevelIds.length > 0) {
      await db
        .delete(gameLevels)
        .where(inArray(gameLevels.id, createdLevelIds));
    }
    if (createdUserIds.length > 0) {
      await db.delete(users).where(inArray(users.id, createdUserIds));
    }
  });

  it("BR-MPR-01: danh sách cột của child_profiles không bị thêm trường phụ kiện", () => {
    const colNames = Object.values(getTableColumns(childProfiles)).map(
      (col) => col.name
    );
    expect(colNames).not.toContain("equipped_gear_code");
    expect(colNames).not.toContain("mascot_gear");
  });

  it("BR-MPR-03 & BR-MPR-05: mascot-gear chỉ trả phụ kiện đã mở, từ chối 422 khi đội phụ kiện chưa mở và lưu được sau khi mở huy hiệu", async () => {
    const initial = await mascotGearGet(
      createMockEvent({
        userId: childA.userId,
        childUuid: childA.childUuid,
        method: "GET",
        url: "/api/users/play/mascot-gear",
      })
    );
    expect(initial.equipped_gear_code).toBeNull();
    expect(initial.unlocked_gears.map((g) => g.code)).toEqual(["flower_pin"]);
    for (const item of initial.unlocked_gears) {
      expect("is_locked" in item).toBe(false);
    }

    await expect(
      mascotGearPut(
        createMockEvent({
          userId: childA.userId,
          childUuid: childA.childUuid,
          method: "PUT",
          url: "/api/users/play/mascot-gear",
          body: { equipped_gear_code: "star_crown" },
        })
      )
    ).rejects.toMatchObject({ statusCode: 422, code: "VALIDATION_FAILED" });

    const equipStarter = await mascotGearPut(
      createMockEvent({
        userId: childA.userId,
        childUuid: childA.childUuid,
        method: "PUT",
        url: "/api/users/play/mascot-gear",
        body: { equipped_gear_code: "flower_pin" },
      })
    );
    expect(equipStarter.equipped_gear_code).toBe("flower_pin");

    const db = getOwnerDb();
    await db.insert(childBadges).values({
      childProfileId: childA.childId,
      badgeCode: "PLAY_DAYS_5",
    });

    const afterBadge = await mascotGearGet(
      createMockEvent({
        userId: childA.userId,
        childUuid: childA.childUuid,
        method: "GET",
        url: "/api/users/play/mascot-gear",
      })
    );
    expect(afterBadge.equipped_gear_code).toBe("flower_pin");
    expect(afterBadge.unlocked_gears.map((g) => g.code)).toContain(
      "star_crown"
    );

    const equipCrown = await mascotGearPut(
      createMockEvent({
        userId: childA.userId,
        childUuid: childA.childUuid,
        method: "PUT",
        url: "/api/users/play/mascot-gear",
        body: { equipped_gear_code: "star_crown" },
      })
    );
    expect(equipCrown.equipped_gear_code).toBe("star_crown");
  });

  it("BR-SDM-01..03: bày và gỡ sticker bối cảnh không sửa/xoá child_stickers, và từ chối 422 với emoji chưa sở hữu", async () => {
    const db = getOwnerDb();
    await db.insert(childStickers).values([
      {
        childProfileId: childA.childId,
        themeCode: "farm",
        emoji: "🐮",
        label: "Bò sữa",
      },
      {
        childProfileId: childA.childId,
        themeCode: "farm",
        emoji: "🐓",
        label: "Gà trống",
      },
    ]);

    const saved = await stickerDioramaPut(
      createMockEvent({
        userId: childA.userId,
        childUuid: childA.childUuid,
        method: "PUT",
        url: "/api/users/play/sticker-diorama",
        body: {
          theme_code: "farm",
          placements: [
            { emoji: "🐮", instance_index: 0, norm_x: 0.35, norm_y: 0.65 },
          ],
        },
      })
    );
    expect(saved.placements).toHaveLength(1);
    expect(saved.placements[0]?.label).toBe("Bò sữa");

    const loaded = await stickerDioramaGet(
      createMockEvent({
        userId: childA.userId,
        childUuid: childA.childUuid,
        method: "GET",
        url: "/api/users/play/sticker-diorama",
        query: { theme: "farm" },
      })
    );
    expect(loaded.placements_by_theme.farm).toHaveLength(1);

    await expect(
      stickerDioramaPut(
        createMockEvent({
          userId: childA.userId,
          childUuid: childA.childUuid,
          method: "PUT",
          url: "/api/users/play/sticker-diorama",
          body: {
            theme_code: "farm",
            placements: [
              { emoji: "🚜", instance_index: 0, norm_x: 0.5, norm_y: 0.5 },
            ],
          },
        })
      )
    ).rejects.toMatchObject({ statusCode: 422, code: "VALIDATION_FAILED" });

    const cleared = await stickerDioramaPut(
      createMockEvent({
        userId: childA.userId,
        childUuid: childA.childUuid,
        method: "PUT",
        url: "/api/users/play/sticker-diorama",
        body: {
          theme_code: "farm",
          placements: [],
        },
      })
    );
    expect(cleared.placements).toHaveLength(0);

    const remainingStickers = await db
      .select()
      .from(childStickers)
      .where(eq(childStickers.childProfileId, childA.childId));
    expect(remainingStickers).toHaveLength(2);
  });

  it("BR-DAV-01..06: adventure trả chuỗi 1..3 chặng, không có trường streak, và từ chối 428 khi cookie trẻ của user khác", async () => {
    const adventure = await adventureGet(
      createMockEvent({
        userId: childA.userId,
        childUuid: childA.childUuid,
        method: "GET",
        url: "/api/users/play/adventure",
      })
    );
    expect(adventure.child_uuid).toBe(childA.childUuid);
    expect(adventure.steps.length).toBeGreaterThanOrEqual(1);
    expect(adventure.steps.length).toBeLessThanOrEqual(3);
    expect("streak_days" in adventure).toBe(false);
    expect("expires_at" in adventure).toBe(false);
    expect("countdown_seconds" in adventure).toBe(false);

    await expect(
      adventureGet(
        createMockEvent({
          userId: childA.userId,
          childUuid: childB.childUuid,
          method: "GET",
          url: "/api/users/play/adventure",
        })
      )
    ).rejects.toMatchObject({ statusCode: 428, code: "NO_ACTIVE_CHILD" });
  });
});

import crypto from "node:crypto";
import {
  childProfiles,
  gameLevels,
  getOwnerDb,
  playSessions,
  users,
} from "@mindkid/db";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { findCompletedIntroLevelIds } from "#server/utils/concept-intro-runtime";

/**
 * Bài làm quen đã hoàn thành ở bản cũ của level vẫn tính là đã làm khi level
 * được publish bản mới (`BR-CSA-17`: cả danh mục lên bản mới cùng lúc). Cổng
 * làm quen đối chiếu theo mã level, không theo `game_levels.id` của bản đang
 * published.
 */

const suffix = crypto.randomInt(1000, 9999);
const CODE = `GL-C1-CIV-TSTA-${suffix}`;
const OTHER_CODE = `GL-C1-CIV-TSTB-${suffix}`;
const ENTITY_ID = crypto.randomInt(100_000_000, 2_000_000_000);

let userId = 0;
let childId = 0;
let archivedId = 0;
let publishedId = 0;
let otherPublishedId = 0;

async function insertLevel(
  code: string,
  entityId: number,
  contentVersion: number,
  status: "archived" | "published"
): Promise<number> {
  const [level] = await getOwnerDb()
    .insert(gameLevels)
    .values({
      entityId,
      code,
      contentVersion,
      templateCode: "GT-000",
      title: `Level ${code}`,
      contentPack: {},
      difficultyParams: {},
      accessTier: "free",
      status,
    })
    .returning();
  if (!level) {
    throw new Error("Không tạo được level");
  }
  return level.id;
}

describe("cổng làm quen qua bản content mới", () => {
  beforeAll(async () => {
    const db = getOwnerDb();
    const [user] = await db
      .insert(users)
      .values({ email: `civ-${suffix}@example.com`, displayName: "CIV" })
      .returning();
    if (!user) {
      throw new Error("Không tạo được user");
    }
    userId = user.id;
    const [child] = await db
      .insert(childProfiles)
      .values({
        userId,
        displayName: "Bé CIV",
        birthYear: 2021,
        avatarId: "preset_01",
      })
      .returning();
    if (!child) {
      throw new Error("Không tạo được hồ sơ trẻ");
    }
    childId = child.id;
    archivedId = await insertLevel(CODE, ENTITY_ID, 1, "archived");
    publishedId = await insertLevel(CODE, ENTITY_ID, 3, "published");
    otherPublishedId = await insertLevel(
      OTHER_CODE,
      ENTITY_ID + 1,
      3,
      "published"
    );
    await db.insert(playSessions).values({
      childProfileId: childId,
      gameLevelId: archivedId,
      contentVersion: 1,
      templateCode: "GT-000",
      completionStatus: "completed",
    });
  });

  afterAll(async () => {
    const db = getOwnerDb();
    await db.delete(users).where(eq(users.id, userId));
    await db
      .delete(gameLevels)
      .where(
        inArray(gameLevels.id, [archivedId, publishedId, otherPublishedId])
      );
  });

  it("level làm quen hoàn thành ở bản v1 vẫn tính là đã làm ở bản v3", async () => {
    const done = await findCompletedIntroLevelIds(
      getOwnerDb(),
      [
        { levelId: publishedId, levelCode: CODE },
        { levelId: otherPublishedId, levelCode: OTHER_CODE },
      ],
      childId
    );

    expect([...done]).toEqual([publishedId]);
  });
});

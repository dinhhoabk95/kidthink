import crypto from "node:crypto";
import {
  childProfiles,
  gameLevels,
  getOwnerDb,
  playSessions,
  telemetryEvents,
  users,
} from "@mindkid/db";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  findCompletedIntroLevelIds,
  resolveIntroResumeSegmentIndex,
} from "#server/utils/concept-intro-runtime";

const suffix = crypto.randomInt(1000, 9999);
const CODE = `GL-C1-CIV-TSTA-${suffix}`;
const OTHER_CODE = `GL-C1-CIV-TSTB-${suffix}`;
const RESUME_CODE = `GL-C1-CIV-TSTC-${suffix}`;

let userId = 0;
let childId = 0;
let publishedId = 0;
let otherPublishedId = 0;
let resumeLevelId = 0;
const createdSessionUuids: string[] = [];

async function insertLevel(code: string): Promise<number> {
  const [level] = await getOwnerDb()
    .insert(gameLevels)
    .values({
      code,
      templateCode: "GT-000",
      title: `Level ${code}`,
      contentPack: {},
      difficultyParams: {},
      accessTier: "free",
    })
    .returning();
  if (!level) {
    throw new Error("Không tạo được level");
  }
  return level.id;
}

describe("cổng làm quen & tiếp tục phân đoạn dở (BR-CIR-18)", () => {
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
    publishedId = await insertLevel(CODE);
    otherPublishedId = await insertLevel(OTHER_CODE);
    resumeLevelId = await insertLevel(RESUME_CODE);
    await db.insert(playSessions).values({
      childProfileId: childId,
      gameLevelId: publishedId,
      templateCode: "GT-000",
      completionStatus: "completed",
    });
  });

  afterAll(async () => {
    const db = getOwnerDb();
    if (createdSessionUuids.length > 0) {
      await db
        .delete(telemetryEvents)
        .where(inArray(telemetryEvents.sessionUuid, createdSessionUuids));
    }
    await db.delete(users).where(eq(users.id, userId));
    await db
      .delete(gameLevels)
      .where(
        inArray(gameLevels.id, [publishedId, otherPublishedId, resumeLevelId])
      );
  });

  it("level làm quen hoàn thành được nhận diện đúng theo mã level", async () => {
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

  it("BR-CIR-18: chưa có tiến độ phân đoạn → trả resume_segment_index = 0", async () => {
    const resumeIdx = await resolveIntroResumeSegmentIndex(getOwnerDb(), {
      levelId: resumeLevelId,
      levelCode: RESUME_CODE,
      totalSegments: 3,
      childProfileId: childId,
    });
    expect(resumeIdx).toBe(0);
  });

  it("BR-CIR-18: phiên abandoned đã có intro_segment_completed(segment_index=0) → trả resume_segment_index = 1", async () => {
    const db = getOwnerDb();
    const sessionUuid = crypto.randomUUID();
    createdSessionUuids.push(sessionUuid);

    await db.insert(playSessions).values({
      sessionUuid,
      childProfileId: childId,
      gameLevelId: resumeLevelId,
      templateCode: "GT-000",
      completionStatus: "abandoned",
      isPreview: false,
    });

    await db.insert(telemetryEvents).values({
      sessionUuid,
      seq: 1,
      gameLevelId: resumeLevelId,
      templateCode: "GT-000",
      eventName: "intro_segment_completed",
      payload: {
        segment_id: "seg_1",
        segment_index: 0,
        miss_count: 0,
      },
    });

    const resumeIdx = await resolveIntroResumeSegmentIndex(db, {
      levelId: resumeLevelId,
      levelCode: RESUME_CODE,
      totalSegments: 3,
      childProfileId: childId,
    });
    expect(resumeIdx).toBe(1);
  });

  it("BR-CIR-18: bài đã hoàn thành (completed) → trả resume_segment_index = 0 dù trước đó có phiên abandoned", async () => {
    const db = getOwnerDb();
    await db.insert(playSessions).values({
      childProfileId: childId,
      gameLevelId: resumeLevelId,
      templateCode: "GT-000",
      completionStatus: "completed",
      isPreview: false,
    });

    const resumeIdx = await resolveIntroResumeSegmentIndex(db, {
      levelId: resumeLevelId,
      levelCode: RESUME_CODE,
      totalSegments: 3,
      childProfileId: childId,
    });
    expect(resumeIdx).toBe(0);
  });
});

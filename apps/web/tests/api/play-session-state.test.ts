import { gameLevels, getOwnerDb, playSessions } from "@mindkid/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

async function createTestLevel(db: ReturnType<typeof getOwnerDb>) {
  let code = "";
  while (true) {
    const num4 = Math.floor(Math.random() * 8999) + 1000;
    const candidate = `GL-C1-CNT-TST-${num4}`;
    const [existing] = await db
      .select({ id: gameLevels.id })
      .from(gameLevels)
      .where(eq(gameLevels.code, candidate))
      .limit(1);
    if (!existing) {
      code = candidate;
      break;
    }
  }

  const [gl] = await db
    .insert(gameLevels)
    .values({
      code,
      templateCode: "GT-001",
      title: "Level Test",
      instruction: "Instruction",
      contentPack: {},
      difficultyParams: {},
      accessTier: "free",
    })
    .returning();

  return { glId: gl.id, templateCode: "GT-001" };
}

describe("Task P1.6 — Session State Machine & Invariance (BR-PSL-02, BR-PSL-08, BR-PSL-10)", () => {
  it("BR-PSL-08: access_tier_at_start is saved when play_session is created", async () => {
    const db = getOwnerDb();
    const { glId, templateCode } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        templateCode,
        guestDeviceId: "test-device-p16",
        accessTierAtStart: "free",
        completionStatus: "in_progress",
      })
      .returning();

    expect(session.accessTierAtStart).toBe("free");
  });

  it("BR-PSL-02: gameLevelId and templateCode are pinned at creation", async () => {
    const db = getOwnerDb();
    const { glId, templateCode } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        templateCode,
        guestDeviceId: "test-device-version-pin",
        completionStatus: "in_progress",
      })
      .returning();

    expect(session.gameLevelId).toBe(glId);

    const fetched = await db
      .select()
      .from(playSessions)
      .where(eq(playSessions.id, session.id));

    expect(fetched[0]?.gameLevelId).toBe(glId);
  });

  it("BR-SPT-07 & Terminal State: completed and abandoned sessions cannot revert to in_progress in DB", async () => {
    const db = getOwnerDb();
    const { glId, templateCode } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        templateCode,
        guestDeviceId: "test-device-terminal",
        completionStatus: "completed",
      })
      .returning();

    await expect(
      db
        .update(playSessions)
        .set({ completionStatus: "in_progress" })
        .where(eq(playSessions.id, session.id))
    ).rejects.toSatisfy((err: Error & { cause?: Error }) => {
      return (err.message + (err.cause?.message ?? "")).includes("BR-SPT-07");
    });
  });
});

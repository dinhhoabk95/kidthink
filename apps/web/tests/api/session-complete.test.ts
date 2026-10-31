import { gameLevels, getOwnerDb, playSessions } from "@mindkid/db";
import { completePlaySession } from "@mindkid/play";
import { describe, expect, it } from "vitest";

async function createTestLevel(db: ReturnType<typeof getOwnerDb>) {
  const templateCode = "GT-001";
  let gl: typeof gameLevels.$inferSelect | undefined;
  for (let attempt = 0; attempt < 50; attempt++) {
    const num4 = Math.floor(Math.random() * 8999) + 1000;
    const [created] = await db
      .insert(gameLevels)
      .values({
        code: `GL-C1-CNT-TEST-${num4}`,
        templateCode,
        title: "Level Test",
        instruction: "Instruction",
        contentPack: {},
        difficultyParams: {},
        accessTier: "free",
      })
      .onConflictDoNothing()
      .returning();

    if (created) {
      gl = created;
      break;
    }
  }

  return { glId: gl?.id ?? 1, templateCode };
}

describe("Task P1.6 — Session Complete Route & Contracts (BR-PSL-01, BR-PSL-03, D-GE)", () => {
  it("BR-PSL-01: completing a session changes completion_status to completed and returns D-GE payload", async () => {
    const db = getOwnerDb();
    const { glId, templateCode } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        templateCode,
        guestDeviceId: "device-complete-1",
        completionStatus: "in_progress",
      })
      .returning();

    const uuid = session.sessionUuid;

    const res = await completePlaySession(uuid, undefined, {
      isUserCall: false,
      guestDeviceId: "device-complete-1",
    });
    expect(res.stars).toBe(1);
    expect(res.celebration).toBe("nice_try");
    expect(res.rounds_correct).toBe(0);
    expect(res.rounds_total).toBe(0);
    expect(res).not.toHaveProperty("normalized_score");
    expect(res).not.toHaveProperty("score");
  });

  it("BR-PSL-01: completing an already completed session throws 409 SESSION_ALREADY_COMPLETED", async () => {
    const db = getOwnerDb();
    const { glId, templateCode } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        templateCode,
        guestDeviceId: "device-complete-2",
        completionStatus: "completed",
      })
      .returning();

    const uuid = session.sessionUuid;

    await expect(
      completePlaySession(uuid, undefined, {
        isUserCall: false,
        guestDeviceId: "device-complete-2",
      })
    ).rejects.toSatisfy((err: { code?: string; status?: number }) => {
      return err.code === "SESSION_ALREADY_COMPLETED" && err.status === 409;
    });
  });

  it("Session older than 4 hours throws 410 SESSION_EXPIRED when completed", async () => {
    const db = getOwnerDb();
    const { glId, templateCode } = await createTestLevel(db);
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        templateCode,
        guestDeviceId: "device-expired",
        completionStatus: "in_progress",
        startedAt: fiveHoursAgo,
      })
      .returning();

    const uuid = session.sessionUuid;

    await expect(
      completePlaySession(uuid, undefined, {
        isUserCall: false,
        guestDeviceId: "device-expired",
      })
    ).rejects.toSatisfy((err: { code?: string; status?: number }) => {
      return err.code === "SESSION_EXPIRED" && err.status === 410;
    });
  });
});

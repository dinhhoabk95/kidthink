import {
  completePlaySession,
  gameLevels,
  gameTemplates,
  getOwnerDb,
  playSessions,
} from "@mindkid/db";
import { describe, expect, it } from "vitest";

async function createTestLevel(db: ReturnType<typeof getOwnerDb>) {
  const num3 = Math.floor(Math.random() * 899) + 100;
  const [gt] = await db
    .insert(gameTemplates)
    .values({
      code: `GT-${num3}`,
      name: "Template test",
      mechanic: "tap_target",
      scoring: {},
    })
    .onConflictDoNothing()
    .returning();

  let templateId = gt?.id;
  if (!templateId) {
    const existing = await db.select().from(gameTemplates).limit(1);
    templateId = existing[0]?.id ?? 1;
  }

  let gl: any;
  for (let attempt = 0; attempt < 50; attempt++) {
    const num4 = Math.floor(Math.random() * 8999) + 1000;
    const uid = Math.floor(Math.random() * 899_999) + 100_000;
    const [created] = await db
      .insert(gameLevels)
      .values({
        entityId: uid,
        code: `GL-C1-CNT-TEST-${num4}`,
        templateId,
        title: "Level Test",
        instruction: "Instruction",
        contentPack: {},
        difficultyParams: {},
        accessTier: "free",
        status: "published",
        contentVersion: 1,
      })
      .onConflictDoNothing()
      .returning();

    if (created) {
      gl = created;
      break;
    }
  }

  return { glId: gl.id, gtId: templateId };
}

describe("Task P1.6 — Session Complete Route & Contracts (BR-PSL-01, BR-PSL-03, D-GE)", () => {
  it("BR-PSL-01: completing a session changes completion_status to completed and returns D-GE payload", async () => {
    const db = getOwnerDb();
    const { glId, gtId } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        contentVersion: 1,
        templateId: gtId,
        guestDeviceId: "device-complete-1",
        completionStatus: "in_progress",
      })
      .returning();

    const uuid = session.sessionUuid;

    const res = await completePlaySession(uuid, undefined, {
      isUserCall: false,
      guestDeviceId: "device-complete-1",
    });
    expect(res.stars).toBeNull();
    expect(res.rounds_correct).toBe(0);
    expect(res.rounds_total).toBe(0);
  });

  it("BR-PSL-01: completing an already completed session throws 409 SESSION_ALREADY_COMPLETED", async () => {
    const db = getOwnerDb();
    const { glId, gtId } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        contentVersion: 1,
        templateId: gtId,
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
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as { code?: string; status?: number };
      return e.code === "SESSION_ALREADY_COMPLETED" && e.status === 409;
    });
  });

  it("Session older than 4 hours throws 410 SESSION_EXPIRED when completed", async () => {
    const db = getOwnerDb();
    const { glId, gtId } = await createTestLevel(db);
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        contentVersion: 1,
        templateId: gtId,
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
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as { code?: string; status?: number };
      return e.code === "SESSION_EXPIRED" && e.status === 410;
    });
  });
});

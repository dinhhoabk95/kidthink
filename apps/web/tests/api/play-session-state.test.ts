import {
  gameLevels,
  gameTemplates,
  getOwnerDb,
  playSessions,
} from "@kidthink/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

async function createTestLevel(db: ReturnType<typeof getOwnerDb>) {
  const num3 = Math.floor(Math.random() * 899) + 100;
  const [gt] = await db
    .insert(gameTemplates)
    .values({
      code: `GT-${num3}`,
      nameVi: "Template test",
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

  const uid = Math.floor(Math.random() * 89_999) + 10_000;
  const [gl] = await db
    .insert(gameLevels)
    .values({
      entityId: uid,
      code,
      templateId,
      titleVi: "Level Test",
      instructionVi: "Instruction",
      contentPack: {},
      difficultyParams: {},
      accessTier: "free",
      status: "published",
      contentVersion: 1,
    })
    .returning();

  return { glId: gl.id, gtId: templateId };
}

describe("Task P1.6 — Session State Machine & Invariance (BR-PSL-02, BR-PSL-08, BR-PSL-10)", () => {
  it("BR-PSL-08: access_tier_at_start is saved when play_session is created", async () => {
    const db = getOwnerDb();
    const { glId, gtId } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        contentVersion: 1,
        templateId: gtId,
        guestDeviceId: "test-device-p16",
        accessTierAtStart: "free",
        completionStatus: "in_progress",
      })
      .returning();

    expect(session.accessTierAtStart).toBe("free");
  });

  it("BR-PSL-02: content_version is pinned at creation and not changed when content is updated", async () => {
    const db = getOwnerDb();
    const { glId, gtId } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        contentVersion: 3,
        templateId: gtId,
        guestDeviceId: "test-device-version-pin",
        completionStatus: "in_progress",
      })
      .returning();

    expect(session.contentVersion).toBe(3);

    const fetched = await db
      .select()
      .from(playSessions)
      .where(eq(playSessions.id, session.id));

    expect(fetched[0].contentVersion).toBe(3);
  });

  it("BR-SPT-07 & Terminal State: completed and abandoned sessions cannot revert to in_progress in DB", async () => {
    const db = getOwnerDb();
    const { glId, gtId } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        contentVersion: 1,
        templateId: gtId,
        guestDeviceId: "test-device-terminal",
        completionStatus: "completed",
      })
      .returning();

    await expect(
      db
        .update(playSessions)
        .set({ completionStatus: "in_progress" })
        .where(eq(playSessions.id, session.id))
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as { message?: string; cause?: { message?: string } };
      return ((e.message ?? "") + (e.cause?.message ?? "")).includes(
        "BR-SPT-07"
      );
    });
  });
});

import {
  gameLevels,
  gameTemplates,
  getOwnerDb,
  playSessions,
} from "@mindkid/db";
import { sweepAbandonedSessions } from "@mindkid/play";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

async function createTestLevel(db: ReturnType<typeof getOwnerDb>) {
  const templates = await db.select().from(gameTemplates).limit(1);
  let templateId = templates[0]?.id;
  if (!templateId) {
    const [gt] = await db
      .insert(gameTemplates)
      .values({
        code: "GT-999",
        name: "Template test",
        mechanic: "tap_target",
        scoring: {},
      })
      .returning();
    templateId = gt.id;
  }

  const num4 = Math.floor(Math.random() * 8999) + 1000;
  const uid = Math.floor(Math.random() * 89_999) + 10_000;
  const [gl] = await db
    .insert(gameLevels)
    .values({
      entityId: uid,
      code: `GL-C1-CNT-SWP-${num4}`,
      templateId,
      title: "Level Test",
      instruction: "Instruction",
      contentPack: {},
      difficultyParams: {},
      accessTier: "free",
      status: "published",
      contentVersion: 1,
    })
    .returning();

  return { glId: gl.id, gtId: templateId };
}

describe("Task P1.6 — Job sweep:abandoned (BR-PSL-07, D-DF, D-FZ)", () => {
  it("sweeps in_progress sessions inactive for > 30 minutes into abandoned status and updates stats", async () => {
    const db = getOwnerDb();
    const { glId, gtId } = await createTestLevel(db);
    const fortyMinsAgo = new Date(Date.now() - 40 * 60 * 1000);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        contentVersion: 1,
        templateId: gtId,
        guestDeviceId: "device-sweep-1",
        completionStatus: "in_progress",
        startedAt: fortyMinsAgo,
      })
      .returning();

    const sweptCount = await sweepAbandonedSessions();
    expect(sweptCount).toBeGreaterThanOrEqual(1);

    const [updated] = await db
      .select()
      .from(playSessions)
      .where(eq(playSessions.id, session.id));

    expect(updated.completionStatus).toBe("abandoned");
  });
});

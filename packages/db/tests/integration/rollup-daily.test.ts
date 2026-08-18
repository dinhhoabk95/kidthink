import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "../../src/index.ts";
import { childProfiles } from "../../src/schema/child.ts";
import { gameLevels, gameTemplates } from "../../src/schema/game.ts";
import { users } from "../../src/schema/identity.ts";
import {
  childDailyStats,
  levelDailyStats,
  playSessions,
} from "../../src/schema/play.ts";
import {
  runDailyRollup,
  runExpireEntitlements,
} from "../../src/services/rollup.ts";

describe("Task 5 — Daily Rollup & Entitlement Expire (BR-TLM-02, BR-TLM-05, BR-TLM-08)", () => {
  it("runs daily rollup idempotently and excludes guest sessions from child stats (BR-TLM-02, BR-TLM-05)", async () => {
    const db = getOwnerDb();
    const dateIct = "2099-07-07";
    const testStartedAt = new Date("2099-07-07T10:00:00.000+07:00");

    // 1. Create Parent User & Child Profile
    const email = `rollup-parent-${Date.now()}@example.com`;
    const [u] = await db
      .insert(users)
      .values({ email, displayName: "Rollup Parent" })
      .returning();

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: u.id,
        displayName: "Bé Nam",
        birthYear: 2020,
        avatarId: "preset_01",
      })
      .returning();

    // 2. Create Game Template & Level
    let [gt] = await db.select().from(gameTemplates).limit(1);
    if (!gt) {
      [gt] = await db
        .insert(gameTemplates)
        .values({
          code: "GT-001",
          name: "Template Rollup Test",
          mechanic: "tap_target",
        })
        .returning();
    }

    const num4 = Math.floor(Math.random() * 8999) + 1000;
    const glCode = `GL-C1-CNT-RLLP-${num4}`;
    const [gl] = await db
      .insert(gameLevels)
      .values({
        entityId: Math.floor(Math.random() * 900_000) + 100_000,
        code: glCode,
        contentVersion: 1,
        templateId: gt.id,
        title: "Level Rollup Test",
        contentPack: { test: true },
        difficultyParams: { speed: 1 },
        accessTier: "free",
        status: "published",
      })
      .returning();

    // 3. Create Registered Child Session
    await db.insert(playSessions).values({
      childProfileId: child.id,
      gameLevelId: gl.id,
      contentVersion: 1,
      templateId: gt.id,
      completionStatus: "completed",
      durationSeconds: 120,
      score: 100,
      starsEarned: 3,
      startedAt: testStartedAt,
    });

    // 4. Create Guest Session (childProfileId is NULL) per BR-TLM-05
    await db.insert(playSessions).values({
      childProfileId: null,
      guestDeviceId: `guest-dev-${Date.now()}`,
      gameLevelId: gl.id,
      contentVersion: 1,
      templateId: gt.id,
      completionStatus: "completed",
      durationSeconds: 90,
      score: 80,
      starsEarned: 2,
      startedAt: testStartedAt,
    });

    // 5. Run daily rollup 1st time
    const result1 = await runDailyRollup(dateIct);
    expect(result1.childStatsCount).toBeGreaterThanOrEqual(1);
    expect(result1.levelStatsCount).toBeGreaterThanOrEqual(1);

    const childStats1 = await db
      .select()
      .from(childDailyStats)
      .where(eq(childDailyStats.childProfileId, child.id));
    expect(childStats1).toHaveLength(1);
    expect(childStats1[0].sessionsCount).toBe(1);
    expect(childStats1[0].totalPlayTimeSeconds).toBe(120);

    const levelStats1 = await db
      .select()
      .from(levelDailyStats)
      .where(eq(levelDailyStats.levelCode, glCode));
    expect(levelStats1).toHaveLength(1);
    expect(levelStats1[0].playsCount).toBe(2); // Both child + guest included in level stats
    expect(levelStats1[0].completionsCount).toBe(2);

    // 6. Run daily rollup 2nd & 3rd time (BR-TLM-02 Idempotency Check)
    await runDailyRollup(dateIct);
    await runDailyRollup(dateIct);

    const childStats3 = await db
      .select()
      .from(childDailyStats)
      .where(eq(childDailyStats.childProfileId, child.id));
    expect(childStats3).toHaveLength(1);
    expect(childStats3[0].sessionsCount).toBe(1);
    expect(childStats3[0].totalPlayTimeSeconds).toBe(120);

    const levelStats3 = await db
      .select()
      .from(levelDailyStats)
      .where(eq(levelDailyStats.levelCode, glCode));
    expect(levelStats3).toHaveLength(1);
    expect(levelStats3[0].playsCount).toBe(2);
  }, 30_000);

  it("runs entitlement expiration job safely", async () => {
    const res = await runExpireEntitlements();
    expect(res.expiredCount).toBeGreaterThanOrEqual(0);
  });
});

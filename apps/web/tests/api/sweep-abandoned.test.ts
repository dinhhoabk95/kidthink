import { randomUUID } from "node:crypto";
import {
  childDailyStats,
  childProfiles,
  gameLevels,
  getOwnerDb,
  playSessions,
  telemetryEvents,
  users,
} from "@mindkid/db";
import { sweepAbandonedSessions } from "@mindkid/play";
import { getDateIct } from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

async function createTestLevel(db: ReturnType<typeof getOwnerDb>) {
  const num4 = Math.floor(Math.random() * 8999) + 1000;
  const uid = Math.floor(Math.random() * 89_999) + 10_000;
  const [gl] = await db
    .insert(gameLevels)
    .values({
      entityId: uid,
      code: `GL-C1-CNT-SWP-${num4}`,
      templateCode: "GT-001",
      title: "Level Test",
      instruction: "Instruction",
      contentPack: {},
      difficultyParams: {},
      accessTier: "free",
      status: "published",
      contentVersion: 1,
    })
    .returning();

  return { glId: gl.id, templateCode: "GT-001" };
}

describe("Task P1.6 & #293 S3 — Job sweep:abandoned (BR-PSL-07, BR-HPL-02)", () => {
  it("sweeps in_progress sessions inactive for > 30 minutes into abandoned status", async () => {
    const db = getOwnerDb();
    const { glId, templateCode } = await createTestLevel(db);
    const fortyMinsAgo = new Date(Date.now() - 40 * 60 * 1000);

    const [session] = await db
      .insert(playSessions)
      .values({
        sessionUuid: randomUUID(),
        gameLevelId: glId,
        contentVersion: 1,
        templateCode,
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

    expect(updated?.completionStatus).toBe("abandoned");
  });

  it("Task #293 S3: abandoned session without telemetry events records 0s (not 1800s), and session with last event at 45s records 45s", async () => {
    const db = getOwnerDb();
    const { glId, templateCode } = await createTestLevel(db);
    const now = new Date();
    const dateIct = getDateIct(now);
    const fortyMinsAgo = new Date(now.getTime() - 40 * 60 * 1000);

    const [u] = await db
      .insert(users)
      .values({
        email: `sweep_parent_${Date.now()}_${Math.random()}@tinimath.test`,
        displayName: "Sweep Parent",
      })
      .returning();

    const [childZero] = await db
      .insert(childProfiles)
      .values({
        userId: u.id,
        displayName: "Bé Không Event",
        birthYear: 2020,
        avatarId: "bunny_1",
      })
      .returning();

    const [childWithEvents] = await db
      .insert(childProfiles)
      .values({
        userId: u.id,
        displayName: "Bé Có Event",
        birthYear: 2021,
        avatarId: "bear_1",
      })
      .returning();

    // 1. Phiên bỏ dở không có event nào
    const sessionZeroUuid = randomUUID();
    const [sessionZero] = await db
      .insert(playSessions)
      .values({
        sessionUuid: sessionZeroUuid,
        childProfileId: childZero.id,
        gameLevelId: glId,
        contentVersion: 1,
        templateCode,
        completionStatus: "in_progress",
        startedAt: fortyMinsAgo,
      })
      .returning();

    // 2. Phiên bỏ dở có event cuối ở t = 45_000ms (45 giây)
    const sessionEventsUuid = randomUUID();
    const [sessionWithEvents] = await db
      .insert(playSessions)
      .values({
        sessionUuid: sessionEventsUuid,
        childProfileId: childWithEvents.id,
        gameLevelId: glId,
        contentVersion: 1,
        templateCode,
        completionStatus: "in_progress",
        startedAt: fortyMinsAgo,
      })
      .returning();

    await db.insert(telemetryEvents).values([
      {
        sessionUuid: sessionEventsUuid,
        seq: 1,
        contentVersion: 1,
        eventName: "game_started",
        occurredAtMs: 0,
      },
      {
        sessionUuid: sessionEventsUuid,
        seq: 2,
        contentVersion: 1,
        eventName: "round_started",
        occurredAtMs: 45_000,
      },
    ]);

    await sweepAbandonedSessions(now);

    const [updatedZero] = await db
      .select()
      .from(playSessions)
      .where(eq(playSessions.id, sessionZero.id));
    expect(updatedZero?.completionStatus).toBe("abandoned");
    expect(updatedZero?.durationSeconds).toBe(0);

    const [statsZero] = await db
      .select()
      .from(childDailyStats)
      .where(
        and(
          eq(childDailyStats.childProfileId, childZero.id),
          eq(childDailyStats.dateIct, dateIct)
        )
      );
    expect(statsZero?.totalPlayTimeSeconds).toBe(0);

    const [updatedEvents] = await db
      .select()
      .from(playSessions)
      .where(eq(playSessions.id, sessionWithEvents.id));
    expect(updatedEvents?.completionStatus).toBe("abandoned");
    expect(updatedEvents?.durationSeconds).toBe(45);

    const [statsEvents] = await db
      .select()
      .from(childDailyStats)
      .where(
        and(
          eq(childDailyStats.childProfileId, childWithEvents.id),
          eq(childDailyStats.dateIct, dateIct)
        )
      );
    expect(statsEvents?.totalPlayTimeSeconds).toBe(45);
  });
});

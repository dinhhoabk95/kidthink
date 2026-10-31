import {
  childDailyStats,
  childProfiles,
  childSessionSummaries,
  gameLevels,
  getOwnerDb,
  playSessions,
  telemetryEvents,
  users,
} from "@mindkid/db";
import { computeRemainingPlaySeconds, getDateIct } from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { runSessionRollup } from "./rollup-session.js";

describe("Task 5 & #293 S2 — rollup:session Integration Suite (BR-TLM-04, BR-JOB-01, BR-HPL-02, BR-HPL-07)", () => {
  it("computes official score from events, updates play_sessions and child_session_summaries idempotently", async () => {
    const db = getOwnerDb();

    // 1. Create parent & child profile
    const [u] = await db
      .insert(users)
      .values({
        email: `parent-rollup-${Date.now()}@example.com`,
        displayName: "Parent Rollup",
      })
      .returning();

    expect(u).toBeDefined();
    if (!u) {
      return;
    }

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: u.id,
        displayName: "Bé Minh",
        birthYear: 2021,
        avatarId: "preset_02",
      })
      .returning();

    expect(child).toBeDefined();
    if (!child) {
      return;
    }

    // 2. Game template code & level
    const gtCode = "GT-001";

    const randNum = String(Math.floor(Math.random() * 8999 + 1000));
    const glCode = `GL-C1-NUM-DRAG-${randNum}`;
    let [gl] = await db
      .insert(gameLevels)
      .values({
        code: glCode,
        templateCode: gtCode,
        title: "Level Rollup Test",
        contentPack: { test: true },
        difficultyParams: { speed: 1 },
        accessTier: "free",
      })
      .onConflictDoNothing()
      .returning();

    if (!gl) {
      [gl] = await db
        .select()
        .from(gameLevels)
        .where(eq(gameLevels.code, glCode));
    }

    expect(gl).toBeDefined();
    if (!gl) {
      return;
    }

    // 3. Create play session in_progress
    const sessionUuid = `e0eebc99-9c0b-4ef8-bb6d-${Math.floor(Math.random() * 899_900_000_000 + 100_000_000_000)}`;
    await db
      .insert(playSessions)
      .values({
        sessionUuid,
        childProfileId: child.id,
        gameLevelId: gl.id,
        templateCode: gtCode,
        completionStatus: "in_progress",
      })
      .returning();

    // 4. Insert telemetry events with fake client score 9999 in payload
    await db.insert(telemetryEvents).values([
      {
        sessionUuid,
        seq: 1,
        eventName: "game_started",
        occurredAtMs: 0,
      },
      {
        sessionUuid,
        seq: 2,
        eventName: "round_started",
        occurredAtMs: 100,
      },
      {
        sessionUuid,
        seq: 3,
        eventName: "hint_requested",
        occurredAtMs: 200,
      },
      {
        sessionUuid,
        seq: 4,
        eventName: "answer_selected",
        occurredAtMs: 300,
        payload: { fakeClientScore: 9999 },
      },
      {
        sessionUuid,
        seq: 5,
        eventName: "answer_correct",
        occurredAtMs: 400,
        payload: { score: 9999 },
      },
      {
        sessionUuid,
        seq: 6,
        eventName: "round_completed",
        occurredAtMs: 500,
      },
      {
        sessionUuid,
        seq: 7,
        eventName: "game_completed",
        occurredAtMs: 1000,
        payload: { score: 9999 },
      },
    ]);

    // 5. Run rollup:session job first time
    await runSessionRollup(sessionUuid);

    // Verify play_sessions updated
    const [updatedPs1] = await db
      .select()
      .from(playSessions)
      .where(eq(playSessions.sessionUuid, sessionUuid));

    // BR-TLM-04: Official score is 1 (raw_score = 1 round correct), NOT 9999 from client!
    expect(updatedPs1?.score).toBe(1);
    expect(updatedPs1?.starsEarned).toBe(3); // normalized_score = 1.0 -> 3 stars
    expect(updatedPs1?.durationSeconds).toBe(1);

    // Verify child_session_summaries created
    const summaries1 = await db
      .select()
      .from(childSessionSummaries)
      .where(eq(childSessionSummaries.childProfileId, child.id));

    expect(summaries1.length).toBeGreaterThanOrEqual(1);
    expect(summaries1[0]).toBeDefined();
    expect(summaries1[0]?.completionStatus).toBe("completed");

    // 6. Run rollup:session job second time -> IDEMPOTENT (BR-JOB-01)
    await runSessionRollup(sessionUuid);

    const [updatedPs2] = await db
      .select()
      .from(playSessions)
      .where(eq(playSessions.sessionUuid, sessionUuid));

    expect(updatedPs2?.score).toBe(updatedPs1?.score);
    expect(updatedPs2?.starsEarned).toBe(updatedPs1?.starsEarned);
  });

  it("Task #293 S2 (BR-HPL-02 & BR-HPL-07): preserves extra_time_granted_minutes on rollup and subtracts paused_ms (10m play - 4m paused = 6m)", async () => {
    const db = getOwnerDb();
    const dateIct = getDateIct();

    const [u] = await db
      .insert(users)
      .values({
        email: `parent-pause-${Date.now()}@example.com`,
        displayName: "Parent Pause",
      })
      .returning();
    expect(u).toBeDefined();
    if (!u) {
      return;
    }

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: u.id,
        displayName: "Bé An",
        birthYear: 2020,
        avatarId: "preset_01",
        dailyPlayCapMinutes: 30,
      })
      .returning();
    expect(child).toBeDefined();
    if (!child) {
      return;
    }

    // Phụ huynh đã cấp thêm 15 phút trước đó
    await db.insert(childDailyStats).values({
      childProfileId: child.id,
      dateIct,
      totalPlayTimeSeconds: 0,
      extraTimeGrantedMinutes: 15,
    });

    const randNum = String(Math.floor(Math.random() * 8999 + 1000));
    const [gl] = await db
      .insert(gameLevels)
      .values({
        code: `GL-C1-NUM-PAUS-${randNum}`,
        templateCode: "GT-001",
        title: "Level Pause Test",
        contentPack: { test: true },
        difficultyParams: {},
        accessTier: "free",
      })
      .returning();
    expect(gl).toBeDefined();
    if (!gl) {
      return;
    }

    const sessionUuid = `f1eebc99-9c0b-4ef8-bb6d-${Math.floor(Math.random() * 899_900_000_000 + 100_000_000_000)}`;
    await db.insert(playSessions).values({
      sessionUuid,
      childProfileId: child.id,
      gameLevelId: gl.id,
      templateCode: "GT-001",
      completionStatus: "in_progress",
      startedAt: new Date(),
    });

    // Phiên tổng 10 phút (600_000ms) nhưng tạm dừng 4 phút (240_000ms)
    await db.insert(telemetryEvents).values([
      {
        sessionUuid,
        seq: 1,
        eventName: "game_started",
        occurredAtMs: 0,
      },
      {
        sessionUuid,
        seq: 2,
        eventName: "game_paused",
        occurredAtMs: 120_000,
        payload: { reason: "tab_hidden" },
      },
      {
        sessionUuid,
        seq: 3,
        eventName: "game_resumed",
        occurredAtMs: 360_000,
        payload: { paused_ms: 240_000 },
      },
      {
        sessionUuid,
        seq: 4,
        eventName: "game_completed",
        occurredAtMs: 600_000,
        payload: { duration_ms: 600_000, rounds_total: 1, rounds_correct: 1 },
      },
    ]);

    await runSessionRollup(sessionUuid);

    const [updatedSession] = await db
      .select()
      .from(playSessions)
      .where(eq(playSessions.sessionUuid, sessionUuid));
    // 10 phút (600s) - 4 phút tạm dừng (240s) = 360s (6 phút)
    expect(updatedSession?.durationSeconds).toBe(360);

    const [stats] = await db
      .select()
      .from(childDailyStats)
      .where(
        and(
          eq(childDailyStats.childProfileId, child.id),
          eq(childDailyStats.dateIct, dateIct)
        )
      );

    expect(stats?.totalPlayTimeSeconds).toBe(360);
    // extraTimeGrantedMinutes không bị mất sau rollup!
    expect(stats?.extraTimeGrantedMinutes).toBe(15);

    const remainingMinutes = Math.floor(
      computeRemainingPlaySeconds(stats ?? null, child.dailyPlayCapMinutes) / 60
    );
    // (30 + 15) - 6 = 39 phút còn lại
    expect(remainingMinutes).toBe(39);
  });
});

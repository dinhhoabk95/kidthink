import {
  childProfiles,
  childSessionSummaries,
  gameLevels,
  gameTemplates,
  getOwnerDb,
  playSessions,
  telemetryEvents,
  users,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { runSessionRollup } from "./session.js";

describe("Task 5 — rollup:session Integration Suite (BR-TLM-04 & BR-JOB-01)", () => {
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

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: u.id,
        displayName: "Bé Minh",
        birthYear: 2021,
        avatarId: "preset_02",
      })
      .returning();

    // 2. Create game template & level
    const gtCode = `GT-${Math.floor(Math.random() * 899 + 100)}`;
    const [gt] = await db
      .insert(gameTemplates)
      .values({
        code: gtCode,
        name: "Template Rollup",
        mechanic: "tap",
      })
      .onConflictDoNothing()
      .returning();

    const glCode = `GL-C1-NUM-DRAG-${Math.floor(Math.random() * 8999 + 1000)}`;
    const [gl] = await db
      .insert(gameLevels)
      .values({
        entityId: Math.floor(Math.random() * 899_000 + 100_000),
        code: glCode,
        contentVersion: 1,
        templateId: gt ? gt.id : 1,
        title: "Level Rollup Test",
        contentPack: { test: true },
        difficultyParams: { speed: 1 },
        accessTier: "free",
        status: "draft",
      })
      .returning();

    // 3. Create play session in_progress
    const sessionUuid = `e0eebc99-9c0b-4ef8-bb6d-${Math.floor(Math.random() * 899_900_000_000 + 100_000_000_000)}`;
    await db
      .insert(playSessions)
      .values({
        sessionUuid,
        childProfileId: child.id,
        gameLevelId: gl.id,
        contentVersion: 1,
        templateId: gt ? gt.id : 1,
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
    expect(updatedPs1.score).toBe(1);
    expect(updatedPs1.starsEarned).toBe(3); // normalized_score = 1.0 -> 3 stars
    expect(updatedPs1.durationSeconds).toBe(1);

    // Verify child_session_summaries created
    const summaries1 = await db
      .select()
      .from(childSessionSummaries)
      .where(eq(childSessionSummaries.childProfileId, child.id));

    expect(summaries1.length).toBeGreaterThanOrEqual(1);
    expect(summaries1[0]).toBeDefined();
    expect(summaries1[0].completionStatus).toBe("completed");

    // 6. Run rollup:session job second time -> IDEMPOTENT (BR-JOB-01)
    await runSessionRollup(sessionUuid);

    const [updatedPs2] = await db
      .select()
      .from(playSessions)
      .where(eq(playSessions.sessionUuid, sessionUuid));

    expect(updatedPs2.score).toBe(updatedPs1.score);
    expect(updatedPs2.starsEarned).toBe(updatedPs1.starsEarned);
  });
});

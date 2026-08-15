import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "../../src/index.ts";
import { masteryState } from "../../src/schema/adaptive.ts";
import { childProfiles } from "../../src/schema/child.ts";
import { gameLevels, gameTemplates } from "../../src/schema/game.ts";
import { users } from "../../src/schema/identity.ts";
import { playSessions, telemetryEvents } from "../../src/schema/play.ts";
import { contentSkillMap } from "../../src/schema/tagging.ts";
import { competencies, skills, strands } from "../../src/schema/taxonomy.ts";
import { completePlaySession } from "../../src/services/play-session.ts";

describe("P3.5 Adaptive & Mastery Integration Tests (PostgreSQL)", () => {
  async function createTestFixtures() {
    const db = getOwnerDb();
    const ts = Date.now();

    // 1. Create user and child
    const [u] = await db
      .insert(users)
      .values({
        email: `user-adp-${ts}@example.com`,
        displayName: "Parent ADP",
      })
      .returning();

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: u.id,
        displayName: "Bé ADP",
        birthYear: 2021,
        avatarId: "preset_01",
      })
      .returning();

    // 2. Create taxonomy: competency, strand, skill
    let [comp] = await db
      .select()
      .from(competencies)
      .where(eq(competencies.code, "C1"))
      .limit(1);

    if (!comp) {
      [comp] = await db
        .insert(competencies)
        .values({
          code: "C1",
          nameVi: "Số & Đếm",
          colorToken: "brand-blue",
          icon: "icon-c1",
          position: 1,
        })
        .returning();
    }

    let [strand] = await db
      .select()
      .from(strands)
      .where(eq(strands.code, "C1.CNT"))
      .limit(1);

    if (!strand) {
      [strand] = await db
        .insert(strands)
        .values({
          competencyId: comp.id,
          code: "C1.CNT",
          nameVi: "Đếm số lượng",
          position: 1,
        })
        .returning();
    }

    const skillRand = Math.floor(Math.random() * 89 + 10);
    const skillCode = `C1.CNT.${String(skillRand).padStart(2, "0")}`;
    let [skill] = await db
      .select()
      .from(skills)
      .where(eq(skills.code, skillCode))
      .limit(1);

    if (!skill) {
      [skill] = await db
        .insert(skills)
        .values({
          strandId: strand.id,
          code: skillCode,
          nameVi: "Đếm trong phạm vi 5",
          difficulty: 1,
          ageMin: 3,
          ageMax: 4,
          position: 1,
        })
        .returning();
    }

    // 3. Create game template and level
    const templateCode = `GT-${String((ts % 900) + 100).padStart(3, "0")}`;
    let [template] = await db
      .select()
      .from(gameTemplates)
      .where(eq(gameTemplates.code, templateCode))
      .limit(1);

    if (!template) {
      [template] = await db
        .insert(gameTemplates)
        .values({
          code: templateCode,
          nameVi: "Tap To Count",
          mechanic: "tap_select",
          status: "active",
        })
        .returning();
    }

    const levelCode = `GL-C1-CNT-TAP-${String((ts % 9000) + 1000).padStart(4, "0")}`;
    const [level] = await db
      .insert(gameLevels)
      .values({
        entityId: ts % 100_000,
        code: levelCode,
        templateId: template.id,
        titleVi: "Level Test 1",
        contentPack: {},
        difficultyParams: {},
        accessTier: "free",
        status: "published",
      })
      .returning();

    // 4. Map level to skill
    await db.insert(contentSkillMap).values({
      entityType: "game_level",
      entityId: level.id,
      skillId: skill.id,
      weight: "1.0000",
    });

    return { u, child, comp, strand, skill, level, template };
  }

  it("Scenario: BR-ADP-03 & D-MH — completePlaySession writes mastery_state synchronously with calculated p_learn and attempts_total", async () => {
    const db = getOwnerDb();
    const { u, child, skill, level, template } = await createTestFixtures();

    const sessionUuid = crypto.randomUUID();

    // Create in-progress session
    await db.insert(playSessions).values({
      sessionUuid,
      childProfileId: child.id,
      gameLevelId: level.id,
      contentVersion: 1,
      templateId: template.id,
      completionStatus: "in_progress",
    });

    // Ingest telemetry events (2 correct rounds out of 2)
    await db.insert(telemetryEvents).values([
      { sessionUuid, seq: 1, eventName: "game_started", occurredAtMs: 0 },
      { sessionUuid, seq: 2, eventName: "round_started", occurredAtMs: 100 },
      {
        sessionUuid,
        seq: 3,
        eventName: "answer_correct",
        occurredAtMs: 200,
      },
      { sessionUuid, seq: 4, eventName: "round_completed", occurredAtMs: 300 },
      { sessionUuid, seq: 5, eventName: "round_started", occurredAtMs: 400 },
      {
        sessionUuid,
        seq: 6,
        eventName: "answer_correct",
        occurredAtMs: 500,
      },
      { sessionUuid, seq: 7, eventName: "round_completed", occurredAtMs: 600 },
      { sessionUuid, seq: 8, eventName: "game_completed", occurredAtMs: 700 },
    ]);

    // Complete session
    const res = await completePlaySession(sessionUuid, undefined, {
      isUserCall: true,
      callerAccountId: u.id,
    });
    expect(res.rounds_correct).toBe(2);
    expect(res.rounds_total).toBe(2);

    // Verify synchronous mastery state
    const [row] = await db
      .select()
      .from(masteryState)
      .where(
        and(
          eq(masteryState.childProfileId, child.id),
          eq(masteryState.skillId, skill.id)
        )
      );

    expect(row).toBeDefined();
    expect(Number(row.pLearn)).toBeGreaterThan(0.1);
    expect(Number(row.bestPLearn)).toBe(Number(row.pLearn));
    expect(row.attemptsTotal).toBe(1);
    expect(row.paramsVersion).toBe("v1");
  });

  it("Scenario: BR-PRG-03 — best_p_learn is strictly monotonic when subsequent sessions yield lower performance", async () => {
    const db = getOwnerDb();
    const { u, child, skill, level, template } = await createTestFixtures();

    const session1Uuid = crypto.randomUUID();

    // Session 1: 100% correct
    await db.insert(playSessions).values({
      sessionUuid: session1Uuid,
      childProfileId: child.id,
      gameLevelId: level.id,
      contentVersion: 1,
      templateId: template.id,
      completionStatus: "in_progress",
    });

    await db.insert(telemetryEvents).values([
      {
        sessionUuid: session1Uuid,
        seq: 1,
        eventName: "game_started",
        occurredAtMs: 0,
      },
      {
        sessionUuid: session1Uuid,
        seq: 2,
        eventName: "round_started",
        occurredAtMs: 100,
      },
      {
        sessionUuid: session1Uuid,
        seq: 3,
        eventName: "answer_correct",
        occurredAtMs: 200,
      },
      {
        sessionUuid: session1Uuid,
        seq: 4,
        eventName: "round_completed",
        occurredAtMs: 300,
      },
      {
        sessionUuid: session1Uuid,
        seq: 5,
        eventName: "game_completed",
        occurredAtMs: 400,
      },
    ]);

    await completePlaySession(session1Uuid, undefined, {
      isUserCall: true,
      callerAccountId: u.id,
    });

    const [state1] = await db
      .select()
      .from(masteryState)
      .where(
        and(
          eq(masteryState.childProfileId, child.id),
          eq(masteryState.skillId, skill.id)
        )
      );

    const highPLearn = Number(state1.pLearn);
    expect(Number(state1.bestPLearn)).toBe(highPLearn);
    expect(state1.attemptsTotal).toBe(1);

    // Session 2: 0% correct (poor performance)
    const session2Uuid = crypto.randomUUID();
    await db.insert(playSessions).values({
      sessionUuid: session2Uuid,
      childProfileId: child.id,
      gameLevelId: level.id,
      contentVersion: 1,
      templateId: template.id,
      completionStatus: "in_progress",
    });

    await db.insert(telemetryEvents).values([
      {
        sessionUuid: session2Uuid,
        seq: 1,
        eventName: "game_started",
        occurredAtMs: 0,
      },
      {
        sessionUuid: session2Uuid,
        seq: 2,
        eventName: "round_started",
        occurredAtMs: 100,
      },
      {
        sessionUuid: session2Uuid,
        seq: 3,
        eventName: "answer_incorrect",
        occurredAtMs: 200,
      },
      {
        sessionUuid: session2Uuid,
        seq: 4,
        eventName: "round_completed",
        occurredAtMs: 300,
      },
      {
        sessionUuid: session2Uuid,
        seq: 5,
        eventName: "game_completed",
        occurredAtMs: 400,
      },
    ]);

    await completePlaySession(session2Uuid, undefined, {
      isUserCall: true,
      callerAccountId: u.id,
    });

    const [state2] = await db
      .select()
      .from(masteryState)
      .where(
        and(
          eq(masteryState.childProfileId, child.id),
          eq(masteryState.skillId, skill.id)
        )
      );

    expect(Number(state2.pLearn)).toBeLessThan(highPLearn);
    // bestPLearn must NOT regress
    expect(Number(state2.bestPLearn)).toBe(highPLearn);
    expect(state2.attemptsTotal).toBe(2);
  });

  it("Scenario: BR-ADP-06 & BR-PRG-01 — guest play sessions and manager preview sessions NEVER write to mastery_state", async () => {
    const db = getOwnerDb();
    const { skill, level, template } = await createTestFixtures();

    // Guest Session (no childProfileId)
    const guestSessionUuid = crypto.randomUUID();
    await db.insert(playSessions).values({
      sessionUuid: guestSessionUuid,
      guestDeviceId: "device-123",
      gameLevelId: level.id,
      contentVersion: 1,
      templateId: template.id,
      completionStatus: "in_progress",
    });

    await db.insert(telemetryEvents).values([
      {
        sessionUuid: guestSessionUuid,
        seq: 1,
        eventName: "game_started",
        occurredAtMs: 0,
      },
      {
        sessionUuid: guestSessionUuid,
        seq: 2,
        eventName: "game_completed",
        occurredAtMs: 100,
      },
    ]);

    await completePlaySession(guestSessionUuid, undefined, {
      guestDeviceId: "device-123",
    });

    // Preview Session (isPreview = true)
    const previewSessionUuid = crypto.randomUUID();
    await db.insert(playSessions).values({
      sessionUuid: previewSessionUuid,
      guestDeviceId: "device-preview",
      gameLevelId: level.id,
      contentVersion: 1,
      templateId: template.id,
      completionStatus: "in_progress",
      isPreview: true,
    });

    await db.insert(telemetryEvents).values([
      {
        sessionUuid: previewSessionUuid,
        seq: 1,
        eventName: "game_started",
        occurredAtMs: 0,
      },
      {
        sessionUuid: previewSessionUuid,
        seq: 2,
        eventName: "game_completed",
        occurredAtMs: 100,
      },
    ]);

    await completePlaySession(previewSessionUuid, undefined, {
      guestDeviceId: "device-preview",
    });

    const rows = await db
      .select()
      .from(masteryState)
      .where(eq(masteryState.skillId, skill.id));

    expect(rows.length).toBe(0);
  });
});

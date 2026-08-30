import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "#src/index";
import { masteryState } from "#src/schema/adaptive";
import { childProfiles } from "#src/schema/child";
import { gameLevels, gameTemplates } from "#src/schema/game";
import { users } from "#src/schema/identity";
import { playSessions, telemetryEvents } from "#src/schema/play";
import { contentSkillMap } from "#src/schema/tagging";
import { competencies, skills, strands } from "#src/schema/taxonomy";
import { completePlaySession } from "#src/services/play-session";

describe("P3.5 Adaptive & Mastery Integration Tests (PostgreSQL)", () => {
  async function createTestFixtures() {
    const db = getOwnerDb();

    // 1. Create user and child
    const [u] = await db
      .insert(users)
      .values({
        email: `user-adp-${crypto.randomUUID()}@example.com`,
        displayName: "Parent ADP",
      })
      .returning();
    if (!u) {
      throw new Error("Failed to insert user");
    }

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: u.id,
        displayName: "Bé ADP",
        birthYear: 2021,
        avatarId: "preset_01",
      })
      .returning();
    if (!child) {
      throw new Error("Failed to insert child");
    }

    // 2. Create taxonomy: competency, unique strand, unique skill
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
          name: "Số & Đếm",
          colorToken: "brand-blue",
          icon: "icon-c1",
          position: 1,
        })
        .returning();
    }
    if (!comp) {
      throw new Error("Failed to insert competency");
    }

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const randLetters = Array.from(
      { length: 3 },
      () => letters[Math.floor(Math.random() * letters.length)]
    ).join("");
    const validStrandCode = `C1.A${randLetters}`; // e.g. C1.AXYZ

    let [strand] = await db
      .insert(strands)
      .values({
        competencyId: comp.id,
        code: validStrandCode,
        name: `Đếm số lượng ${validStrandCode}`,
        position: 1,
      })
      .onConflictDoNothing()
      .returning();

    if (!strand) {
      [strand] = await db
        .select()
        .from(strands)
        .where(eq(strands.code, validStrandCode));
    }
    if (!strand) {
      throw new Error("Failed to find strand");
    }

    const skillCode = `${validStrandCode}.01`;
    const [skill] = await db
      .insert(skills)
      .values({
        strandId: strand.id,
        code: skillCode,
        name: `Đếm trong phạm vi 5 ${skillCode}`,
        difficulty: 1,
        ageMin: 3,
        ageMax: 4,
        position: 1,
      })
      .returning();
    if (!skill) {
      throw new Error("Failed to insert skill");
    }

    // 3. Create game template and level
    let template: typeof gameTemplates.$inferSelect | undefined;
    const templateCode = `GT-${String(Math.floor(Math.random() * 899 + 100)).padStart(3, "0")}`;
    const [existingTemplate] = await db
      .select()
      .from(gameTemplates)
      .where(eq(gameTemplates.code, templateCode))
      .limit(1);

    if (existingTemplate) {
      template = existingTemplate;
    } else {
      [template] = await db
        .insert(gameTemplates)
        .values({
          code: templateCode,
          name: "Tap To Count",
          mechanic: "tap_select",
          status: "active",
        })
        .returning();
    }
    if (!template) {
      throw new Error("Failed to insert template");
    }

    let level: typeof gameLevels.$inferSelect | undefined;
    const levelCode = `GL-C1-CNT-TAP-${String(Math.floor(Math.random() * 8999 + 1000)).padStart(4, "0")}`;
    const [existingLevel] = await db
      .select()
      .from(gameLevels)
      .where(eq(gameLevels.code, levelCode))
      .limit(1);

    if (existingLevel) {
      level = existingLevel;
    } else {
      [level] = await db
        .insert(gameLevels)
        .values({
          entityId: Math.floor(Math.random() * 800_000 + 100_000),
          code: levelCode,
          templateId: template.id,
          title: "Level Test 1",
          contentPack: {},
          difficultyParams: {},
          accessTier: "free",
          status: "published",
        })
        .returning();
    }
    if (!level) {
      throw new Error("Failed to insert level");
    }

    // 4. Map level to skill
    const [existingMap] = await db
      .select()
      .from(contentSkillMap)
      .where(
        and(
          eq(contentSkillMap.entityType, "game_level"),
          eq(contentSkillMap.entityId, level.id),
          eq(contentSkillMap.skillId, skill.id)
        )
      )
      .limit(1);

    if (!existingMap) {
      await db.insert(contentSkillMap).values({
        entityType: "game_level",
        entityId: level.id,
        skillId: skill.id,
        weight: "1.0000",
      });
    }

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
    if (!row) {
      throw new Error("row not found");
    }
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
    if (!state1) {
      throw new Error("state1 not found");
    }

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
    if (!state2) {
      throw new Error("state2 not found");
    }

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

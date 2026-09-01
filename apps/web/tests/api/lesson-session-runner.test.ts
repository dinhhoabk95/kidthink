import {
  activities,
  childProfiles,
  gameLevels,
  gameTemplates,
  getAppDb,
  LessonSessionRunnerService,
  lessonActivities,
  lessonRuns,
  lessons,
  users,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("Task #95 — Lesson Session Runner (BR-LSR-01..16)", () => {
  const db = getAppDb();
  let testUserId: number;
  let otherUserId: number;
  let testChildId: number;
  let testLessonId: number;
  const testLessonCode = "LES-9991";

  beforeEach(async () => {
    // 1. Create test user
    const [user] = await db
      .insert(users)
      .values({
        email: `runner_test_${Date.now()}@tinimath.test`,
        passwordHash: "hash",
        displayName: "Teacher Tester",
        status: "active",
      })
      .returning();
    testUserId = user.id;

    // 2. Create other user (for IDOR tests)
    const [otherUser] = await db
      .insert(users)
      .values({
        email: `runner_other_${Date.now()}@tinimath.test`,
        passwordHash: "hash",
        displayName: "Other User",
        status: "active",
      })
      .returning();
    otherUserId = otherUser.id;

    // 3. Create active child profile for test user
    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: testUserId,
        displayName: "Bé Gấu",
        birthYear: 2021,
        ageBand: "3-4",
        avatarId: "bear",
        relationship: "child",
        status: "active",
      })
      .returning();
    testChildId = child.id;

    // 4. Create published test lesson
    const [lesson] = await db
      .insert(lessons)
      .values({
        entityId: 1,
        code: testLessonCode,
        title: "Bài học thử nghiệm",
        contentVersion: 1,
        status: "published",
        accessTier: "free",
        guide: {
          goal: "Nhận biết các hình khối cơ bản trong không gian",
          materials: "Thẻ hình tam giác, vuông, tròn",
          opening:
            "Chào bé! Hôm nay chúng mình cùng tìm các bạn hình khối nhé!",
        },
      })
      .returning();
    testLessonId = lesson.id;
  });

  afterEach(async () => {
    // Cleanup
    if (testLessonId) {
      await db.delete(lessons).where(eq(lessons.id, testLessonId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
    if (otherUserId) {
      await db.delete(users).where(eq(users.id, otherUserId));
    }
  });

  it("Scenario 1 & BR-LSR-01: Starts a new lesson session run and initializes steps", async () => {
    const result = await LessonSessionRunnerService.startLessonRun({
      userId: testUserId,
      childProfileId: testChildId,
      lessonCode: testLessonCode,
    });

    expect(result.runUuid).toBeDefined();
    expect(result.lesson.code).toBe(testLessonCode);
    expect(result.lesson.contentVersion).toBe(1);
    expect(result.status).toBe("in_progress");
    expect(result.currentStep).toBe(0);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it("Scenario 2 & BR-LSR-07: Pinned content_version remains intact throughout session run", async () => {
    // 1. Open run at v1
    const run1 = await LessonSessionRunnerService.startLessonRun({
      userId: testUserId,
      childProfileId: testChildId,
      lessonCode: testLessonCode,
    });
    expect(run1.lesson.contentVersion).toBe(1);

    // 2. Re-fetch the in-progress run: must retain pinned v1 (BR-LSR-07)
    const runReopened = await LessonSessionRunnerService.getLessonRun(
      run1.runUuid,
      testUserId
    );
    expect(runReopened.lesson.contentVersion).toBe(1);
    expect(runReopened.runUuid).toBe(run1.runUuid);
  });

  it("Scenario 3 & BR-LSR-08: Skipping a step records outcome='skipped' and advances step index", async () => {
    const run = await LessonSessionRunnerService.startLessonRun({
      userId: testUserId,
      childProfileId: testChildId,
      lessonCode: testLessonCode,
    });

    // Advance with skip
    const stepRes = await LessonSessionRunnerService.updateStep(
      run.runUuid,
      testUserId,
      0,
      "skipped"
    );

    expect(stepRes.currentStep).toBe(1);

    const updated = await LessonSessionRunnerService.getLessonRun(
      run.runUuid,
      testUserId
    );
    expect(updated.steps[0]?.outcome).toBe("skipped");
    expect(updated.currentStep).toBe(1);
  });

  it("Scenario 4 & BR-LSR-05: Closed 3-level observation accepts did_it, with_help, not_yet and rejects free-text fields", async () => {
    const run = await LessonSessionRunnerService.startLessonRun({
      userId: testUserId,
      childProfileId: testChildId,
      lessonCode: testLessonCode,
    });

    // Valid observation: did_it
    const obs1 = await LessonSessionRunnerService.recordObservation(
      run.runUuid,
      testUserId,
      "LO-01",
      "did_it"
    );
    expect(obs1.recorded).toBe(true);

    // Valid observation: with_help
    const obs2 = await LessonSessionRunnerService.recordObservation(
      run.runUuid,
      testUserId,
      "LO-02",
      "with_help"
    );
    expect(obs2.recorded).toBe(true);

    // Invalid observation level: throws VALIDATION_FAILED
    await expect(
      LessonSessionRunnerService.recordObservation(
        run.runUuid,
        testUserId,
        "LO-03",
        // @ts-expect-error test invalid level
        "expert"
      )
    ).rejects.toThrow("VALIDATION_FAILED");

    // Free text field in body (e.g. note): throws CHILD_FIELD_NOT_ALLOWED
    await expect(
      LessonSessionRunnerService.recordObservation(
        run.runUuid,
        testUserId,
        "LO-03",
        "did_it",
        ["objective_code", "level", "note"]
      )
    ).rejects.toThrow("CHILD_FIELD_NOT_ALLOWED");
  });

  it("Scenario 5 & BR-LSR-11: Incomplete run older than 7 days is abandoned and new run starts from 0", async () => {
    const t0 = new Date("2026-08-01T08:00:00Z");
    const t8DaysLater = new Date("2026-08-09T08:00:00Z"); // 8 days later (> 7 days)

    // Open run at t0
    const run1 = await LessonSessionRunnerService.startLessonRun({
      userId: testUserId,
      childProfileId: testChildId,
      lessonCode: testLessonCode,
      now: t0,
    });

    // Advance step
    await LessonSessionRunnerService.updateStep(
      run1.runUuid,
      testUserId,
      0,
      "done",
      t0
    );

    // Reopen 8 days later: run1 must be abandoned, and new run starts from step 0
    const run2 = await LessonSessionRunnerService.startLessonRun({
      userId: testUserId,
      childProfileId: testChildId,
      lessonCode: testLessonCode,
      now: t8DaysLater,
    });

    expect(run2.runUuid).not.toBe(run1.runUuid);
    expect(run2.currentStep).toBe(0);

    // Verify run1 is marked abandoned
    const [abandonedRun] = await db
      .select()
      .from(lessonRuns)
      .where(eq(lessonRuns.uuid, run1.runUuid));
    expect(abandonedRun?.status).toBe("abandoned");
  });

  it("Scenario 6: Completing session records completed status and count of observations", async () => {
    const run = await LessonSessionRunnerService.startLessonRun({
      userId: testUserId,
      childProfileId: testChildId,
      lessonCode: testLessonCode,
    });

    await LessonSessionRunnerService.recordObservation(
      run.runUuid,
      testUserId,
      "LO-SHAPE-01",
      "did_it"
    );

    const completeRes = await LessonSessionRunnerService.completeLessonRun(
      run.runUuid,
      testUserId
    );

    expect(completeRes.status).toBe("completed");
    expect(completeRes.observationsCount).toBe(1);

    // Modifying completed session throws SESSION_ALREADY_COMPLETED
    await expect(
      LessonSessionRunnerService.updateStep(run.runUuid, testUserId, 0, "done")
    ).rejects.toThrow("SESSION_ALREADY_COMPLETED");
  });

  it("Scenario 7: IDOR Protection — Other user cannot read or update session", async () => {
    const run = await LessonSessionRunnerService.startLessonRun({
      userId: testUserId,
      childProfileId: testChildId,
      lessonCode: testLessonCode,
    });

    // Other user attempts to get run -> throws NOT_FOUND
    await expect(
      LessonSessionRunnerService.getLessonRun(run.runUuid, otherUserId)
    ).rejects.toThrow("NOT_FOUND");

    // Other user attempts to update step -> throws NOT_FOUND
    await expect(
      LessonSessionRunnerService.updateStep(run.runUuid, otherUserId, 0, "done")
    ).rejects.toThrow("NOT_FOUND");
  });

  it("Scenario 8 & WP167.4: Resolves digital_game activity refId to gameLevelCode", async () => {
    // 1. Create a game template & game level
    let [template] = await db
      .select()
      .from(gameTemplates)
      .where(eq(gameTemplates.code, "GT-001"));
    if (!template) {
      const [t] = await db
        .insert(gameTemplates)
        .values({
          code: "GT-001",
          name: "Tap Select",
          engineSession: "GT-001",
          mechanic: "tap_select",
          status: "active",
        })
        .returning();
      template = t;
    }

    const testGameLevelCode = "GL-C1-CNT-NUM-0001";
    const [level] = await db
      .insert(gameLevels)
      .values({
        entityId: 99_991,
        code: testGameLevelCode,
        title: "Test Digital Game Level",
        contentVersion: 1,
        templateId: template.id,
        status: "published",
        accessTier: "free",
        instruction: "Chơi thử",
        ageMin: 3,
        ageMax: 4,
        difficulty: 1,
        contentPack: { items: [] },
        difficultyParams: { count: 3 },
      })
      .returning();

    // 2. Create activity of kind digital_game with refId = level.id
    const [act] = await db
      .insert(activities)
      .values({
        entityId: 99_992,
        code: "ACT-9992",
        kind: "digital_game",
        title: "Hoạt động trò chơi số",
        contentVersion: 1,
        status: "published",
        accessTier: "free",
        refType: "game_level",
        refId: level.id,
        instruction: { goal: "Chơi game" },
        estimatedMinutes: 5,
      })
      .returning();

    // 3. Link activity to test lesson
    await db.insert(lessonActivities).values({
      lessonId: testLessonId,
      activityId: act.id,
      position: 1,
      isRequired: true,
    });

    // 4. Start lesson run
    const result = await LessonSessionRunnerService.startLessonRun({
      userId: testUserId,
      childProfileId: testChildId,
      lessonCode: testLessonCode,
    });

    // 5. Verify gameLevelCode is resolved correctly
    const digitalGameStep = result.steps.find((s) => s.kind === "digital_game");
    expect(digitalGameStep).toBeDefined();
    expect(digitalGameStep?.activity?.gameLevelCode).toBe(testGameLevelCode);

    // Cleanup
    await db.delete(lessonRuns).where(eq(lessonRuns.uuid, result.runUuid));
    await db
      .delete(lessonActivities)
      .where(eq(lessonActivities.activityId, act.id));
    await db.delete(activities).where(eq(activities.id, act.id));
    await db.delete(gameLevels).where(eq(gameLevels.id, level.id));
  });
});

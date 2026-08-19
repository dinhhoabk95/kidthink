import {
  activities,
  childProfiles,
  getAppDb,
  LessonExemplarService,
  LessonSessionRunnerService,
  lessonActivities,
  lessonRuns,
  lessons,
  managers,
  users,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("Task #96 — Lesson Exemplar Set (BR-LEX-01..11)", () => {
  const db = getAppDb();
  let testManagerId: number;
  let testReviewerId: number;
  let testUserId: number;
  let testChildId: number;
  let sampleLessonId: number;
  let offScreenActId: number;
  let digitalGameActId: number;

  let actCounter = Math.floor(Math.random() * 5000) + 1000;
  let lesCounter = Math.floor(Math.random() * 5000) + 1000;

  function nextActCode(): string {
    actCounter = ((actCounter - 1000 + 1) % 8999) + 1000;
    return `ACT-${String(actCounter).padStart(4, "0")}`;
  }

  function nextLesCode(): string {
    lesCounter = ((lesCounter - 1000 + 1) % 8999) + 1000;
    return `LES-${String(lesCounter).padStart(4, "0")}`;
  }

  function isUniqueViolation(e: unknown): boolean {
    if (!e || typeof e !== "object") {
      return false;
    }
    if ("code" in e && e.code === "23505") {
      return true;
    }
    if (
      "cause" in e &&
      e.cause &&
      typeof e.cause === "object" &&
      "code" in e.cause &&
      e.cause.code === "23505"
    ) {
      return true;
    }
    if (
      "message" in e &&
      typeof e.message === "string" &&
      e.message.includes("duplicate key")
    ) {
      return true;
    }
    return false;
  }

  async function insertTestActivity(
    values: Partial<typeof activities.$inferInsert>
  ) {
    for (let i = 0; i < 50; i++) {
      const randomCode = nextActCode();
      try {
        const [act] = await db
          .insert(activities)
          .values({
            entityId: Math.floor(Math.random() * 1_000_000_000) + 100_000,
            code: randomCode,
            contentVersion: 1,
            kind: "manipulative",
            title: "Hoạt động test",
            instruction: "Hướng dẫn test",
            accessTier: "free",
            status: "published",
            origin: "human",
            ...values,
          })
          .returning();
        return act;
      } catch (e: unknown) {
        if (isUniqueViolation(e)) {
          continue;
        }
        throw e;
      }
    }
    throw new Error("Failed to generate unique activity code");
  }

  async function insertTestLesson(
    values: Partial<typeof lessons.$inferInsert>
  ) {
    for (let i = 0; i < 50; i++) {
      const randomCode = nextLesCode();
      try {
        const [lesson] = await db
          .insert(lessons)
          .values({
            entityId: Math.floor(Math.random() * 1_000_000_000) + 100_000,
            code: randomCode,
            contentVersion: 1,
            title: "Bài học test",
            accessTier: "free",
            status: "published",
            origin: "human",
            targetAgeMin: 3,
            targetAgeMax: 4,
            estimatedMinutes: 20,
            ...values,
          })
          .returning();
        return lesson;
      } catch (e: unknown) {
        if (isUniqueViolation(e)) {
          continue;
        }
        throw e;
      }
    }
    throw new Error("Failed to generate unique lesson code");
  }

  beforeEach(async () => {
    // 1. Create Super Admin & Content Reviewer managers (BR-LEX-10)
    const [sa] = await db
      .insert(managers)
      .values({
        email: `manager-sa-${Date.now()}-${Math.random()}@example.com`,
        passwordHash: "$argon2id$mock_hash_for_test",
        displayName: "Super Admin Manager",
        role: "super_admin",
      })
      .returning();
    testManagerId = sa.id;

    const [cr] = await db
      .insert(managers)
      .values({
        email: `manager-cr-${Date.now()}-${Math.random()}@example.com`,
        passwordHash: "$argon2id$mock_hash_for_test",
        displayName: "Content Reviewer",
        role: "content_reviewer",
      })
      .returning();
    testReviewerId = cr.id;

    // 2. Create parent & child for playtest runs
    const [user] = await db
      .insert(users)
      .values({
        email: `parent-lex-${Date.now()}-${Math.random()}@example.com`,
        displayName: "Test Parent",
      })
      .returning();
    testUserId = user.id;

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: testUserId,
        displayName: "Bé Thỏ",
        birthYear: 2021,
        avatarId: "bunny",
        relationship: "child",
        status: "active",
      })
      .returning();
    testChildId = child.id;

    // 3. Create activities: 1 off-screen and 1 digital_game (BR-LEX-05)
    const offAct = await insertTestActivity({
      kind: "manipulative",
      title: "Xếp khối gỗ",
      instruction: "Bé dùng các khối gỗ xếp thành hình ngôi nhà",
    });
    offScreenActId = offAct.id;

    const digAct = await insertTestActivity({
      kind: "digital_game",
      title: "Ghép hình số",
      instruction: "Chạm vào các hình đúng số lượng",
    });
    digitalGameActId = digAct.id;

    // 4. Create standard published free human lesson
    const lesson = await insertTestLesson({
      title: "Bài học mẫu thử nghiệm",
    });
    sampleLessonId = lesson.id;

    // Link balanced activities
    await db.insert(lessonActivities).values([
      {
        lessonId: sampleLessonId,
        activityId: offScreenActId,
        position: 1,
        isRequired: true,
      },
      {
        lessonId: sampleLessonId,
        activityId: digitalGameActId,
        position: 2,
        isRequired: true,
      },
    ]);
  });

  afterEach(async () => {
    // Clean up created entities
    if (sampleLessonId) {
      await db
        .delete(lessonActivities)
        .where(eq(lessonActivities.lessonId, sampleLessonId));
      await db
        .delete(lessonRuns)
        .where(eq(lessonRuns.lessonId, sampleLessonId));
      await db.delete(lessons).where(eq(lessons.id, sampleLessonId));
    }
    if (offScreenActId) {
      await db.delete(activities).where(eq(activities.id, offScreenActId));
    }
    if (digitalGameActId) {
      await db.delete(activities).where(eq(activities.id, digitalGameActId));
    }
  });

  it("Scenario 1 & BR-LEX-01: Exemplar is a flag and metadata on lessons table", async () => {
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, sampleLessonId));

    expect(lesson.isExemplar).toBe(false);
    expect(lesson.exemplarCompetency).toBeNull();
    expect(lesson.exemplarAgeBand).toBeNull();
    expect(lesson.exemplarApprovedById).toBeNull();
  });

  it("Scenario 2 & BR-LEX-02: Rejects eligibility when lesson lacks playtest evidence (completed run)", async () => {
    // No completed runs exist yet for sampleLessonId
    const res =
      await LessonExemplarService.validateExemplarEligibility(sampleLessonId);
    expect(res.eligible).toBe(false);
    expect(res.conditions.hasPlaytestEvidence).toBe(false);
    expect(res.errors.some((e) => e.includes("BR-LEX-02"))).toBe(true);

    // Attempting nomination should throw
    await expect(
      LessonExemplarService.nominateExemplar({
        lessonId: sampleLessonId,
        managerId: testReviewerId,
        competency: "C1",
        ageBand: "3-4",
      })
    ).rejects.toThrow("BR-LEX-02");
  });

  it("Scenario 3 & BR-LEX-03: Rejects when access_tier is not free", async () => {
    // Create a completed run to satisfy playtest
    const run = await LessonSessionRunnerService.startLessonRun({
      userId: testUserId,
      childProfileId: testChildId,
      lessonCode: (
        await db.select().from(lessons).where(eq(lessons.id, sampleLessonId))
      )[0].code,
    });
    await LessonSessionRunnerService.completeLessonRun(run.runUuid, testUserId);

    // Change tier to standard (paid)
    const paidLesson = await insertTestLesson({
      title: "Paid Lesson",
      accessTier: "standard",
      status: "published",
      origin: "human",
      estimatedMinutes: 15,
    });

    const res = await LessonExemplarService.validateExemplarEligibility(
      paidLesson.id
    );
    expect(res.eligible).toBe(false);
    expect(res.conditions.isFreeTier).toBe(false);
    expect(res.errors.some((e) => e.includes("BR-LEX-03"))).toBe(true);
  });

  it("Scenario 4 & BR-LEX-04: Rejects when origin is not human", async () => {
    const aiLesson = await insertTestLesson({
      title: "AI Assisted Lesson",
      accessTier: "free",
      status: "published",
      origin: "ai_assisted",
      estimatedMinutes: 15,
    });

    const res = await LessonExemplarService.validateExemplarEligibility(
      aiLesson.id
    );
    expect(res.eligible).toBe(false);
    expect(res.conditions.isHumanOrigin).toBe(false);
    expect(res.errors.some((e) => e.includes("BR-LEX-04"))).toBe(true);
  });

  it("Scenario 5 & BR-LEX-05: Rejects when lesson lacks balance between off-screen and digital activities", async () => {
    const unbalancedLesson = await insertTestLesson({
      title: "Digital-only Lesson",
      accessTier: "free",
      status: "published",
      origin: "human",
      estimatedMinutes: 15,
    });

    // Link only digital game
    await db.insert(lessonActivities).values({
      lessonId: unbalancedLesson.id,
      activityId: digitalGameActId,
      position: 1,
      isRequired: true,
    });

    const res = await LessonExemplarService.validateExemplarEligibility(
      unbalancedLesson.id
    );
    expect(res.eligible).toBe(false);
    expect(res.conditions.hasBalancedActivities).toBe(false);
    expect(res.errors.some((e) => e.includes("BR-LEX-05"))).toBe(true);
  });

  it("Scenario 6 & BR-LEX-10: Non-manager / unpermitted user cannot nominate or approve exemplar", async () => {
    await expect(
      LessonExemplarService.nominateExemplar({
        lessonId: sampleLessonId,
        managerId: 999_999, // Non-existent manager
        competency: "C1",
        ageBand: "3-4",
      })
    ).rejects.toThrow("INSUFFICIENT_ROLE");

    await expect(
      LessonExemplarService.approveExemplar({
        lessonId: sampleLessonId,
        approverManagerId: 999_999,
        competency: "C1",
        ageBand: "3-4",
      })
    ).rejects.toThrow("INSUFFICIENT_ROLE");
  });

  it("Scenario 7: Full lifecycle — nominate, approve, query matrix, and revoke exemplar", async () => {
    // 1. Create a completed run to satisfy playtest requirement
    const [l] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, sampleLessonId));
    const run = await LessonSessionRunnerService.startLessonRun({
      userId: testUserId,
      childProfileId: testChildId,
      lessonCode: l.code,
    });
    await LessonSessionRunnerService.completeLessonRun(run.runUuid, testUserId);

    // 2. Verify eligibility passes
    const eligibility =
      await LessonExemplarService.validateExemplarEligibility(sampleLessonId);
    expect(eligibility.eligible).toBe(true);

    // 3. Nominate
    const nomResult = await LessonExemplarService.nominateExemplar({
      lessonId: sampleLessonId,
      managerId: testReviewerId,
      competency: "C1",
      ageBand: "3-4",
      notes: "Bài học đạt chuẩn sư phạm mầm non.",
    });
    expect(nomResult.nominated).toBe(true);

    // 4. Approve (BR-LEX-10)
    const approveResult = await LessonExemplarService.approveExemplar({
      lessonId: sampleLessonId,
      approverManagerId: testManagerId,
      competency: "C1",
      ageBand: "3-4",
      notes: "Đã duyệt mẫu C1 3-4.",
    });
    expect(approveResult.success).toBe(true);

    // Check DB state
    const [approvedLesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, sampleLessonId));
    expect(approvedLesson.isExemplar).toBe(true);
    expect(approvedLesson.exemplarCompetency).toBe("C1");
    expect(approvedLesson.exemplarAgeBand).toBe("3-4");
    expect(approvedLesson.exemplarApprovedById).toBe(testManagerId);

    // 5. Query matrix (BR-LEX-07)
    const matrix = await LessonExemplarService.getExemplarMatrix();
    expect(matrix.totalCount).toBeGreaterThanOrEqual(1);
    expect(matrix.matrix.C1["3-4"].some((x) => x.id === sampleLessonId)).toBe(
      true
    );

    // 6. Revoke
    const revokeResult = await LessonExemplarService.revokeExemplar({
      lessonId: sampleLessonId,
      managerId: testManagerId,
      reason: "Cập nhật chuẩn biên tập mới.",
    });
    expect(revokeResult.revoked).toBe(true);

    const [revokedLesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, sampleLessonId));
    expect(revokedLesson.isExemplar).toBe(false);
    expect(revokedLesson.exemplarCompetency).toBeNull();
  });

  it("Scenario 8 & BR-LEX-08: Enforces ceiling of 2 exemplars per cell", async () => {
    // Seed 2 exemplars in cell C1 3-4
    const ex1 = await insertTestLesson({
      title: "Exemplar 1",
      accessTier: "free",
      status: "published",
      origin: "human",
      isExemplar: true,
      exemplarCompetency: "C1",
      exemplarAgeBand: "3-4",
      exemplarApprovedById: testManagerId,
      estimatedMinutes: 20,
    });
    const ex2 = await insertTestLesson({
      title: "Exemplar 2",
      accessTier: "free",
      status: "published",
      origin: "human",
      isExemplar: true,
      exemplarCompetency: "C1",
      exemplarAgeBand: "3-4",
      exemplarApprovedById: testManagerId,
      estimatedMinutes: 20,
    });

    // Third lesson trying to enter C1 3-4
    // Complete playtest for sampleLessonId
    const [l] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, sampleLessonId));
    const run = await LessonSessionRunnerService.startLessonRun({
      userId: testUserId,
      childProfileId: testChildId,
      lessonCode: l.code,
    });
    await LessonSessionRunnerService.completeLessonRun(run.runUuid, testUserId);

    // Approving the 3rd exemplar must be rejected
    await expect(
      LessonExemplarService.approveExemplar({
        lessonId: sampleLessonId,
        approverManagerId: testManagerId,
        competency: "C1",
        ageBand: "3-4",
      })
    ).rejects.toThrow("EXEMPLAR_CELL_LIMIT_EXCEEDED");

    // Clean up
    await db.delete(lessons).where(eq(lessons.id, ex1.id));
    await db.delete(lessons).where(eq(lessons.id, ex2.id));
  });
});

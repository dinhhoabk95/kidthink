import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "#src/index";
import { activities, lessonActivities, lessons } from "#src/schema/content";

const UNIQUE_DUP_REGEX = /unique|duplicate/i;

describe("lesson_activities Migration & Constraint Tests (Task 2)", () => {
  async function getUniqueLessonCode() {
    const db = getOwnerDb();
    while (true) {
      const candidate = `LES-${String(Math.floor(1000 + Math.random() * 8999))}`;
      const [existing] = await db
        .select({ id: lessons.id })
        .from(lessons)
        .where(eq(lessons.code, candidate))
        .limit(1);
      if (!existing) {
        return candidate;
      }
    }
  }

  async function getUniqueActivityCode() {
    const db = getOwnerDb();
    while (true) {
      const candidate = `ACT-${String(Math.floor(1000 + Math.random() * 8999))}`;
      const [existing] = await db
        .select({ id: activities.id })
        .from(activities)
        .where(eq(activities.code, candidate))
        .limit(1);
      if (!existing) {
        return candidate;
      }
    }
  }

  it("rejects duplicate activity_id in the same lesson with unique constraint violation (negative test)", async () => {
    const db = getOwnerDb();
    const lesCode = await getUniqueLessonCode();
    const actCode = await getUniqueActivityCode();

    const [les] = await db
      .insert(lessons)
      .values({
        entityId: Math.floor(Math.random() * 800_000) + 100_000,
        code: lesCode,
        contentVersion: 1,
        title: "Lesson Test",
        guide: "Guide test",
        targetAgeMin: 3,
        targetAgeMax: 4,
        estimatedMinutes: 15,
        accessTier: "free",
        status: "draft",
      })
      .returning();
    if (!les) {
      throw new Error("Failed to insert lesson");
    }

    const [act] = await db
      .insert(activities)
      .values({
        entityId: Math.floor(Math.random() * 800_000) + 100_000,
        code: actCode,
        contentVersion: 1,
        kind: "discussion",
        title: "Activity Test",
        instruction: "Instruction test",
        estimatedMinutes: 5,
        accessTier: "free",
        status: "draft",
      })
      .returning();
    if (!act) {
      throw new Error("Failed to insert activity");
    }

    // First attach should succeed
    await db.insert(lessonActivities).values({
      lessonId: les.id,
      position: 1,
      activityId: act.entityId,
      isRequired: true,
    });

    // Second attach with same activityId (even different position) MUST fail
    let error: unknown = null;
    try {
      await db.insert(lessonActivities).values({
        lessonId: les.id,
        position: 2,
        activityId: act.entityId,
        isRequired: false,
      });
    } catch (err) {
      error = err;
    }

    expect(error).not.toBeNull();
    const cause =
      (error as { cause?: { code?: string; message?: string } })?.cause ??
      (error as { code?: string; message?: string });
    expect(
      cause?.code === "23505" ||
        UNIQUE_DUP_REGEX.test(String(cause?.message || cause))
    ).toBe(true);
  });

  it("supports atomic position swap of activities in a transaction", async () => {
    const db = getOwnerDb();
    const lesCode = await getUniqueLessonCode();
    const actCode1 = await getUniqueActivityCode();
    const actCode2 = await getUniqueActivityCode();

    const [les] = await db
      .insert(lessons)
      .values({
        entityId: Math.floor(Math.random() * 800_000) + 100_000,
        code: lesCode,
        contentVersion: 1,
        title: "Lesson Test Swap",
        guide: "Guide test",
        targetAgeMin: 4,
        targetAgeMax: 5,
        estimatedMinutes: 20,
        accessTier: "free",
        status: "draft",
      })
      .returning();
    if (!les) {
      throw new Error("Failed to insert lesson");
    }

    const [act1] = await db
      .insert(activities)
      .values({
        entityId: Math.floor(Math.random() * 800_000) + 100_000,
        code: actCode1,
        contentVersion: 1,
        kind: "discussion",
        title: "Activity 1",
        instruction: "Instruction 1",
        estimatedMinutes: 5,
        accessTier: "free",
        status: "draft",
      })
      .returning();
    if (!act1) {
      throw new Error("Failed to insert act1");
    }

    const [act2] = await db
      .insert(activities)
      .values({
        entityId: Math.floor(Math.random() * 800_000) + 100_000,
        code: actCode2,
        contentVersion: 1,
        kind: "movement",
        title: "Activity 2",
        instruction: "Instruction 2",
        estimatedMinutes: 10,
        accessTier: "free",
        status: "draft",
      })
      .returning();
    if (!act2) {
      throw new Error("Failed to insert act2");
    }

    // Initial order: pos 1 -> act1, pos 2 -> act2
    await db.insert(lessonActivities).values([
      {
        lessonId: les.id,
        position: 1,
        activityId: act1.entityId,
        isRequired: true,
      },
      {
        lessonId: les.id,
        position: 2,
        activityId: act2.entityId,
        isRequired: true,
      },
    ]);

    // Atomic replace inside transaction (as used in PUT /activities endpoint)
    await db.transaction(async (tx) => {
      await tx
        .delete(lessonActivities)
        .where(eq(lessonActivities.lessonId, les.id));
      await tx.insert(lessonActivities).values([
        {
          lessonId: les.id,
          position: 1,
          activityId: act2.entityId,
          isRequired: true,
        },
        {
          lessonId: les.id,
          position: 2,
          activityId: act1.entityId,
          isRequired: true,
        },
      ]);
    });

    const rows = await db
      .select()
      .from(lessonActivities)
      .where(eq(lessonActivities.lessonId, les.id))
      .orderBy(lessonActivities.position);

    expect(rows).toHaveLength(2);
    expect(rows[0]?.activityId).toBe(act2.entityId);
    expect(rows[1]?.activityId).toBe(act1.entityId);
  });

  it("preserves entity_id lineage reference without strict FK to activities.id (D-AE)", async () => {
    const db = getOwnerDb();
    let lesCode = "";
    while (true) {
      const candidate = `LES-${String(Math.floor(1000 + Math.random() * 8999))}`;
      const [existing] = await db
        .select({ id: lessons.id })
        .from(lessons)
        .where(eq(lessons.code, candidate))
        .limit(1);
      if (!existing) {
        lesCode = candidate;
        break;
      }
    }
    const nonExistentEntityId = 888_777_666;

    const [les] = await db
      .insert(lessons)
      .values({
        entityId: Math.floor(Math.random() * 100_000) + 1000,
        code: lesCode,
        contentVersion: 1,
        title: "Lesson Test D-AE",
        guide: "Guide test",
        targetAgeMin: 3,
        targetAgeMax: 6,
        estimatedMinutes: 10,
        accessTier: "free",
        status: "draft",
      })
      .returning();
    if (!les) {
      throw new Error("Failed to insert lesson");
    }

    // Inserting activityId directly (entity_id reference) succeeds at DB level
    const [inserted] = await db
      .insert(lessonActivities)
      .values({
        lessonId: les.id,
        position: 1,
        activityId: nonExistentEntityId,
        isRequired: true,
      })
      .returning();
    if (!inserted) {
      throw new Error("Failed to insert lessonActivity");
    }

    expect(inserted.activityId).toBe(nonExistentEntityId);
  });
});

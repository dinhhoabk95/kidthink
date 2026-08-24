import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getOwnerDb, lessonPlanItems, lessonPlans, users } from "#src/index";

describe("Task P4.1 — Database Schema & Invariants Integration Tests (BR-LPC-01..09, D-P4A..D-P4D)", () => {
  const db = getOwnerDb();
  let testUserId: number;

  afterEach(async () => {
    if (testUserId) {
      await db
        .delete(lessonPlans)
        .where(eq(lessonPlans.userId, testUserId))
        .catch(() => undefined);
      await db
        .delete(users)
        .where(eq(users.id, testUserId))
        .catch(() => undefined);
    }
  });

  beforeEach(async () => {
    const [user] = await db
      .insert(users)
      .values({
        email: `teacher_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`,
        passwordHash: "hash123",
        displayName: "Cô Giáo Test",
      })
      .returning();
    testUserId = user.id;
  });

  it("BR-LPC-09: verifies lesson_plans has owner, metadata, version and NO child FK", async () => {
    const [plan] = await db
      .insert(lessonPlans)
      .values({
        userId: testUserId,
        title: "Giáo án nhận biết số lượng",
        targetAge: 4,
        estimatedMinutes: 30,
        notes: "Chuẩn bị 10 thẻ hình",
        version: 1,
      })
      .returning();

    expect(plan.id).toBeDefined();
    expect(plan.uuid).toBeDefined();
    expect(plan.userId).toBe(testUserId);
    expect(plan.version).toBe(1);
    expect((plan as any).childId).toBeUndefined();
    expect((plan as any).child_profile_id).toBeUndefined();
  });

  it("enforces targetAge check constraint (3..6) on lesson_plans", async () => {
    await expect(
      db.insert(lessonPlans).values({
        userId: testUserId,
        title: "Giáo án sai tuổi",
        targetAge: 2, // invalid: < 3
      })
    ).rejects.toThrow();

    await expect(
      db.insert(lessonPlans).values({
        userId: testUserId,
        title: "Giáo án sai tuổi",
        targetAge: 7, // invalid: > 6
      })
    ).rejects.toThrow();
  });

  it("enforces unique (lesson_plan_id, position) on lesson_plan_items", async () => {
    const [plan] = await db
      .insert(lessonPlans)
      .values({
        userId: testUserId,
        title: "Giáo án kiểm tra vị trí",
        version: 1,
      })
      .returning();

    await db.insert(lessonPlanItems).values({
      lessonPlanId: plan.id,
      position: 0,
      itemType: "custom_note",
      snapshot: { content: "Ghi chú 1" },
    });

    // Duplicate position 0 should fail
    await expect(
      db.insert(lessonPlanItems).values({
        lessonPlanId: plan.id,
        position: 0,
        itemType: "custom_note",
        snapshot: { content: "Ghi chú trùng vị trí" },
      })
    ).rejects.toThrow();
  });

  it("cascade deletes lesson_plan_items when lesson_plans row is deleted", async () => {
    const [plan] = await db
      .insert(lessonPlans)
      .values({
        userId: testUserId,
        title: "Giáo án xóa thử",
        version: 1,
      })
      .returning();

    await db.insert(lessonPlanItems).values([
      {
        lessonPlanId: plan.id,
        position: 0,
        itemType: "custom_note",
        snapshot: { content: "Ghi chú A" },
      },
      {
        lessonPlanId: plan.id,
        position: 1,
        itemType: "custom_note",
        snapshot: { content: "Ghi chú B" },
      },
    ]);

    // Delete plan
    await db.delete(lessonPlans).where(eq(lessonPlans.id, plan.id));

    const remainingItems = await db
      .select()
      .from(lessonPlanItems)
      .where(eq(lessonPlanItems.lessonPlanId, plan.id));
    expect(remainingItems.length).toBe(0);
  });
});

import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  childProfiles,
  curricula,
  curriculumEnrollments,
  curriculumItemProgress,
  curriculumItems,
  curriculumWeeks,
  getOwnerDb,
  users,
} from "#src/index";

describe("P3.3 Database Schema & Invariants Integration Tests (Task 2)", () => {
  const db = getOwnerDb();
  let testUserId: number;
  let testChildId: number;
  let testCurriculumId: number;
  let testCurriculumCode: string;

  beforeEach(async () => {
    const rand = Math.floor(Math.random() * 100_000);
    const ts = Date.now();
    testCurriculumCode = `CUR-T${ts}${rand}`;

    // Create base user and child profile
    const [user] = await db
      .insert(users)
      .values({
        email: `parent-${ts}-${rand}@example.com`,
        passwordHash: "hash123",
        displayName: "Parent Test",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }
    testUserId = user.id;

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: testUserId,
        displayName: "Bé Test",
        birthYear: 2021,
        avatarId: "avatar-bear",
      })
      .returning();
    if (!child) {
      throw new Error("Failed to insert child");
    }
    testChildId = child.id;

    // Create a base curriculum
    const [curr] = await db
      .insert(curricula)
      .values({
        entityId: Math.floor(Math.random() * 800_000) + 100_000,
        code: testCurriculumCode,
        contentVersion: 1,
        programType: "age_based",
        targetAgeMin: 3,
        targetAgeMax: 4,
        durationWeeks: 8,
        sessionsPerWeek: 3,
        title: "Chương Trình Bé 3 Tuổi",
        description: "Dành cho bé 3-4 tuổi phát triển tư duy toán học",
        accessTier: "standard",
        status: "draft",
      })
      .returning();
    if (!curr) {
      throw new Error("Failed to insert curr");
    }
    testCurriculumId = curr.id;
  });

  afterEach(async () => {
    if (testCurriculumId) {
      await db
        .delete(curriculumEnrollments)
        .where(eq(curriculumEnrollments.curriculumId, testCurriculumId));
      await db
        .delete(curriculumItems)
        .where(eq(curriculumItems.curriculumId, testCurriculumId));
      await db
        .delete(curriculumWeeks)
        .where(eq(curriculumWeeks.curriculumId, testCurriculumId));
      await db.delete(curricula).where(eq(curricula.id, testCurriculumId));
    }
    if (testChildId) {
      await db.delete(childProfiles).where(eq(childProfiles.id, testChildId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe("Curricula Schema & Invariants (D-LT)", () => {
    it("persists curriculum with 4 configuration columns & program_type enum", async () => {
      const [row] = await db
        .select()
        .from(curricula)
        .where(eq(curricula.id, testCurriculumId));
      if (!row) {
        throw new Error("Failed to select row");
      }

      expect(row).toBeDefined();
      expect(row.code).toBe(testCurriculumCode);
      expect(row.programType).toBe("age_based");
      expect(row.targetAgeMin).toBe(3);
      expect(row.targetAgeMax).toBe(4);
      expect(row.durationWeeks).toBe(8);
      expect(row.sessionsPerWeek).toBe(3);
    });

    it("enforces curriculum code format regex check constraint", async () => {
      await expect(
        db.insert(curricula).values({
          entityId: Date.now() + 1,
          code: "INVALID_CODE_123",
          contentVersion: 1,
          programType: "journey",
          durationWeeks: 42,
          sessionsPerWeek: 3,
          title: "Invalid Code",
          accessTier: "standard",
        })
      ).rejects.toThrow();
    });
  });

  describe("Curriculum Weeks Schema (BR-CRM-10, D-LT)", () => {
    it("inserts week goals with unique (curriculum_id, week_no)", async () => {
      await db.insert(curriculumWeeks).values({
        curriculumId: testCurriculumId,
        weekNo: 1,
        goal: "Làm quen với số lượng và đếm trong phạm vi 3",
      });

      const [week] = await db
        .select()
        .from(curriculumWeeks)
        .where(
          and(
            eq(curriculumWeeks.curriculumId, testCurriculumId),
            eq(curriculumWeeks.weekNo, 1)
          )
        );
      if (!week) {
        throw new Error("Failed to select week");
      }

      expect(week.goal).toBe("Làm quen với số lượng và đếm trong phạm vi 3");

      // Duplicate week_no for same curriculum must fail
      await expect(
        db.insert(curriculumWeeks).values({
          curriculumId: testCurriculumId,
          weekNo: 1,
          goal: "Duplicate week goal",
        })
      ).rejects.toThrow();
    });
  });

  describe("Curriculum Items Schema (D-LS, D-LW, D-LX)", () => {
    it("persists items with week_no, session_no, position, is_required", async () => {
      await db.insert(curriculumItems).values({
        curriculumId: testCurriculumId,
        weekNo: 1,
        sessionNo: 1,
        position: 1,
        entityType: "lesson",
        entityId: 1001,
        isRequired: true,
      });

      const [item] = await db
        .select()
        .from(curriculumItems)
        .where(eq(curriculumItems.curriculumId, testCurriculumId));
      if (!item) {
        throw new Error("Failed to select item");
      }

      expect(item.weekNo).toBe(1);
      expect(item.sessionNo).toBe(1);
      expect(item.position).toBe(1);
      expect(item.entityType).toBe("lesson");
      expect(item.entityId).toBe(1001);
      expect(item.isRequired).toBe(true);
    });

    it("rejects duplicate position within the same (curriculum_id, week_no, session_no)", async () => {
      await db.insert(curriculumItems).values({
        curriculumId: testCurriculumId,
        weekNo: 1,
        sessionNo: 1,
        position: 1,
        entityType: "lesson",
        entityId: 1001,
        isRequired: true,
      });

      await expect(
        db.insert(curriculumItems).values({
          curriculumId: testCurriculumId,
          weekNo: 1,
          sessionNo: 1,
          position: 1,
          entityType: "game_level",
          entityId: 2001,
          isRequired: false,
        })
      ).rejects.toThrow();
    });
  });

  describe("Curriculum Enrollments & Item Progress (D-LV)", () => {
    it("allows enrollment pinned to curricula.id and prevents duplicate active enrollment", async () => {
      const [enrollment] = await db
        .insert(curriculumEnrollments)
        .values({
          childId: testChildId,
          curriculumId: testCurriculumId,
          status: "active",
        })
        .returning();
      if (!enrollment) {
        throw new Error("Failed to insert enrollment");
      }

      expect(enrollment.status).toBe("active");
      expect(enrollment.childId).toBe(testChildId);
      expect(enrollment.curriculumId).toBe(testCurriculumId);

      // Attempting another active enrollment for the same child and curriculum must fail
      await expect(
        db.insert(curriculumEnrollments).values({
          childId: testChildId,
          curriculumId: testCurriculumId,
          status: "active",
        })
      ).rejects.toThrow();
    });

    it("tracks curriculum item progress linked to child and enrollment", async () => {
      const [enrollment] = await db
        .insert(curriculumEnrollments)
        .values({
          childId: testChildId,
          curriculumId: testCurriculumId,
          status: "active",
        })
        .returning();
      if (!enrollment) {
        throw new Error("Failed to insert enrollment");
      }

      const [item] = await db
        .insert(curriculumItems)
        .values({
          curriculumId: testCurriculumId,
          weekNo: 1,
          sessionNo: 1,
          position: 1,
          entityType: "lesson",
          entityId: 1001,
          isRequired: true,
        })
        .returning();
      if (!item) {
        throw new Error("Failed to insert item");
      }

      const [progress] = await db
        .insert(curriculumItemProgress)
        .values({
          enrollmentId: enrollment.id,
          childId: testChildId,
          curriculumItemId: item.id,
          status: "completed",
          completedAt: new Date(),
        })
        .returning();
      if (!progress) {
        throw new Error("Failed to insert progress");
      }

      expect(progress.status).toBe("completed");
      expect(progress.completedAt).toBeDefined();
    });
  });
});

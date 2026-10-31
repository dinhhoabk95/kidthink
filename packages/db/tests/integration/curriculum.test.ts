import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "#src/index";
import { childProfiles } from "#src/schema/child";
import {
  curricula,
  curriculumEnrollments,
  curriculumItemProgress,
  curriculumItems,
} from "#src/schema/curriculum";
import { gameLevels } from "#src/schema/game";
import { users } from "#src/schema/identity";

describe("Curriculum Schema Integration Tests", () => {
  async function getUniqueCurriculumCode() {
    const db = getOwnerDb();
    while (true) {
      const candidate = `CUR-${String(Math.floor(1000 + Math.random() * 8999))}`;
      const [existing] = await db
        .select({ id: curricula.id })
        .from(curricula)
        .where(eq(curricula.code, candidate))
        .limit(1);
      if (!existing) {
        return candidate;
      }
    }
  }

  async function getUniqueGameLevelCode() {
    const db = getOwnerDb();
    while (true) {
      const candidate = `GL-C1-NUM-DRAG-${String(Math.floor(1000 + Math.random() * 8999))}`;
      const [existing] = await db
        .select({ id: gameLevels.id })
        .from(gameLevels)
        .where(eq(gameLevels.code, candidate))
        .limit(1);
      if (!existing) {
        return candidate;
      }
    }
  }

  it("orphan curriculum_items.(entity_type, entity_id) polymorphic check", async () => {
    const db = getOwnerDb();
    const curCode = await getUniqueCurriculumCode();

    const [cur] = await db
      .insert(curricula)
      .values({
        code: curCode,
        title: "Lộ trình Test",
        accessTier: "free",
      })
      .returning();
    if (!cur) {
      throw new Error("Failed to insert cur");
    }

    const [item] = await db
      .insert(curriculumItems)
      .values({
        curriculumId: cur.id,
        weekNo: 1,
        sessionNo: 1,
        position: 1,
        entityType: "game_level",
        entityId: 999_111_222,
      })
      .returning();
    if (!item) {
      throw new Error("Failed to insert item");
    }

    expect(item).toBeDefined();
    expect(item.entityId).toBe(999_111_222);
  });

  it("BR-SCT-06: curriculum_items references game_levels.id directly via entity_id", async () => {
    const db = getOwnerDb();

    const gtCode = "GT-001";
    const glCode = await getUniqueGameLevelCode();

    const [gl] = await db
      .insert(gameLevels)
      .values({
        code: glCode,
        templateCode: gtCode,
        title: "Version 1",
        contentPack: { v: 1 },
        difficultyParams: { speed: 1 },
        accessTier: "free",
      })
      .returning();
    if (!gl) {
      throw new Error("Failed to insert gl");
    }

    const curCode = await getUniqueCurriculumCode();
    const [cur] = await db
      .insert(curricula)
      .values({
        code: curCode,
        title: "Curriculum Direct Entity Test",
        accessTier: "free",
      })
      .returning();
    if (!cur) {
      throw new Error("Failed to insert cur");
    }

    const [item] = await db
      .insert(curriculumItems)
      .values({
        curriculumId: cur.id,
        weekNo: 1,
        sessionNo: 1,
        position: 1,
        entityType: "game_level",
        entityId: gl.id,
      })
      .returning();
    if (!item) {
      throw new Error("Failed to insert item");
    }

    const [levelBefore] = await db
      .select()
      .from(gameLevels)
      .where(eq(gameLevels.id, item.entityId));

    expect(levelBefore?.title).toBe("Version 1");

    await db
      .update(gameLevels)
      .set({
        title: "Version 2 (Updated)",
        contentPack: { v: 2 },
        difficultyParams: { speed: 2 },
      })
      .where(eq(gameLevels.id, gl.id));

    const [levelAfter] = await db
      .select()
      .from(gameLevels)
      .where(eq(gameLevels.id, item.entityId));

    expect(levelAfter?.title).toBe("Version 2 (Updated)");
  });

  it("D-MB: rejects two active enrollments for the same child profile via unique partial index", async () => {
    const db = getOwnerDb();
    const uid = Math.floor(Math.random() * 800_000) + 100_000;
    const curCode1 = `CUR-${uid}-1`;
    const curCode2 = `CUR-${uid}-2`;

    // Create user and child
    const [user] = await db
      .insert(users)
      .values({
        email: `test-cur-enroll-${uid}@example.com`,
        displayName: "Parent Tester",
        status: "active",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: user.id,
        displayName: "Bé Test",
        birthYear: 2021,
        avatarId: "panda",
      })
      .returning();
    if (!child) {
      throw new Error("Failed to insert child");
    }

    const [cur1] = await db
      .insert(curricula)
      .values({
        code: curCode1,
        title: "Lộ trình 1",
        accessTier: "free",
      })
      .returning();
    if (!cur1) {
      throw new Error("Failed to insert cur1");
    }

    const [cur2] = await db
      .insert(curricula)
      .values({
        code: curCode2,
        title: "Lộ trình 2",
        accessTier: "free",
      })
      .returning();
    if (!cur2) {
      throw new Error("Failed to insert cur2");
    }

    // First active enrollment succeeds
    await db.insert(curriculumEnrollments).values({
      childId: child.id,
      curriculumId: cur1.id,
      status: "active",
    });

    // Second active enrollment for same child fails (D-MB)
    await expect(
      db.insert(curriculumEnrollments).values({
        childId: child.id,
        curriculumId: cur2.id,
        status: "active",
      })
    ).rejects.toThrow();
  });

  it("D-MC: curriculum_item_progress enforces unique (enrollment_id, curriculum_item_id) for idempotency", async () => {
    const db = getOwnerDb();
    const uid = Math.floor(Math.random() * 800_000) + 100_000;
    const curCode = `CUR-${uid}`;

    const [user] = await db
      .insert(users)
      .values({
        email: `test-cur-prog-${uid}@example.com`,
        displayName: "Parent Progress Tester",
        status: "active",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: user.id,
        displayName: "Bé Progress",
        birthYear: 2021,
        avatarId: "panda",
      })
      .returning();
    if (!child) {
      throw new Error("Failed to insert child");
    }

    const [cur] = await db
      .insert(curricula)
      .values({
        code: curCode,
        title: "Lộ trình Tiến độ",
        accessTier: "free",
      })
      .returning();
    if (!cur) {
      throw new Error("Failed to insert cur");
    }

    const [item] = await db
      .insert(curriculumItems)
      .values({
        curriculumId: cur.id,
        weekNo: 1,
        sessionNo: 1,
        position: 1,
        entityType: "game_level",
        entityId: uid + 2,
      })
      .returning();
    if (!item) {
      throw new Error("Failed to insert item");
    }

    const [enrollment] = await db
      .insert(curriculumEnrollments)
      .values({
        childId: child.id,
        curriculumId: cur.id,
        status: "active",
      })
      .returning();
    if (!enrollment) {
      throw new Error("Failed to insert enrollment");
    }

    // First progress insert
    await db.insert(curriculumItemProgress).values({
      enrollmentId: enrollment.id,
      childId: child.id,
      curriculumItemId: item.id,
      status: "completed",
      completedAt: new Date(),
    });

    // Duplicate progress insert violates unique constraint
    await expect(
      db.insert(curriculumItemProgress).values({
        enrollmentId: enrollment.id,
        childId: child.id,
        curriculumItemId: item.id,
        status: "completed",
        completedAt: new Date(),
      })
    ).rejects.toThrow();
  });
});

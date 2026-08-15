import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "../../src/index.ts";
import { childProfiles } from "../../src/schema/child.ts";
import {
  curricula,
  curriculumEnrollments,
  curriculumItemProgress,
  curriculumItems,
} from "../../src/schema/curriculum.ts";
import { gameLevels, gameTemplates } from "../../src/schema/game.ts";
import { users } from "../../src/schema/identity.ts";

describe("Curriculum Schema Integration Tests", () => {
  it("orphan curriculum_items.(entity_type, entity_id) polymorphic check", async () => {
    const db = getOwnerDb();
    const curCode = `CUR-${(Math.floor(Math.random() * 800) + 100).toString()}`;
    await db.delete(curricula).where(eq(curricula.code, curCode));

    const [cur] = await db
      .insert(curricula)
      .values({
        entityId: 1,
        code: curCode,
        contentVersion: 1,
        titleVi: "Lộ trình Test",
        accessTier: "free",
        status: "draft",
      })
      .returning();

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

    expect(item).toBeDefined();
    expect(item.entityId).toBe(999_111_222);
  });

  it("BR-SCT-06: curriculum_items references entity_id (lineage anchor) so it sees new published versions automatically", async () => {
    const db = getOwnerDb();

    // 1. Create Game Template & Published Game Level Version 1
    const gtCode = `GT-${(Math.floor(Math.random() * 899) + 100).toString()}`;
    const [gtInserted] = await db
      .insert(gameTemplates)
      .values({
        code: gtCode,
        nameVi: "Template Lineage Test",
        mechanic: "drag_drop",
      })
      .onConflictDoNothing()
      .returning();

    const gtId = gtInserted
      ? gtInserted.id
      : (
          await db
            .select()
            .from(gameTemplates)
            .where(eq(gameTemplates.code, gtCode))
        )[0].id;

    const seq = (Math.floor(Math.random() * 9000) + 1000).toString();
    const glCode = `GL-C1-NUM-DRAG-${seq}`;
    const lineageAnchorEntityId = Math.floor(Math.random() * 900_000) + 100_000;

    await db.delete(gameLevels).where(eq(gameLevels.code, glCode));

    const [glV1] = await db
      .insert(gameLevels)
      .values({
        entityId: lineageAnchorEntityId,
        code: glCode,
        contentVersion: 1,
        templateId: gtId,
        titleVi: "Version 1",
        contentPack: { v: 1 },
        difficultyParams: { speed: 1 },
        accessTier: "free",
        status: "published",
      })
      .returning();

    // 2. Create Curriculum and Curriculum Item pointing to lineage anchor
    const curCode = `CUR-${(Math.floor(Math.random() * 800) + 100).toString()}`;
    await db.delete(curricula).where(eq(curricula.code, curCode));
    const [cur] = await db
      .insert(curricula)
      .values({
        entityId: 10,
        code: curCode,
        contentVersion: 1,
        titleVi: "Curriculum Lineage Test",
        accessTier: "free",
        status: "published",
      })
      .returning();

    const [item] = await db
      .insert(curriculumItems)
      .values({
        curriculumId: cur.id,
        weekNo: 1,
        sessionNo: 1,
        position: 1,
        entityType: "game_level",
        entityId: lineageAnchorEntityId,
      })
      .returning();

    // Query published game level version for curriculum item before update -> returns V1
    const [publishedBefore] = await db
      .select()
      .from(gameLevels)
      .where(eq(gameLevels.entityId, item.entityId));

    expect(publishedBefore.titleVi).toBe("Version 1");

    // 3. Archive V1 and create Published Game Level Version 2 with same lineageAnchorEntityId
    await db
      .update(gameLevels)
      .set({ status: "archived" })
      .where(eq(gameLevels.id, glV1.id));

    await db.insert(gameLevels).values({
      entityId: lineageAnchorEntityId,
      code: glCode,
      contentVersion: 2,
      templateId: gtId,
      titleVi: "Version 2 (New Published)",
      contentPack: { v: 2 },
      difficultyParams: { speed: 2 },
      accessTier: "free",
      status: "published",
    });

    // Query published game level for curriculum item -> automatically sees Version 2 without changing curriculum_items.entity_id!
    const latestPublished = (
      await db
        .select()
        .from(gameLevels)
        .where(eq(gameLevels.entityId, item.entityId))
    ).find((g) => g.status === "published");

    expect(latestPublished?.titleVi).toBe("Version 2 (New Published)");
  });

  it("D-MB: rejects two active enrollments for the same child profile via unique partial index", async () => {
    const db = getOwnerDb();
    const uid = Math.floor(Math.random() * 800_000) + 100_000;
    const curCode1 = `CUR-${(Math.floor(Math.random() * 800) + 100).toString()}`;
    const curCode2 = `CUR-${(Math.floor(Math.random() * 800) + 100).toString()}`;

    // Create user and child
    const [user] = await db
      .insert(users)
      .values({
        email: `test-cur-enroll-${uid}@example.com`,
        displayName: "Parent Tester",
        status: "active",
      })
      .returning();

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: user.id,
        displayName: "Bé Test",
        birthYear: 2021,
        avatarId: "panda",
      })
      .returning();

    const [cur1] = await db
      .insert(curricula)
      .values({
        entityId: uid,
        code: curCode1,
        contentVersion: 1,
        titleVi: "Lộ trình 1",
        accessTier: "free",
        status: "published",
      })
      .returning();

    const [cur2] = await db
      .insert(curricula)
      .values({
        entityId: uid + 1,
        code: curCode2,
        contentVersion: 1,
        titleVi: "Lộ trình 2",
        accessTier: "free",
        status: "published",
      })
      .returning();

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

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: user.id,
        displayName: "Bé Progress",
        birthYear: 2021,
        avatarId: "panda",
      })
      .returning();

    const [cur] = await db
      .insert(curricula)
      .values({
        entityId: uid,
        code: curCode,
        contentVersion: 1,
        titleVi: "Lộ trình Tiến độ",
        accessTier: "free",
        status: "published",
      })
      .returning();

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

    const [enrollment] = await db
      .insert(curriculumEnrollments)
      .values({
        childId: child.id,
        curriculumId: cur.id,
        status: "active",
      })
      .returning();

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

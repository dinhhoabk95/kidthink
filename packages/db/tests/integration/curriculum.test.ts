import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "../../src/index.ts";
import { curricula, curriculumItems } from "../../src/schema/curriculum.ts";
import { gameLevels, gameTemplates } from "../../src/schema/game.ts";

describe("Curriculum Schema Integration Tests", () => {
  it("orphan curriculum_items.(entity_type, entity_id) polymorphic check", async () => {
    const db = getOwnerDb();
    const curCode = `CUR-${(Math.floor(Math.random() * 800) + 100).toString()}`;

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

    // 1. Create Game Template & Published Game Level Version 1 (entity_id = 700)
    const gtCode = `GT-${((Date.now() % 900) + 100).toString()}`;
    const [gt] = await db
      .insert(gameTemplates)
      .values({
        code: gtCode,
        nameVi: "Template Lineage Test",
        mechanic: "drag_drop",
      })
      .returning();

    const glCode = "GL-C1-NUM-DRAG-9999";
    const lineageAnchorEntityId = 700;

    const [glV1] = await db
      .insert(gameLevels)
      .values({
        entityId: lineageAnchorEntityId,
        code: glCode,
        contentVersion: 1,
        templateId: gt.id,
        titleVi: "Version 1",
        contentPack: { v: 1 },
        difficultyParams: { speed: 1 },
        accessTier: "free",
        status: "published",
      })
      .returning();

    // 2. Create Curriculum and Curriculum Item pointing to lineage anchor (entity_id = 700)
    const curCode = `CUR-${(Math.floor(Math.random() * 800) + 100).toString()}`;
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

    // 3. Archive V1 and create Published Game Level Version 2 with same lineageAnchorEntityId (700)
    await db
      .update(gameLevels)
      .set({ status: "archived" })
      .where(eq(gameLevels.id, glV1.id));

    await db.insert(gameLevels).values({
      entityId: lineageAnchorEntityId,
      code: glCode,
      contentVersion: 2,
      templateId: gt.id,
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
});

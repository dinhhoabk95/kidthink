import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "../../src/index.ts";
import { gameLevels, gameTemplates } from "../../src/schema/game.ts";

describe("Game Schema Integration Tests", () => {
  async function getUniqueGameLevelCode(prefix = "GL-C1-NUM-DRAG") {
    const db = getOwnerDb();
    while (true) {
      const code = `${prefix}-${Math.floor(1000 + Math.random() * 8999)}`;
      const [existing] = await db
        .select({ id: gameLevels.id })
        .from(gameLevels)
        .where(eq(gameLevels.code, code))
        .limit(1);
      if (!existing) {
        return code;
      }
    }
  }

  async function getUniqueGameTemplateCode() {
    const db = getOwnerDb();
    while (true) {
      const code = `GT-${Math.floor(100 + Math.random() * 899)}`;
      const [existing] = await db
        .select({ id: gameTemplates.id })
        .from(gameTemplates)
        .where(eq(gameTemplates.code, code))
        .limit(1);
      if (!existing) {
        return code;
      }
    }
  }

  it("access_tier has no default and rejects omitted value", async () => {
    const db = getOwnerDb();
    const gtCode = await getUniqueGameTemplateCode();
    const code = await getUniqueGameLevelCode();

    const [gt] = await db
      .insert(gameTemplates)
      .values({
        code: gtCode,
        nameVi: "Template Test 1",
        mechanic: "drag_drop",
      })
      .onConflictDoNothing()
      .returning();

    const gtId = gt
      ? gt.id
      : (
          await db
            .select()
            .from(gameTemplates)
            .where(eq(gameTemplates.code, gtCode))
        )[0].id;

    // Inserting gameLevel without access_tier must fail NOT NULL constraint
    await expect(
      // @ts-expect-error testing missing access_tier
      db.insert(gameLevels).values({
        entityId: 1,
        code,
        contentVersion: 1,
        templateId: gtId,
        titleVi: "Level Test",
        contentPack: { test: true },
        difficultyParams: { speed: 1 },
        status: "draft",
      })
    ).rejects.toThrow();
  });

  it("BR-SCT-03: partial unique index enforces only one published version per code", async () => {
    const db = getOwnerDb();
    const gtCode = await getUniqueGameTemplateCode();
    const code = await getUniqueGameLevelCode();

    const [gt] = await db
      .insert(gameTemplates)
      .values({
        code: gtCode,
        nameVi: "Template Test 2",
        mechanic: "drag_drop",
      })
      .onConflictDoNothing()
      .returning();

    const gtId = gt
      ? gt.id
      : (
          await db
            .select()
            .from(gameTemplates)
            .where(eq(gameTemplates.code, gtCode))
        )[0].id;

    // 1. Insert version 1 published
    const [gl1] = await db
      .insert(gameLevels)
      .values({
        entityId: 100,
        code,
        contentVersion: 1,
        templateId: gtId,
        titleVi: "Level V1",
        contentPack: { test: true },
        difficultyParams: { speed: 1 },
        accessTier: "free",
        status: "published",
      })
      .returning();

    expect(gl1).toBeDefined();

    // 2. Insert version 2 published with SAME code -> must fail partial unique index
    await expect(
      db.insert(gameLevels).values({
        entityId: 100,
        code,
        contentVersion: 2,
        templateId: gtId,
        titleVi: "Level V2",
        contentPack: { test: true },
        difficultyParams: { speed: 2 },
        accessTier: "free",
        status: "published",
      })
    ).rejects.toThrow();
  });

  it("BR-SCT-05: trigger prevents UPDATE on published game_levels row", async () => {
    const db = getOwnerDb();
    const gtCode = await getUniqueGameTemplateCode();
    const code = await getUniqueGameLevelCode();

    const [gt] = await db
      .insert(gameTemplates)
      .values({
        code: gtCode,
        nameVi: "Template Test 3",
        mechanic: "drag_drop",
      })
      .onConflictDoNothing()
      .returning();

    const gtId = gt
      ? gt.id
      : (
          await db
            .select()
            .from(gameTemplates)
            .where(eq(gameTemplates.code, gtCode))
        )[0].id;

    const [gl] = await db
      .insert(gameLevels)
      .values({
        entityId: Math.floor(Math.random() * 800_000) + 100_000,
        code,
        contentVersion: 1,
        templateId: gtId,
        titleVi: "Original Published Title",
        contentPack: { test: true },
        difficultyParams: { speed: 1 },
        accessTier: "free",
        status: "published",
      })
      .returning();

    expect(gl).toBeDefined();

    // Attempting UPDATE on published row must fail due to trigger BR-SCT-05
    await expect(
      db
        .update(gameLevels)
        .set({ titleVi: "Modified Title" })
        .where(eq(gameLevels.id, gl.id))
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as { message?: string; cause?: { message?: string } };
      const fullText = (e.message ?? "") + (e.cause?.message ?? "");
      return fullText.includes("BR-SCT-05");
    });
  });
});

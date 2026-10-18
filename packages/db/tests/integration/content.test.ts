import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "#src/index";
import { contentImages } from "#src/schema/assets";
import { activities, lessons, worksheets } from "#src/schema/content";
import { curricula } from "#src/schema/curriculum";
import { gameLevels } from "#src/schema/game";

interface DbTriggerError {
  message?: string;
  cause?: { message?: string };
}

function hasPublishedImmutableError(err: DbTriggerError): boolean {
  const msg = `${err.message ?? ""} ${err.cause?.message ?? ""}`;
  return msg.includes("BR-CLC-01") && msg.includes("BR-SCT-05");
}

describe("Content Schema Integration Tests", () => {
  it("orphan content_images.(owner_type, owner_id) polymorphic check", async () => {
    const db = getOwnerDb();

    const [img] = await db
      .insert(contentImages)
      .values({
        ownerType: "lesson",
        ownerId: 999_888_777,
        storagePath: "/images/test.png",
        altText: "Ảnh test",
      })
      .returning();
    if (!img) {
      throw new Error("Failed to insert img");
    }

    expect(img).toBeDefined();
    expect(img.ownerId).toBe(999_888_777);
  });

  it("orphan activities.(ref_type, ref_id) polymorphic check", async () => {
    const db = getOwnerDb();
    let act: typeof activities.$inferSelect | undefined;
    for (let attempt = 0; attempt < 50; attempt++) {
      const code = `ACT-${(Math.floor(Math.random() * 9000) + 1000).toString()}`;
      const [created] = await db
        .insert(activities)
        .values({
          entityId: Math.floor(100_000 + Math.random() * 800_000),
          code,
          contentVersion: 1,
          kind: "digital_game",
          title: "Activity Test",
          refType: "game_level",
          refId: 666_555_444,
          accessTier: "free",
          status: "draft",
        })
        .onConflictDoNothing()
        .returning();
      if (created) {
        act = created;
        break;
      }
    }
    if (!act) {
      throw new Error("Failed to insert act");
    }

    expect(act).toBeDefined();
    expect(act.refId).toBe(666_555_444);
  });

  it("BR-CLC-01 / BR-SCT-05: trigger prevents UPDATE on published game_levels, lessons, activities, curricula, and worksheets except transition to archived", async () => {
    const db = getOwnerDb();

    // 1. Published game_level
    let gl: typeof gameLevels.$inferSelect | undefined;
    for (let attempt = 0; attempt < 50; attempt++) {
      const glCode = `GL-C1-CNT-ONE-${(Math.floor(Math.random() * 9000) + 1000).toString()}`;
      const [created] = await db
        .insert(gameLevels)
        .values({
          entityId: Math.floor(100_000 + Math.random() * 800_000),
          code: glCode,
          contentVersion: 1,
          templateCode: "GT-001",
          title: "Game Level Published",
          contentPack: {},
          difficultyParams: {},
          accessTier: "free",
          status: "published",
        })
        .onConflictDoNothing()
        .returning();
      if (created) {
        gl = created;
        break;
      }
    }
    if (!gl) {
      throw new Error("Failed to insert gl");
    }

    await expect(
      db
        .update(gameLevels)
        .set({ title: "Changed" })
        .where(eq(gameLevels.id, gl.id))
    ).rejects.toSatisfy(hasPublishedImmutableError);

    await expect(
      db
        .update(gameLevels)
        .set({ status: "archived", title: "Changed while archiving" })
        .where(eq(gameLevels.id, gl.id))
    ).rejects.toSatisfy(hasPublishedImmutableError);

    const [archivedGl] = await db
      .update(gameLevels)
      .set({ status: "archived" })
      .where(eq(gameLevels.id, gl.id))
      .returning();
    expect(archivedGl?.status).toBe("archived");

    // 2. Published lesson
    let les: typeof lessons.$inferSelect | undefined;
    for (let attempt = 0; attempt < 50; attempt++) {
      const lesCode = `LES-${(Math.floor(Math.random() * 9000) + 1000).toString()}`;
      const [created] = await db
        .insert(lessons)
        .values({
          entityId: Math.floor(100_000 + Math.random() * 800_000),
          code: lesCode,
          contentVersion: 1,
          title: "Lesson Published",
          accessTier: "free",
          status: "published",
        })
        .onConflictDoNothing()
        .returning();
      if (created) {
        les = created;
        break;
      }
    }
    if (!les) {
      throw new Error("Failed to insert les");
    }

    await expect(
      db.update(lessons).set({ title: "Changed" }).where(eq(lessons.id, les.id))
    ).rejects.toSatisfy(hasPublishedImmutableError);

    // 3. Published activity
    let act: typeof activities.$inferSelect | undefined;
    for (let attempt = 0; attempt < 50; attempt++) {
      const actCode = `ACT-${(Math.floor(Math.random() * 9000) + 1000).toString()}`;
      const [created] = await db
        .insert(activities)
        .values({
          entityId: Math.floor(100_000 + Math.random() * 800_000),
          code: actCode,
          contentVersion: 1,
          kind: "manipulative",
          title: "Activity Published",
          accessTier: "free",
          status: "published",
        })
        .onConflictDoNothing()
        .returning();
      if (created) {
        act = created;
        break;
      }
    }
    if (!act) {
      throw new Error("Failed to insert act");
    }

    expect(act).toBeDefined();
    await expect(
      db
        .update(activities)
        .set({ title: "Changed" })
        .where(eq(activities.id, act.id))
    ).rejects.toSatisfy(hasPublishedImmutableError);

    // 4. Published curriculum
    let cur: typeof curricula.$inferSelect | undefined;
    for (let attempt = 0; attempt < 50; attempt++) {
      const curCode = `CUR-${(Math.floor(Math.random() * 9000) + 1000).toString()}`;
      const [created] = await db
        .insert(curricula)
        .values({
          entityId: Math.floor(100_000 + Math.random() * 800_000),
          code: curCode,
          contentVersion: 1,
          title: "Curriculum Published",
          accessTier: "free",
          status: "published",
        })
        .onConflictDoNothing()
        .returning();
      if (created) {
        cur = created;
        break;
      }
    }
    if (!cur) {
      throw new Error("Failed to insert cur");
    }

    await expect(
      db
        .update(curricula)
        .set({ title: "Changed" })
        .where(eq(curricula.id, cur.id))
    ).rejects.toSatisfy(hasPublishedImmutableError);

    const [archivedCur] = await db
      .update(curricula)
      .set({ status: "archived" })
      .where(eq(curricula.id, cur.id))
      .returning();
    expect(archivedCur?.status).toBe("archived");

    // 5. Published worksheet
    let ws: typeof worksheets.$inferSelect | undefined;
    for (let attempt = 0; attempt < 50; attempt++) {
      const wsCode = `WS-${(Math.floor(Math.random() * 9000) + 1000).toString()}`;
      const [created] = await db
        .insert(worksheets)
        .values({
          entityId: Math.floor(100_000 + Math.random() * 800_000),
          code: wsCode,
          contentVersion: 1,
          title: "Worksheet Published",
          accessTier: "free",
          status: "published",
        })
        .onConflictDoNothing()
        .returning();
      if (created) {
        ws = created;
        break;
      }
    }
    if (!ws) {
      throw new Error("Failed to insert ws");
    }

    await expect(
      db
        .update(worksheets)
        .set({ title: "Changed" })
        .where(eq(worksheets.id, ws.id))
    ).rejects.toSatisfy(hasPublishedImmutableError);
  });
});

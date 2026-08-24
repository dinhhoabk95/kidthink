import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "#src/index";
import { contentImages } from "#src/schema/assets";
import { activities, lessons, worksheets } from "#src/schema/content";

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

    expect(img).toBeDefined();
    expect(img.ownerId).toBe(999_888_777);
  });

  it("orphan activities.(ref_type, ref_id) polymorphic check", async () => {
    const db = getOwnerDb();
    let act: any;
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

    expect(act).toBeDefined();
    expect(act.refId).toBe(666_555_444);
  });

  it("BR-SCT-05: trigger prevents UPDATE on published lessons, activities, and worksheets", async () => {
    const db = getOwnerDb();

    // 1. Published lesson
    let les: any;
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

    await expect(
      db.update(lessons).set({ title: "Changed" }).where(eq(lessons.id, les.id))
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as { message?: string; cause?: { message?: string } };
      return ((e.message ?? "") + (e.cause?.message ?? "")).includes(
        "BR-SCT-05"
      );
    });

    // 2. Published activity
    let act: any;
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

    expect(act).toBeDefined();
    await expect(
      db
        .update(activities)
        .set({ title: "Changed" })
        .where(eq(activities.id, act.id))
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as { message?: string; cause?: { message?: string } };
      return ((e.message ?? "") + (e.cause?.message ?? "")).includes(
        "BR-SCT-05"
      );
    });

    // 3. Published worksheet
    let ws: any;
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

    await expect(
      db
        .update(worksheets)
        .set({ title: "Changed" })
        .where(eq(worksheets.id, ws.id))
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as { message?: string; cause?: { message?: string } };
      return ((e.message ?? "") + (e.cause?.message ?? "")).includes(
        "BR-SCT-05"
      );
    });
  });
});

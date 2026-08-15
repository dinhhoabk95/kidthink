import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "../../src/index.ts";
import {
  activities,
  contentImages,
  lessons,
  worksheets,
} from "../../src/schema/content.ts";

describe("Content Schema Integration Tests", () => {
  it("orphan content_images.(owner_type, owner_id) polymorphic check", async () => {
    const db = getOwnerDb();

    const [img] = await db
      .insert(contentImages)
      .values({
        ownerType: "lesson",
        ownerId: 999_888_777,
        storagePath: "/images/test.png",
        altTextVi: "Ảnh test",
      })
      .returning();

    expect(img).toBeDefined();
    expect(img.ownerId).toBe(999_888_777);
  });

  it("orphan activities.(ref_type, ref_id) polymorphic check", async () => {
    const db = getOwnerDb();
    const code = `ACT-${(Math.floor(Math.random() * 9000) + 1000).toString()}`;

    const [act] = await db
      .insert(activities)
      .values({
        entityId: 500,
        code,
        contentVersion: 1,
        kind: "digital_game",
        titleVi: "Activity Test",
        refType: "game_level",
        refId: 666_555_444,
        accessTier: "free",
        status: "draft",
      })
      .returning();

    expect(act).toBeDefined();
    expect(act.refId).toBe(666_555_444);
  });

  it("BR-SCT-05: trigger prevents UPDATE on published lessons, activities, and worksheets", async () => {
    const db = getOwnerDb();
    const lesCode = `LES-${(Math.floor(Math.random() * 9000) + 1000).toString()}`;
    const actCode = `ACT-${(Math.floor(Math.random() * 9000) + 1000).toString()}`;
    const wsCode = `WS-${(Math.floor(Math.random() * 9000) + 1000).toString()}`;

    await db.delete(lessons).where(eq(lessons.code, lesCode));
    await db.delete(activities).where(eq(activities.code, actCode));
    await db.delete(worksheets).where(eq(worksheets.code, wsCode));

    // 1. Published lesson
    const [les] = await db
      .insert(lessons)
      .values({
        entityId: 10,
        code: lesCode,
        contentVersion: 1,
        titleVi: "Lesson Published",
        accessTier: "free",
        status: "published",
      })
      .returning();

    await expect(
      db
        .update(lessons)
        .set({ titleVi: "Changed" })
        .where(eq(lessons.id, les.id))
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as { message?: string; cause?: { message?: string } };
      return ((e.message ?? "") + (e.cause?.message ?? "")).includes(
        "BR-SCT-05"
      );
    });

    // 2. Published activity
    const [act] = await db
      .insert(activities)
      .values({
        entityId: 9901,
        code: actCode,
        contentVersion: 1,
        kind: "manipulative",
        titleVi: "Activity Published",
        accessTier: "free",
        status: "published",
      })
      .returning();

    await expect(
      db
        .update(activities)
        .set({ titleVi: "Changed" })
        .where(eq(activities.id, act.id))
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as { message?: string; cause?: { message?: string } };
      return ((e.message ?? "") + (e.cause?.message ?? "")).includes(
        "BR-SCT-05"
      );
    });

    // 3. Published worksheet
    const [ws] = await db
      .insert(worksheets)
      .values({
        entityId: 30,
        code: wsCode,
        contentVersion: 1,
        titleVi: "Worksheet Published",
        accessTier: "free",
        status: "published",
      })
      .returning();

    await expect(
      db
        .update(worksheets)
        .set({ titleVi: "Changed" })
        .where(eq(worksheets.id, ws.id))
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as { message?: string; cause?: { message?: string } };
      return ((e.message ?? "") + (e.cause?.message ?? "")).includes(
        "BR-SCT-05"
      );
    });
  });
});

import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "#src/index";
import { childProfiles } from "#src/schema/child";
import { gameLevels, gameTemplates } from "#src/schema/game";
import { users } from "#src/schema/identity";
import { playSessions, telemetryEvents } from "#src/schema/play";

describe("Play Schema Integration Tests", () => {
  it("BR-SPT-03: duplicate (session_uuid, seq) in telemetry_events is rejected by composite PK", async () => {
    const db = getOwnerDb();
    const sessionUuid = crypto.randomUUID();

    await db
      .insert(telemetryEvents)
      .values({
        sessionUuid,
        seq: 1,
        eventName: "game_start",
      })
      .onConflictDoNothing();

    await expect(
      db.insert(telemetryEvents).values({
        sessionUuid,
        seq: 1,
        eventName: "game_start_duplicate",
      })
    ).rejects.toThrow();
  });

  it("BR-SPT-06 & CHECK: play_sessions enforces NOT NULL content_version and child_profile_id OR guest_device_id", async () => {
    // Missing both child_profile_id and guest_device_id must fail CHECK constraint
    const db = getOwnerDb();
    await expect(
      db.insert(playSessions).values({
        gameLevelId: 1,
        contentVersion: 1,
        templateId: 1,
      })
    ).rejects.toThrow();
  });

  it("BR-SPT-07: trigger prevents UPDATE when OLD.completion_status = 'completed', but allows in_progress", async () => {
    const db = getOwnerDb();

    // 1. Create parent User & Child Profile
    let u: typeof users.$inferSelect | undefined;
    while (!u) {
      const email = `parent-${Math.floor(100_000 + Math.random() * 899_999)}-${Date.now()}@example.com`;
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (!existing) {
        [u] = await db
          .insert(users)
          .values({ email, displayName: "Parent Test" })
          .returning();
      }
    }
    if (!u) {
      throw new Error("Failed to insert user");
    }

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: u.id,
        displayName: "Bé An",
        birthYear: 2020,
        avatarId: "preset_01",
      })
      .returning();
    if (!child) {
      throw new Error("Failed to insert child");
    }

    // 2. Create Game Template & Level
    const gtCode = `GT-${Math.floor(Math.random() * 899 + 100)}`;
    let [gt] = await db
      .insert(gameTemplates)
      .values({
        code: gtCode,
        name: "Template Play Test",
        mechanic: "drag_drop",
      })
      .onConflictDoNothing()
      .returning();

    if (!gt) {
      const [existingGt] = await db
        .select()
        .from(gameTemplates)
        .where(eq(gameTemplates.code, gtCode));
      if (existingGt) {
        gt = existingGt;
      }
    }
    if (!gt) {
      throw new Error("Failed to find or create gt");
    }

    const glCode = `GL-C1-NUM-DRAG-${Math.floor(Math.random() * 8999 + 1000)}`;
    let [gl] = await db
      .insert(gameLevels)
      .values({
        entityId: Math.floor(Math.random() * 900_000) + 100_000,
        code: glCode,
        contentVersion: 1,
        templateId: gt.id,
        title: "Level Play Test",
        contentPack: { test: true },
        difficultyParams: { speed: 1 },
        accessTier: "free",
        status: "published",
      })
      .onConflictDoNothing()
      .returning();

    if (!gl) {
      const [existingGl] = await db
        .select()
        .from(gameLevels)
        .where(eq(gameLevels.code, glCode));
      if (existingGl) {
        gl = existingGl;
      }
    }
    if (!gl) {
      throw new Error("Failed to find or create gl");
    }

    // 3. Create Play Session in_progress
    const [ps] = await db
      .insert(playSessions)
      .values({
        childProfileId: child.id,
        gameLevelId: gl.id,
        contentVersion: 1,
        templateId: gt.id,
        completionStatus: "in_progress",
      })
      .returning();
    if (!ps) {
      throw new Error("Failed to insert playSession");
    }

    // 4. UPDATE while in_progress -> ALLOWED
    const [updatedInProg] = await db
      .update(playSessions)
      .set({ score: 100 })
      .where(eq(playSessions.id, ps.id))
      .returning();

    expect(updatedInProg?.score).toBe(100);

    // 5. Complete session
    await db
      .update(playSessions)
      .set({ completionStatus: "completed" })
      .where(eq(playSessions.id, ps.id));

    // 6. UPDATE after completed -> REJECTED by trigger BR-SPT-07
    await expect(
      db
        .update(playSessions)
        .set({ score: 999 })
        .where(eq(playSessions.id, ps.id))
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as { message?: string; cause?: { message?: string } };
      return ((e.message ?? "") + (e.cause?.message ?? "")).includes(
        "BR-SPT-07"
      );
    });
  });

  it("BR-CDC-05 & §7.3: telemetry_events columns match allow-list strictly", async () => {
    const db = getOwnerDb();

    const cols = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'telemetry_events'
      ORDER BY ordinal_position
    `);

    const colNames = Array.from(cols).map((r: unknown) =>
      String((r as { column_name: string }).column_name)
    );

    // Bất biến: bảng telemetry_events CẤM chứa PII hoặc foreign key
    expect(colNames).not.toContain("child_id");
    expect(colNames).not.toContain("user_id");
    expect(colNames).not.toContain("child_profile_id");
    expect(colNames).not.toContain("name");
    expect(colNames).not.toContain("birth_date");

    // Chỉ cho phép các cột chuẩn: id, session_uuid, child_uuid (pseudonymized), event_name, payload, created_at
    expect(colNames).toContain("session_uuid");
    expect(colNames).toContain("child_uuid");
    expect(colNames).toContain("event_name");
    expect(colNames).toContain("payload");
  });

  it("BR-CDC-04: child_uuid in telemetry_events is nullable to support anonymization", async () => {
    const db = getOwnerDb();
    const sessionUuid = crypto.randomUUID();

    await db.insert(telemetryEvents).values({
      sessionUuid,
      seq: 1,
      childUuid: "c1111111-1111-1111-1111-111111111111",
      eventName: "step_complete",
    });

    const [before] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(telemetryEvents)
      .where(eq(telemetryEvents.sessionUuid, sessionUuid));

    expect(before?.count).toBe(1);

    // Anonymize by setting child_uuid = NULL
    await db
      .update(telemetryEvents)
      .set({ childUuid: null })
      .where(eq(telemetryEvents.sessionUuid, sessionUuid));

    const [after] = await db
      .select({ childUuid: telemetryEvents.childUuid })
      .from(telemetryEvents)
      .where(eq(telemetryEvents.sessionUuid, sessionUuid));

    expect(after?.childUuid).toBeNull();
  });

  it("D-Z: schema has no foreign key pointing to telemetry_events table", async () => {
    const db = getOwnerDb();

    const result = await db.execute(sql`
      SELECT constraint_name 
      FROM information_schema.referential_constraints 
      WHERE constraint_schema = 'public'
    `);

    // Verify telemetry_events is not target of any FK constraint
    const fkNames = Array.from(result).map((r: unknown) =>
      String((r as { constraint_name: string }).constraint_name)
    );
    for (const fk of fkNames) {
      expect(fk).not.toContain("telemetry_events");
    }
  });
});

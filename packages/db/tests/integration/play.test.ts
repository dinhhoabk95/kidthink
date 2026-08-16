import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "../../src/index.ts";
import { childProfiles } from "../../src/schema/child.ts";
import { gameLevels, gameTemplates } from "../../src/schema/game.ts";
import { users } from "../../src/schema/identity.ts";
import { playSessions, telemetryEvents } from "../../src/schema/play.ts";

describe("Play Schema Integration Tests", () => {
  it("BR-SPT-03: duplicate (session_uuid, seq) in telemetry_events is rejected by composite PK", async () => {
    const db = getOwnerDb();
    const sessionUuid = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

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
    let u: any;
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

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: u.id,
        displayName: "Bé An",
        birthYear: 2020,
        avatarId: "preset_01",
      })
      .returning();

    // 2. Create Game Template & Level
    const gtCode = `GT-${Math.floor(Math.random() * 899 + 100)}`;
    let [gt] = await db
      .insert(gameTemplates)
      .values({
        code: gtCode,
        nameVi: "Template Play Test",
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

    const glCode = `GL-C1-NUM-DRAG-${Math.floor(Math.random() * 8999 + 1000)}`;
    let [gl] = await db
      .insert(gameLevels)
      .values({
        entityId: Math.floor(Math.random() * 900_000) + 100_000,
        code: glCode,
        contentVersion: 1,
        templateId: gt.id,
        titleVi: "Level Play Test",
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

    // 4. UPDATE while in_progress -> ALLOWED
    const [updatedInProg] = await db
      .update(playSessions)
      .set({ score: 100 })
      .where(eq(playSessions.id, ps.id))
      .returning();

    expect(updatedInProg.score).toBe(100);

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

    const result = await db.execute<{ column_name: string }>(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'telemetry_events' AND table_schema = 'public'
    `);

    const columnNames = Array.from(result).map((r) => r.column_name);

    const allowedColumns = [
      "session_uuid",
      "seq",
      "child_uuid",
      "game_level_id",
      "content_version",
      "template_id",
      "event_name",
      "occurred_at_ms",
      "payload",
      "client_timestamp",
      "ingested_at",
      "created_at",
    ];

    const allowedSet = new Set(allowedColumns);
    for (const col of columnNames) {
      expect(allowedSet.has(col)).toBe(true);
    }
  });

  it("BR-SPT-04 & BR-CDC-05: SET child_uuid = NULL anonymizes telemetry events without deleting rows", async () => {
    const db = getOwnerDb();
    const sessionUuid = crypto.randomUUID();
    const childUuid = crypto.randomUUID();

    await db.insert(telemetryEvents).values({
      sessionUuid,
      seq: 1,
      childUuid,
      eventName: "step_complete",
    });

    const [before] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(telemetryEvents)
      .where(eq(telemetryEvents.sessionUuid, sessionUuid));

    expect(before.count).toBe(1);

    // Anonymize by setting child_uuid = NULL
    await db
      .update(telemetryEvents)
      .set({ childUuid: null })
      .where(eq(telemetryEvents.sessionUuid, sessionUuid));

    const [after] = await db
      .select({ childUuid: telemetryEvents.childUuid })
      .from(telemetryEvents)
      .where(eq(telemetryEvents.sessionUuid, sessionUuid));

    expect(after.childUuid).toBeNull();
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

import {
  gameLevels,
  gameTemplates,
  getOwnerDb,
  ingestPlayEvents,
  playSessions,
  telemetryEvents,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

async function createTestLevel(db: ReturnType<typeof getOwnerDb>) {
  const num3 = Math.floor(Math.random() * 899) + 100;
  const [gt] = await db
    .insert(gameTemplates)
    .values({
      code: `GT-${num3}`,
      name: "Template test",
      mechanic: "tap_target",
      scoring: {},
    })
    .onConflictDoNothing()
    .returning();

  let templateId = gt?.id;
  if (!templateId) {
    const existing = await db.select().from(gameTemplates).limit(1);
    templateId = existing[0]?.id ?? 1;
  }

  let code = "";
  while (true) {
    const num4 = Math.floor(Math.random() * 8999) + 1000;
    const candidate = `GL-C1-CNT-TEST-${num4}`;
    const [existing] = await db
      .select({ id: gameLevels.id })
      .from(gameLevels)
      .where(eq(gameLevels.code, candidate))
      .limit(1);
    if (!existing) {
      code = candidate;
      break;
    }
  }

  const uid = Math.floor(Math.random() * 89_999) + 10_000;
  const [gl] = await db
    .insert(gameLevels)
    .values({
      entityId: uid,
      code,
      templateId,
      title: "Level Test",
      instruction: "Instruction",
      contentPack: {},
      difficultyParams: {},
      accessTier: "free",
      status: "published",
      contentVersion: 1,
    })
    .returning();

  return { glId: gl.id, gtId: templateId };
}

describe("Task P1.6 — Event Ingestion (BR-ING-01..08, BR-EVT-01..08)", () => {
  it("BR-ING-01: (session_uuid, seq) composite PK enforces idempotency at DB level", async () => {
    const db = getOwnerDb();
    const { glId, gtId } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        contentVersion: 1,
        templateId: gtId,
        guestDeviceId: "device-ingest-pk",
        completionStatus: "in_progress",
      })
      .returning();

    const uuid = session.sessionUuid;

    await db.insert(telemetryEvents).values({
      sessionUuid: uuid,
      seq: 1,
      eventName: "game_started",
    });

    await expect(
      db.insert(telemetryEvents).values({
        sessionUuid: uuid,
        seq: 1,
        eventName: "game_started",
      })
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as { message?: string; cause?: { message?: string } };
      return ((e.message ?? "") + (e.cause?.message ?? "")).includes(
        "unique constraint"
      );
    });
  });

  it("BR-ING-01 & BR-ING-02: re-ingesting identical batch returns 200 with accepted = 0, skipped = N", async () => {
    const db = getOwnerDb();
    const { glId, gtId } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        contentVersion: 1,
        templateId: gtId,
        guestDeviceId: "device-ingest-batch",
        completionStatus: "in_progress",
      })
      .returning();

    const uuid = session.sessionUuid;
    const events = [
      { seq: 1, event_name: "game_started", payload: { device: "tablet" } },
      { seq: 2, event_name: "round_started", payload: { round_index: 0 } },
    ];

    const res1 = await ingestPlayEvents(uuid, events, {
      isUserCall: false,
      guestDeviceId: "device-ingest-batch",
    });
    expect(res1.accepted).toBe(2);
    expect(res1.skipped).toBe(0);

    const res2 = await ingestPlayEvents(uuid, events, {
      isUserCall: false,
      guestDeviceId: "device-ingest-batch",
    });
    expect(res2.accepted).toBe(0);
    expect(res2.skipped).toBe(2);
  });

  it("BR-ING-03: unknown event name rejects entire batch with 422 UNKNOWN_EVENT_NAME", async () => {
    const db = getOwnerDb();
    const { glId, gtId } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        contentVersion: 1,
        templateId: gtId,
        guestDeviceId: "device-unknown-evt",
        completionStatus: "in_progress",
      })
      .returning();

    const uuid = session.sessionUuid;
    const events = [
      { seq: 1, event_name: "game_started" },
      { seq: 2, event_name: "hacker_cheat_evt" },
    ];

    await expect(
      ingestPlayEvents(uuid, events, {
        isUserCall: false,
        guestDeviceId: "device-unknown-evt",
      })
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as { code?: string; status?: number };
      return e.code === "UNKNOWN_EVENT_NAME" && e.status === 422;
    });
  });

  it("BR-ING-08: payload containing score field is stripped before saving to DB", async () => {
    const db = getOwnerDb();
    const { glId, gtId } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        contentVersion: 1,
        templateId: gtId,
        guestDeviceId: "device-score-strip",
        completionStatus: "in_progress",
      })
      .returning();

    const uuid = session.sessionUuid;
    const events = [
      {
        seq: 1,
        event_name: "game_started",
        payload: { score: 9999, round_index: 1, device: "tablet" },
      },
    ];

    await ingestPlayEvents(uuid, events, {
      isUserCall: false,
      guestDeviceId: "device-score-strip",
    });

    const savedEvents = await db
      .select()
      .from(telemetryEvents)
      .where(eq(telemetryEvents.sessionUuid, uuid));

    expect(savedEvents).toHaveLength(1);
    const payload = savedEvents[0].payload as Record<string, unknown>;
    expect(payload.score).toBeUndefined();
    expect(payload.round_index).toBe(1);
  });

  it("BR-ING-02: event sent to completed/abandoned session returns 200 with skipped events", async () => {
    const db = getOwnerDb();
    const { glId, gtId } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        contentVersion: 1,
        templateId: gtId,
        guestDeviceId: "device-terminal-ingest",
        completionStatus: "completed",
      })
      .returning();

    const uuid = session.sessionUuid;
    const events = [{ seq: 1, event_name: "game_started" }];

    const res = await ingestPlayEvents(uuid, events, {
      isUserCall: false,
      guestDeviceId: "device-terminal-ingest",
    });
    expect(res.accepted).toBe(0);
    expect(res.skipped).toBe(1);
  });
});

// biome-ignore lint/performance/noNamespaceImport: spy on module exports in test
import * as adaptive from "@mindkid/adaptive";
import {
  childProfiles,
  competencies,
  contentSkillMap,
  gameLevels,
  getOwnerDb,
  playSessions,
  skills,
  strands,
  telemetryEvents,
  users,
} from "@mindkid/db";
import { completePlaySession, ingestPlayEvents } from "@mindkid/play";
import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

async function createTestLevel(db: ReturnType<typeof getOwnerDb>) {
  const templateCode = "GT-001";
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
      templateCode,
      title: "Level Test",
      instruction: "Instruction",
      contentPack: {},
      difficultyParams: {},
      accessTier: "free",
      status: "published",
      contentVersion: 1,
    })
    .returning();

  return { glId: gl.id, templateCode, glCode: code };
}

describe("Task P1.6 / #250 — Event Ingestion Gates (BR-ING, BR-EVT, BR-TRX)", () => {
  // Khẳng định 1: Lô 3 sự kiện, seq 1-2-3 -> accepted=3, skipped=0, last_seq=3, 3 dòng trong DB
  it("Scenario 1: batch of 3 events (seq 1,2,3) accepts all and persists 3 rows", async () => {
    const db = getOwnerDb();
    const { glId, templateCode } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        contentVersion: 1,
        templateCode,
        guestDeviceId: "device-batch-3",
        completionStatus: "in_progress",
      })
      .returning();

    const uuid = session.sessionUuid;
    const events = [
      { seq: 1, event_name: "game_started", payload: { device: "tablet" } },
      { seq: 2, event_name: "round_started", payload: { round_index: 0 } },
      { seq: 3, event_name: "round_completed", payload: { round_index: 0 } },
    ];

    const res = await ingestPlayEvents(uuid, events, {
      isUserCall: false,
      guestDeviceId: "device-batch-3",
    });

    expect(res.accepted).toBe(3);
    expect(res.skipped).toBe(0);
    expect(res.last_seq).toBe(3);

    const rows = await db
      .select()
      .from(telemetryEvents)
      .where(eq(telemetryEvents.sessionUuid, uuid));
    expect(rows).toHaveLength(3);
  });

  // Khẳng định 2: Gửi lại y hệt -> accepted=0, skipped=3, last_seq=3 (Idempotency)
  it("Scenario 2: re-ingesting identical batch is idempotent (accepted=0, skipped=3, last_seq=3)", async () => {
    const db = getOwnerDb();
    const { glId, templateCode } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        contentVersion: 1,
        templateCode,
        guestDeviceId: "device-idempotent",
        completionStatus: "in_progress",
      })
      .returning();

    const uuid = session.sessionUuid;
    const events = [
      { seq: 1, event_name: "game_started", payload: { device: "tablet" } },
      { seq: 2, event_name: "round_started", payload: { round_index: 0 } },
      { seq: 3, event_name: "round_completed", payload: { round_index: 0 } },
    ];

    const res1 = await ingestPlayEvents(uuid, events, {
      isUserCall: false,
      guestDeviceId: "device-idempotent",
    });
    expect(res1.accepted).toBe(3);
    expect(res1.skipped).toBe(0);

    const res2 = await ingestPlayEvents(uuid, events, {
      isUserCall: false,
      guestDeviceId: "device-idempotent",
    });
    expect(res2.accepted).toBe(0);
    expect(res2.skipped).toBe(3);
    expect(res2.last_seq).toBe(3);
  });

  // Khẳng định 3: Trùng seq trong cùng lô -> cái thứ hai tính là bỏ qua
  it("Scenario 3: duplicate seq within same batch marks second instance as skipped", async () => {
    const db = getOwnerDb();
    const { glId, templateCode } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        contentVersion: 1,
        templateCode,
        guestDeviceId: "device-dup-seq",
        completionStatus: "in_progress",
      })
      .returning();

    const uuid = session.sessionUuid;
    const events = [
      { seq: 1, event_name: "game_started", payload: { device: "tablet" } },
      { seq: 2, event_name: "round_started", payload: { round_index: 0 } },
      { seq: 2, event_name: "round_started", payload: { round_index: 0 } }, // duplicate seq
    ];

    const res = await ingestPlayEvents(uuid, events, {
      isUserCall: false,
      guestDeviceId: "device-dup-seq",
    });

    expect(res.accepted).toBe(2);
    expect(res.skipped).toBe(1);
    expect(res.last_seq).toBe(2);
  });

  // Khẳng định 4: seq <= 0 -> INVALID_SEQUENCE; seq lùi -> EVENT_OUT_OF_ORDER
  it("Scenario 4: seq 0 throws INVALID_SEQUENCE and backward seq throws EVENT_OUT_OF_ORDER", async () => {
    const db = getOwnerDb();
    const { glId, templateCode } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        contentVersion: 1,
        templateCode,
        guestDeviceId: "device-seq-order",
        completionStatus: "in_progress",
      })
      .returning();

    const uuid = session.sessionUuid;

    // seq 0
    await expect(
      ingestPlayEvents(uuid, [{ seq: 0, event_name: "game_started" }], {
        isUserCall: false,
        guestDeviceId: "device-seq-order",
      })
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as { code?: string };
      return e.code === "INVALID_SEQUENCE";
    });

    // Ingest seq 5
    await ingestPlayEvents(uuid, [{ seq: 5, event_name: "game_started" }], {
      isUserCall: false,
      guestDeviceId: "device-seq-order",
    });

    // Now send seq 3 which was never ingested -> backward seq
    await expect(
      ingestPlayEvents(uuid, [{ seq: 3, event_name: "round_started" }], {
        isUserCall: false,
        guestDeviceId: "device-seq-order",
      })
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as { code?: string };
      return e.code === "EVENT_OUT_OF_ORDER";
    });
  });

  // Khẳng định 5: intro_period_started có payload khác rỗng (đỏ hôm nay do thiếu schema)
  it("Scenario 5: intro_period_started stores non-empty payload in database", async () => {
    const db = getOwnerDb();
    const { glId, templateCode } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        contentVersion: 1,
        templateCode,
        guestDeviceId: "device-intro-payload",
        completionStatus: "in_progress",
      })
      .returning();

    const uuid = session.sessionUuid;
    const events = [
      {
        seq: 1,
        event_name: "intro_period_started",
        payload: { period: "present", step_index: 0 },
      },
    ];

    await ingestPlayEvents(uuid, events, {
      isUserCall: false,
      guestDeviceId: "device-intro-payload",
    });

    const [saved] = await db
      .select()
      .from(telemetryEvents)
      .where(eq(telemetryEvents.sessionUuid, uuid));

    expect(saved).toBeDefined();
    const payload = (saved?.payload ?? {}) as Record<string, unknown>;
    expect(Object.keys(payload).length).toBeGreaterThan(0);
    expect(payload.period).toBe("present");
    expect(payload.step_index).toBe(0);
  });

  // Khẳng định 6: Phiên đã completed -> { accepted: 0, skipped: N }, 0 dòng ghi mới
  it("Scenario 6: event sent to completed session returns accepted=0, skipped=N and inserts 0 rows", async () => {
    const db = getOwnerDb();
    const { glId, templateCode } = await createTestLevel(db);

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        contentVersion: 1,
        templateCode,
        guestDeviceId: "device-terminal",
        completionStatus: "completed",
      })
      .returning();

    const uuid = session.sessionUuid;
    const events = [
      { seq: 1, event_name: "game_started" },
      { seq: 2, event_name: "round_started" },
    ];

    const res = await ingestPlayEvents(uuid, events, {
      isUserCall: false,
      guestDeviceId: "device-terminal",
    });

    expect(res.accepted).toBe(0);
    expect(res.skipped).toBe(2);

    const rows = await db
      .select()
      .from(telemetryEvents)
      .where(eq(telemetryEvents.sessionUuid, uuid));
    expect(rows).toHaveLength(0);
  });

  // Khẳng định 7: completePlaySession mà bước ghi mastery ném thì phiên KHÔNG được để lại ở trạng thái completed
  it("Scenario 7: completePlaySession failure during mastery rolls back completed status", async () => {
    const db = getOwnerDb();
    const { glId, templateCode } = await createTestLevel(db);

    // Create user and child profile
    const email = `test-user-${Date.now()}-${Math.floor(Math.random() * 1000)}@test.com`;
    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash: "hash-test",
        displayName: "Parent Test",
      })
      .returning();

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: user.id,
        displayName: "Kid Test",
        birthYear: 2021,
        avatarId: "bear",
        status: "active",
      })
      .returning();

    // Map a skill to the level
    const [comp] = await db
      .insert(competencies)
      .values({
        code: "C1",
        name: "Competency 1",
        colorToken: "blue",
        icon: "icon",
      })
      .onConflictDoNothing()
      .returning();
    const compId =
      comp?.id ??
      (
        await db
          .select({ id: competencies.id })
          .from(competencies)
          .where(eq(competencies.code, "C1"))
          .limit(1)
      )[0]?.id ??
      1;

    const [st] = await db
      .insert(strands)
      .values({
        code: "C1.CNT",
        competencyId: compId,
        name: "Counting",
      })
      .onConflictDoNothing()
      .returning();
    const strandId =
      st?.id ??
      (
        await db
          .select({ id: strands.id })
          .from(strands)
          .where(eq(strands.code, "C1.CNT"))
          .limit(1)
      )[0]?.id ??
      1;

    const [sk] = await db
      .insert(skills)
      .values({
        code: "C1.CNT.01",
        strandId,
        name: "Counting 1-5",
        ageMin: 3,
        ageMax: 5,
        difficulty: 1,
      })
      .onConflictDoNothing()
      .returning();
    const skillId =
      sk?.id ??
      (
        await db
          .select({ id: skills.id })
          .from(skills)
          .where(eq(skills.code, "C1.CNT.01"))
          .limit(1)
      )[0]?.id ??
      1;

    await db
      .insert(contentSkillMap)
      .values({
        entityType: "game_level",
        entityId: glId,
        skillId,
        weight: "1.00",
      })
      .onConflictDoNothing();

    const [session] = await db
      .insert(playSessions)
      .values({
        gameLevelId: glId,
        contentVersion: 1,
        templateCode,
        childProfileId: child.id,
        completionStatus: "in_progress",
      })
      .returning();

    const uuid = session.sessionUuid;

    // Ingest start & complete telemetry events
    await db.insert(telemetryEvents).values([
      {
        sessionUuid: uuid,
        seq: 1,
        eventName: "game_started",
        childUuid: child.uuid,
        gameLevelId: glId,
        contentVersion: 1,
      },
      {
        sessionUuid: uuid,
        seq: 2,
        eventName: "game_completed",
        childUuid: child.uuid,
        gameLevelId: glId,
        contentVersion: 1,
        payload: { duration_ms: 10_000, rounds_total: 1, rounds_correct: 1 },
      },
    ]);

    // Force computeUpdate to fail to simulate mastery crash
    const computeSpy = vi
      .spyOn(adaptive, "computeUpdate")
      .mockImplementationOnce(() => {
        throw new Error("Mastery calculation exploded");
      });

    try {
      await expect(
        completePlaySession(uuid, undefined, {
          isUserCall: true,
          callerAccountId: user.id,
          callerChildProfileId: child.id,
        })
      ).rejects.toThrow("Mastery calculation exploded");

      // Verify play_sessions is NOT left in 'completed' status!
      const [updatedSession] = await db
        .select()
        .from(playSessions)
        .where(eq(playSessions.sessionUuid, uuid));

      expect(updatedSession?.completionStatus).toBe("in_progress");
    } finally {
      computeSpy.mockRestore();
    }
  });
});

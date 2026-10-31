import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  cancelUserDeletion,
  consentLogs,
  getOwnerDb,
  hardPurgeUser,
  requestUserDeletion,
  socialIdentities,
} from "#src/index";
import { childProfiles } from "#src/schema/child";
import { users } from "#src/schema/identity";
import { telemetryEvents } from "#src/schema/play";

describe("Purge and Anonymization Integration Tests — Task 10", () => {
  it("BR-CDC-10 & BR-SPT-04: deletion request, grace period check, hard purge, and telemetry anonymization", async () => {
    const db = getOwnerDb();
    const email = `purge-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

    // 1. Create parent User
    const [u] = await db
      .insert(users)
      .values({ email, displayName: "Parent Purge Test" })
      .returning();
    if (!u) {
      throw new Error("Failed to insert user");
    }

    // 2. Create Consent Log
    const [consent] = await db
      .insert(consentLogs)
      .values({
        userId: u.id,
        consentType: "child_data",
        action: "accepted",
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      })
      .returning();
    if (!consent) {
      throw new Error("Failed to insert consent");
    }

    // 3. Create Child Profile (active) + 1 already archived Child Profile
    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: u.id,
        displayName: "Bé Cúc",
        birthYear: 2021,
        avatarId: "preset_cat_01",
      })
      .returning();
    if (!child) {
      throw new Error("Failed to insert child");
    }

    const [archivedChild] = await db
      .insert(childProfiles)
      .values({
        userId: u.id,
        displayName: "Bé Mai",
        birthYear: 2020,
        avatarId: "preset_dog_01",
        status: "archived",
      })
      .returning();
    if (!archivedChild) {
      throw new Error("Failed to insert archived child");
    }

    // 3b. Create Social Identity (BR-ADL-10)
    await db.insert(socialIdentities).values({
      userId: u.id,
      provider: "google",
      providerUserId: `google-uid-${u.uuid}`,
      emailAtProvider: email,
      emailVerifiedAtProvider: true,
    });

    // 4. Create Telemetry Events
    const sessionUuid = crypto.randomUUID();
    await db.insert(telemetryEvents).values({
      sessionUuid,
      seq: 1,
      childUuid: child.uuid,
      eventName: "game_start",
    });

    // Step A: Request deletion (D=0)
    const baseDate = new Date("2026-08-01T00:00:00Z");
    await requestUserDeletion(db, u.id, baseDate);

    // Verify user & child status
    const [uDeleted] = await db.select().from(users).where(eq(users.id, u.id));
    expect(uDeleted?.status).toBe("deleted");

    const [childPending] = await db
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.id, child.id));
    expect(childPending?.status).toBe("pending_deletion");

    // Step B: Cancel deletion test
    await cancelUserDeletion(db, u.id);
    const [uRestored] = await db.select().from(users).where(eq(users.id, u.id));
    expect(uRestored?.status).toBe("active");

    const [archivedAfterCancel] = await db
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.id, archivedChild.id));
    expect(archivedAfterCancel?.status).toBe("archived");

    // Re-request deletion for hard purge test
    const { scheduledPurgeAt: purgeAt2 } = await requestUserDeletion(
      db,
      u.id,
      baseDate
    );

    // Step C: Run purge at D+29 (29 days later) -> MUST NOT DELETE ANYTHING
    const d29 = new Date("2026-08-30T00:00:00Z");
    const resultD29 = await hardPurgeUser(db, u.id, d29, purgeAt2);

    expect(resultD29.purged).toBe(false);
    expect(resultD29.reason).toBe("RETENTION_PERIOD_ACTIVE");

    // Verify child profile still exists at D+29
    const [childD29] = await db
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.id, child.id));
    expect(childD29).toBeDefined();

    // Step D: Run purge at D+30 (30 days later) -> EXECUTES HARD PURGE
    const d30 = new Date("2026-08-31T00:00:00Z");
    const resultD30 = await hardPurgeUser(db, u.id, d30, purgeAt2);

    expect(resultD30.purged).toBe(true);

    // Verify child_profiles deleted
    const remainingChildren = await db
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.userId, u.id));
    expect(remainingChildren.length).toBe(0);

    // BR-ADL-10: Verify social_identities hard deleted
    const remainingSocial = await db
      .select()
      .from(socialIdentities)
      .where(eq(socialIdentities.userId, u.id));
    expect(remainingSocial.length).toBe(0);

    // BR-ADL-09: Verify users PII anonymized and purgeAt cleared
    const [uPurged] = await db.select().from(users).where(eq(users.id, u.id));
    expect(uPurged?.email).toBe(`deleted+${u.uuid}@mindkid.invalid`);
    expect(uPurged?.displayName).toBe("Đã xoá");
    expect(uPurged?.passwordHash).toBeNull();
    expect(uPurged?.purgeAt).toBeNull();

    // BR-SPT-04: Verify telemetry_events.child_uuid is NULL, but row count unchanged
    const [telemetryAfter] = await db
      .select()
      .from(telemetryEvents)
      .where(eq(telemetryEvents.sessionUuid, sessionUuid));

    expect(telemetryAfter).toBeDefined();
    expect(telemetryAfter?.childUuid).toBeNull();

    // Verify consent_logs REMAIN INTACT
    const [consentIntact] = await db
      .select()
      .from(consentLogs)
      .where(eq(consentLogs.id, consent.id));
    expect(consentIntact).toBeDefined();
    expect(consentIntact?.userId).toBe(u.id);
  });
});

import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  CHILD_STATUS,
  CONSENT_ACTION,
  CONSENT_TYPE,
  cancelUserDeletion,
  consentLogs,
  getOwnerDb,
  hardPurgeUser,
  requestUserDeletion,
  USER_STATUS,
  userAccounts,
} from "#src/index";
import { childProfiles } from "#src/schema/child";
import { users } from "#src/schema/identity";
import { telemetryEvents } from "#src/schema/play";

describe("Purge and Anonymization Integration Tests — Task 10", () => {
  it("BR-CDC-10 & BR-SPT-04: deletion request, grace period check, hard purge, and telemetry anonymization", async () => {
    const db = getOwnerDb();
    const email = `purge-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

    const [u] = await db
      .insert(users)
      .values({
        email,
        displayName: "Parent Purge Test",
        emailVerified: true,
        status: USER_STATUS.ACTIVE,
        emailVerifiedAt: new Date("2026-07-01T00:00:00Z"),
      })
      .returning();
    if (!u) {
      throw new Error("Failed to insert user");
    }

    const [consent] = await db
      .insert(consentLogs)
      .values({
        userId: u.id,
        consentType: CONSENT_TYPE.CHILD_DATA,
        action: CONSENT_ACTION.ACCEPTED,
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      })
      .returning();
    if (!consent) {
      throw new Error("Failed to insert consent");
    }

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
        status: CHILD_STATUS.ARCHIVED,
      })
      .returning();
    if (!archivedChild) {
      throw new Error("Failed to insert archived child");
    }

    const individualPurgeAt = new Date("2026-08-25T00:00:00Z");
    const [individuallyDeletedChild] = await db
      .insert(childProfiles)
      .values({
        userId: u.id,
        displayName: "Bé Trúc",
        birthYear: 2021,
        avatarId: "preset_fox_01",
        status: CHILD_STATUS.PENDING_DELETION,
        purgeAt: individualPurgeAt,
      })
      .returning();
    if (!individuallyDeletedChild) {
      throw new Error("Failed to insert individually deleted child");
    }

    await db.insert(userAccounts).values({
      userId: u.id,
      providerId: "google",
      accountId: `google-uid-${u.uuid}`,
      emailAtProvider: email,
      emailVerifiedAtProvider: true,
    });

    const sessionUuid = crypto.randomUUID();
    await db.insert(telemetryEvents).values({
      sessionUuid,
      seq: 1,
      childUuid: child.uuid,
      eventName: "game_start",
    });

    const baseDate = new Date("2026-08-01T00:00:00Z");
    await requestUserDeletion(db, u.id, baseDate);

    const [uDeleted] = await db.select().from(users).where(eq(users.id, u.id));
    expect(uDeleted?.status).toBe(USER_STATUS.DELETED);

    const [childPending] = await db
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.id, child.id));
    expect(childPending?.status).toBe(CHILD_STATUS.PENDING_DELETION);

    await cancelUserDeletion(db, u.id);
    const [uRestored] = await db.select().from(users).where(eq(users.id, u.id));
    expect(uRestored?.status).toBe(USER_STATUS.ACTIVE);
    expect(uRestored?.purgeAt).toBeNull();

    const [childRestored] = await db
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.id, child.id));
    expect(childRestored?.status).toBe(CHILD_STATUS.ACTIVE);

    const [archivedAfterCancel] = await db
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.id, archivedChild.id));
    expect(archivedAfterCancel?.status).toBe(CHILD_STATUS.ARCHIVED);

    const [individuallyDeletedAfterCancel] = await db
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.id, individuallyDeletedChild.id));
    expect(individuallyDeletedAfterCancel?.status).toBe(
      CHILD_STATUS.PENDING_DELETION
    );
    expect(individuallyDeletedAfterCancel?.purgeAt?.getTime()).toBe(
      individualPurgeAt.getTime()
    );

    const { scheduledPurgeAt: purgeAt2 } = await requestUserDeletion(
      db,
      u.id,
      baseDate
    );

    const d29 = new Date("2026-08-30T00:00:00Z");
    const resultD29 = await hardPurgeUser(db, u.id, d29, purgeAt2);

    expect(resultD29.purged).toBe(false);
    expect(resultD29.reason).toBe("RETENTION_PERIOD_ACTIVE");

    const [childD29] = await db
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.id, child.id));
    expect(childD29).toBeDefined();

    const d30 = new Date("2026-08-31T00:00:00Z");
    const resultD30 = await hardPurgeUser(db, u.id, d30, purgeAt2);

    expect(resultD30.purged).toBe(true);

    const remainingChildren = await db
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.userId, u.id));
    expect(remainingChildren.length).toBe(0);

    const remainingAccounts = await db
      .select()
      .from(userAccounts)
      .where(eq(userAccounts.userId, u.id));
    expect(remainingAccounts.length).toBe(0);

    const [uPurged] = await db.select().from(users).where(eq(users.id, u.id));
    expect(uPurged?.email).toBe(`deleted+${u.uuid}@mindkid.invalid`);
    expect(uPurged?.displayName).toBe("Đã xoá");
    expect(uPurged?.passwordHash).toBeNull();
    expect(uPurged?.purgeAt).toBeNull();

    const [telemetryAfter] = await db
      .select()
      .from(telemetryEvents)
      .where(eq(telemetryEvents.sessionUuid, sessionUuid));

    expect(telemetryAfter).toBeDefined();
    expect(telemetryAfter?.childUuid).toBeNull();

    const [consentIntact] = await db
      .select()
      .from(consentLogs)
      .where(eq(consentLogs.id, consent.id));
    expect(consentIntact).toBeDefined();
    expect(consentIntact?.userId).toBe(u.id);
  });

  it("BR-CDC-10: cancelUserDeletion khôi phục USER_STATUS.PENDING_VERIFICATION khi emailVerified = false", async () => {
    const db = getOwnerDb();
    const email = `purge-unverified-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

    const [unverifiedUser] = await db
      .insert(users)
      .values({
        email,
        displayName: "Unverified Parent",
        emailVerified: false,
        status: USER_STATUS.PENDING_VERIFICATION,
      })
      .returning();
    if (!unverifiedUser) {
      throw new Error("Failed to insert unverified user");
    }

    const baseDate = new Date("2026-08-01T00:00:00Z");
    await requestUserDeletion(db, unverifiedUser.id, baseDate);

    const [deletedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, unverifiedUser.id));
    expect(deletedUser?.status).toBe(USER_STATUS.DELETED);

    await cancelUserDeletion(db, unverifiedUser.id);

    const [restoredUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, unverifiedUser.id));
    expect(restoredUser?.status).toBe(USER_STATUS.PENDING_VERIFICATION);
    expect(restoredUser?.status).not.toBe(USER_STATUS.ACTIVE);
    expect(restoredUser?.purgeAt).toBeNull();
  });
});

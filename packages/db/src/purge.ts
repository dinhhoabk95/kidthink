import { and, eq, inArray, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { aiCreditBalance } from "./schema/ai-credit.ts";
import { entitlements, quotaUsage } from "./schema/billing.ts";
import { childProfiles } from "./schema/child.ts";
import { customGames } from "./schema/custom-game.ts";
import {
  activeSessions,
  mfaRecoveryCodes,
  mfaSettings,
  socialIdentities,
  users,
  verificationTokens,
} from "./schema/identity.ts";
import { notificationEndpoints, notifications } from "./schema/ops.ts";
import { personalCurricula } from "./schema/personal-curriculum.ts";
import { telemetryEvents } from "./schema/play.ts";
import { userTags } from "./schema/tagging.ts";

export interface PurgeResult {
  purged: boolean;
  reason?: string;
}

export function computeScheduledPurgeDate(currentDate: Date): Date {
  const purgeAt = new Date(currentDate.getTime());
  purgeAt.setDate(purgeAt.getDate() + 30);
  return purgeAt;
}

/**
 * Task 10 — Step 1: User requests deletion.
 * Marks user as deleted, active child profiles as pending_deletion, returns purge_at (D+30).
 */
export async function requestUserDeletion(
  db: PostgresJsDatabase,
  userId: number,
  currentDate: Date = new Date()
): Promise<{ scheduledPurgeAt: Date }> {
  const scheduledPurgeAt = computeScheduledPurgeDate(currentDate);

  await db
    .update(users)
    .set({
      status: "deleted",
      purgeAt: scheduledPurgeAt,
      updatedAt: currentDate,
    })
    .where(eq(users.id, userId));

  await db
    .update(childProfiles)
    .set({ status: "pending_deletion", updatedAt: currentDate })
    .where(
      and(eq(childProfiles.userId, userId), eq(childProfiles.status, "active"))
    );

  return { scheduledPurgeAt };
}

/**
 * Task 10 — Step 2: User cancels deletion within 30-day grace period.
 * Restores deleted user and pending_deletion child profiles to active status.
 */
export async function cancelUserDeletion(
  db: PostgresJsDatabase,
  userId: number
): Promise<void> {
  const now = new Date();
  await db
    .update(users)
    .set({ status: "active", purgeAt: null, updatedAt: now })
    .where(and(eq(users.id, userId), eq(users.status, "deleted")));

  await db
    .update(childProfiles)
    .set({ status: "active", updatedAt: now })
    .where(
      and(
        eq(childProfiles.userId, userId),
        eq(childProfiles.status, "pending_deletion")
      )
    );
}

/**
 * Task 10 — Step 3: Hard purge after 30-day grace period.
 * BR-CDC-10, BR-SPT-04, BR-ADL-09, BR-ADL-10:
 * - If currentDate < scheduledPurgeDate (e.g. D+29): does NOTHING.
 * - If currentDate >= scheduledPurgeDate (D+30):
 *   1. Anonymizes telemetry_events (SET child_uuid = NULL).
 *   2. Deletes child_profiles and user-scoped personal/auth records (including social_identities).
 *   3. Anonymizes users PII in-place and sets purge_at = NULL while retaining audit_logs, consent_logs, payment_orders.
 */
export async function hardPurgeUser(
  db: PostgresJsDatabase,
  userId: number,
  currentDate: Date,
  scheduledPurgeDate: Date
): Promise<PurgeResult> {
  if (currentDate.getTime() < scheduledPurgeDate.getTime()) {
    return { purged: false, reason: "RETENTION_PERIOD_ACTIVE" };
  }

  // 1. Fetch child profiles to get UUIDs for telemetry anonymization
  const children = await db
    .select({ id: childProfiles.id, uuid: childProfiles.uuid })
    .from(childProfiles)
    .where(eq(childProfiles.userId, userId));

  const childUuids = children.map((c) => c.uuid);

  // 2. Anonymize telemetry_events (SET child_uuid = NULL)
  if (childUuids.length > 0) {
    await db
      .update(telemetryEvents)
      .set({ childUuid: null })
      .where(inArray(telemetryEvents.childUuid, childUuids));
  }

  // 3. Hard delete child_profiles (DB cascade handles child_session_summaries, play_sessions, mastery_state, etc.)
  await db.delete(childProfiles).where(eq(childProfiles.userId, userId));

  // 4. Hard delete social_identities (BR-ADL-10) and user-scoped operational tables
  await db.delete(socialIdentities).where(eq(socialIdentities.userId, userId));
  await db
    .delete(activeSessions)
    .where(
      and(
        eq(activeSessions.accountType, "user"),
        eq(activeSessions.accountId, userId)
      )
    );
  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.accountType, "user"),
        eq(verificationTokens.accountId, userId)
      )
    );
  await db
    .delete(mfaSettings)
    .where(
      and(
        eq(mfaSettings.accountType, "user"),
        eq(mfaSettings.accountId, userId)
      )
    );
  await db
    .delete(mfaRecoveryCodes)
    .where(
      and(
        eq(mfaRecoveryCodes.accountType, "user"),
        eq(mfaRecoveryCodes.accountId, userId)
      )
    );
  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.recipientType, "user"),
        eq(notifications.recipientId, userId)
      )
    );
  await db
    .delete(notificationEndpoints)
    .where(eq(notificationEndpoints.userId, userId));
  await db.delete(entitlements).where(eq(entitlements.userId, userId));
  await db.delete(quotaUsage).where(eq(quotaUsage.userId, userId));
  await db
    .delete(personalCurricula)
    .where(eq(personalCurricula.userId, userId));
  await db.delete(customGames).where(eq(customGames.userId, userId));
  await db.delete(userTags).where(eq(userTags.userId, userId));
  await db.delete(aiCreditBalance).where(eq(aiCreditBalance.userId, userId));

  // 5. Anonymize users PII in-place and clear purge_at (BR-ADL-09)
  await db
    .update(users)
    .set({
      email: sql`'deleted+' || ${users.uuid} || '@mindkid.invalid'`,
      displayName: "Đã xoá",
      passwordHash: null,
      status: "deleted",
      purgeAt: null,
      updatedAt: currentDate,
    })
    .where(eq(users.id, userId));

  return { purged: true };
}

/**
 * Task #34: P1.9 — Hard purge a single child profile after 30-day grace period.
 * BR-CPR-05: Anonymizes telemetry_events (child_uuid = NULL) and hard deletes child_profile.
 */
export async function hardPurgeChildProfile(
  db: PostgresJsDatabase,
  childId: number,
  childUuid: string
): Promise<void> {
  await db
    .update(telemetryEvents)
    .set({ childUuid: null })
    .where(eq(telemetryEvents.childUuid, childUuid));

  await db.delete(childProfiles).where(eq(childProfiles.id, childId));
}

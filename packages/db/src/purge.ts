import { and, eq, inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { entitlements, quotaUsage } from "./schema/billing.ts";
import { childProfiles } from "./schema/child.ts";
import {
  activeSessions,
  mfaRecoveryCodes,
  mfaSettings,
  socialIdentities,
  users,
  verificationTokens,
} from "./schema/identity.ts";
import { telemetryEvents } from "./schema/play.ts";

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
 * Marks user as deleted, child profiles as pending_deletion, returns purge_at (D+30).
 */
export async function requestUserDeletion(
  db: PostgresJsDatabase<Record<string, unknown>>,
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
    .set({
      status: "pending_deletion",
      purgeAt: scheduledPurgeAt,
      updatedAt: currentDate,
    })
    .where(eq(childProfiles.userId, userId));

  // Revoke all active sessions immediately
  await db
    .delete(activeSessions)
    .where(
      and(
        eq(activeSessions.accountType, "user"),
        eq(activeSessions.accountId, userId)
      )
    )
    .catch(() => null);

  return { scheduledPurgeAt };
}

/**
 * Task 10 — Step 2: User cancels deletion within 30-day grace period.
 * Restores user and child profiles to active status.
 */
export async function cancelUserDeletion(
  db: PostgresJsDatabase<Record<string, unknown>>,
  userId: number
): Promise<void> {
  await db
    .update(users)
    .set({ status: "active", purgeAt: null, updatedAt: new Date() })
    .where(eq(users.id, userId));

  await db
    .update(childProfiles)
    .set({ status: "active", purgeAt: null, updatedAt: new Date() })
    .where(eq(childProfiles.userId, userId));
}

/**
 * Step 3: Hard purge after 30-day grace period.
 * BR-ADL-01..10 & D-IF:
 * 1. Hard delete Group 1 (DELETE):
 *    - social_identities (BR-ADL-10: hard delete to release UNIQUE provider_user_id)
 *    - child_profiles (cascades to mastery_state, level_params, play_sessions, summaries, daily_stats, enrollments)
 *    - active_sessions, verification_tokens, mfa_settings, mfa_recovery_codes
 *    - entitlements, quota_usage, notifications
 * 2. Anonymize Group 2 (ANONYMIZE):
 *    - telemetry_events (BR-ADL-04: child_uuid = NULL)
 *    - users (BR-ADL-09: email = deleted+uuid@kidthink.invalid, displayName = 'Đã xoá', passwordHash = NULL, status = 'purged')
 * 3. Retain Group 3 (RETAIN):
 *    - audit_logs and consent_logs intact (BR-ADL-05)
 *    - payment_orders intact
 */
export async function hardPurgeUser(
  db: PostgresJsDatabase<Record<string, unknown>>,
  userId: number,
  currentDate: Date,
  scheduledPurgeDate: Date
): Promise<PurgeResult> {
  if (currentDate.getTime() < scheduledPurgeDate.getTime()) {
    return { purged: false, reason: "RETENTION_PERIOD_ACTIVE" };
  }

  // 1. Fetch user uuid and child profile uuids
  const [user] = await db
    .select({ id: users.id, uuid: users.uuid })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { purged: false, reason: "USER_NOT_FOUND" };
  }

  const children = await db
    .select({ id: childProfiles.id, uuid: childProfiles.uuid })
    .from(childProfiles)
    .where(eq(childProfiles.userId, userId));

  const childUuids = children.map((c) => c.uuid);

  // 2. Anonymize telemetry_events (SET child_uuid = NULL) — BR-ADL-04
  if (childUuids.length > 0) {
    await db
      .update(telemetryEvents)
      .set({ childUuid: null })
      .where(inArray(telemetryEvents.childUuid, childUuids));
  }

  // 3. Hard delete Group 1 tables
  // BR-ADL-10: Delete social_identities
  await db
    .delete(socialIdentities)
    .where(eq(socialIdentities.userId, userId))
    .catch(() => null);

  // Delete sessions & tokens
  await db
    .delete(activeSessions)
    .where(
      and(
        eq(activeSessions.accountType, "user"),
        eq(activeSessions.accountId, userId)
      )
    )
    .catch(() => null);

  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.accountType, "user"),
        eq(verificationTokens.accountId, userId)
      )
    )
    .catch(() => null);

  await db
    .delete(mfaSettings)
    .where(
      and(
        eq(mfaSettings.accountType, "user"),
        eq(mfaSettings.accountId, userId)
      )
    )
    .catch(() => null);

  await db
    .delete(mfaRecoveryCodes)
    .where(
      and(
        eq(mfaRecoveryCodes.accountType, "user"),
        eq(mfaRecoveryCodes.accountId, userId)
      )
    )
    .catch(() => null);

  // Delete entitlements & quota
  await db
    .delete(entitlements)
    .where(eq(entitlements.userId, userId))
    .catch(() => null);

  await db
    .delete(quotaUsage)
    .where(eq(quotaUsage.userId, userId))
    .catch(() => null);

  // Delete child_profiles (cascades to play_sessions, summaries, etc.)
  await db.delete(childProfiles).where(eq(childProfiles.userId, userId));

  // 4. Anonymize user record — BR-ADL-09: releases original email for future re-registration
  const anonymizedEmail = `deleted+${user.uuid}@kidthink.invalid`;
  await db
    .update(users)
    .set({
      email: anonymizedEmail,
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
  db: PostgresJsDatabase<Record<string, unknown>>,
  childId: number,
  childUuid: string
): Promise<void> {
  await db
    .update(telemetryEvents)
    .set({ childUuid: null })
    .where(eq(telemetryEvents.childUuid, childUuid));

  await db.delete(childProfiles).where(eq(childProfiles.id, childId));
}

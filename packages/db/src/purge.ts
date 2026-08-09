import { eq, inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { childProfiles } from "./schema/child.ts";
import { users } from "./schema/identity.ts";
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
    .set({ status: "deleted", updatedAt: currentDate })
    .where(eq(users.id, userId));

  await db
    .update(childProfiles)
    .set({ status: "pending_deletion", updatedAt: currentDate })
    .where(eq(childProfiles.userId, userId));

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
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(users.id, userId));

  await db
    .update(childProfiles)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(childProfiles.userId, userId));
}

/**
 * Task 10 — Step 3: Hard purge after 30-day grace period.
 * BR-CDC-10 & BR-SPT-04:
 * - If currentDate < scheduledPurgeDate (e.g. D+29): does NOTHING.
 * - If currentDate >= scheduledPurgeDate (D+30):
 *   1. Anonymizes telemetry_events (SET child_uuid = NULL).
 *   2. Deletes child_profiles (cascade deletes mastery_state, play_sessions, child_session_summaries).
 *   3. Preserves audit_logs and consent_logs intact.
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

  // 3. Hard delete child_profiles (DB cascade handles child_session_summaries, play_sessions, mastery_state)
  await db.delete(childProfiles).where(eq(childProfiles.userId, userId));

  return { purged: true };
}

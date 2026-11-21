import { and, eq, inArray, sql } from "drizzle-orm";
import type { DbExecutor } from "#src/client";
import { aiCreditBalance } from "#src/schema/ai-credit";
import {
  entitlements,
  quotaUsage,
  recurringSubscriptions,
} from "#src/schema/billing";
import { childProfiles } from "#src/schema/child";
import { customGames } from "#src/schema/custom-game";
import { exportJobs } from "#src/schema/exports";
import {
  mfaRecoveryRequests,
  userAccounts,
  userPasskeys,
  userSessions,
  users,
  userTwoFactors,
  userVerifications,
} from "#src/schema/identity";
import { collections, libraryItems } from "#src/schema/library";
import { notificationEndpoints, notifications } from "#src/schema/ops";
import { personalCurricula } from "#src/schema/personal-curriculum";
import { telemetryEvents } from "#src/schema/play";

export interface PurgeResult {
  purged: boolean;
  reason?: string;
}

export function computeScheduledPurgeDate(currentDate: Date): Date {
  const purgeAt = new Date(currentDate.getTime());
  purgeAt.setDate(purgeAt.getDate() + 30);
  return purgeAt;
}

export async function requestUserDeletion(
  db: DbExecutor,
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

export async function cancelUserDeletion(
  db: DbExecutor,
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

export async function hardPurgeUser(
  db: DbExecutor,
  userId: number,
  currentDate: Date,
  scheduledPurgeDate: Date
): Promise<PurgeResult> {
  if (currentDate.getTime() < scheduledPurgeDate.getTime()) {
    return { purged: false, reason: "RETENTION_PERIOD_ACTIVE" };
  }

  const runPurge = async (tx: DbExecutor) => {
    const [targetUser] = await tx
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId));

    const children = await tx
      .select({ id: childProfiles.id, uuid: childProfiles.uuid })
      .from(childProfiles)
      .where(eq(childProfiles.userId, userId));

    const childUuids = children.map((c) => c.uuid);

    if (childUuids.length > 0) {
      await tx
        .update(telemetryEvents)
        .set({ childUuid: null })
        .where(inArray(telemetryEvents.childUuid, childUuids));
    }

    await tx.delete(childProfiles).where(eq(childProfiles.userId, userId));
    await tx.delete(userAccounts).where(eq(userAccounts.userId, userId));
    await tx.delete(userSessions).where(eq(userSessions.userId, userId));
    await tx.delete(userTwoFactors).where(eq(userTwoFactors.userId, userId));
    await tx.delete(userPasskeys).where(eq(userPasskeys.userId, userId));
    if (targetUser?.email) {
      await tx
        .delete(userVerifications)
        .where(eq(userVerifications.identifier, targetUser.email));
    }
    await tx
      .delete(notifications)
      .where(
        and(
          eq(notifications.recipientType, "user"),
          eq(notifications.recipientId, userId)
        )
      );
    await tx
      .delete(notificationEndpoints)
      .where(eq(notificationEndpoints.userId, userId));
    await tx
      .delete(recurringSubscriptions)
      .where(eq(recurringSubscriptions.userId, userId));
    await tx.delete(entitlements).where(eq(entitlements.userId, userId));
    await tx.delete(quotaUsage).where(eq(quotaUsage.userId, userId));
    await tx
      .delete(personalCurricula)
      .where(eq(personalCurricula.userId, userId));
    await tx.delete(customGames).where(eq(customGames.userId, userId));
    await tx.delete(libraryItems).where(eq(libraryItems.userId, userId));
    await tx.delete(collections).where(eq(collections.userId, userId));
    await tx
      .delete(mfaRecoveryRequests)
      .where(eq(mfaRecoveryRequests.userId, userId));
    await tx.delete(exportJobs).where(eq(exportJobs.userId, userId));
    await tx.delete(aiCreditBalance).where(eq(aiCreditBalance.userId, userId));

    await tx
      .update(users)
      .set({
        email: sql`'deleted+' || ${users.uuid} || '@mindkid.invalid'`,
        displayName: "Đã xoá",
        passwordHash: null,
        emailVerified: false,
        twoFactorEnabled: false,
        image: null,
        status: "deleted",
        purgeAt: null,
        updatedAt: currentDate,
      })
      .where(eq(users.id, userId));
  };

  if (typeof db.transaction === "function") {
    await db.transaction(async (tx) => {
      await runPurge(tx);
    });
  } else {
    await runPurge(db);
  }

  return { purged: true };
}

export async function hardPurgeChildProfile(
  db: DbExecutor,
  childId: number,
  childUuid: string
): Promise<void> {
  const runChildPurge = async (tx: DbExecutor) => {
    await tx
      .update(telemetryEvents)
      .set({ childUuid: null })
      .where(eq(telemetryEvents.childUuid, childUuid));

    await tx.delete(childProfiles).where(eq(childProfiles.id, childId));
  };

  if (typeof db.transaction === "function") {
    await db.transaction(async (tx) => {
      await runChildPurge(tx);
    });
  } else {
    await runChildPurge(db);
  }
}

import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import type { DbExecutor } from "#src/client";
import { RECIPIENT_TYPE } from "#src/constants/billing-ops-enums";
import { CHILD_STATUS, USER_STATUS } from "#src/constants/identity-enums";
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
      status: USER_STATUS.DELETED,
      purgeAt: scheduledPurgeAt,
      updatedAt: currentDate,
    })
    .where(eq(users.id, userId));

  await db
    .update(childProfiles)
    .set({ status: CHILD_STATUS.PENDING_DELETION, updatedAt: currentDate })
    .where(
      and(
        eq(childProfiles.userId, userId),
        eq(childProfiles.status, CHILD_STATUS.ACTIVE)
      )
    );

  await db
    .update(recurringSubscriptions)
    .set({ autoRenew: false, updatedAt: currentDate })
    .where(
      and(
        eq(recurringSubscriptions.userId, userId),
        eq(recurringSubscriptions.autoRenew, true)
      )
    );

  return { scheduledPurgeAt };
}

export async function cancelUserDeletion(
  db: DbExecutor,
  userId: number
): Promise<void> {
  const [account] = await db
    .select({ emailVerified: users.emailVerified })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.status, USER_STATUS.DELETED)));

  if (!account) {
    return;
  }

  const now = new Date();
  const restoredStatus = account.emailVerified
    ? USER_STATUS.ACTIVE
    : USER_STATUS.PENDING_VERIFICATION;

  await db
    .update(users)
    .set({ status: restoredStatus, purgeAt: null, updatedAt: now })
    .where(and(eq(users.id, userId), eq(users.status, USER_STATUS.DELETED)));

  await db
    .update(childProfiles)
    .set({ status: CHILD_STATUS.ACTIVE, purgeAt: null, updatedAt: now })
    .where(
      and(
        eq(childProfiles.userId, userId),
        eq(childProfiles.status, CHILD_STATUS.PENDING_DELETION),
        isNull(childProfiles.purgeAt)
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

  await db.transaction(async (tx) => {
    const targetUser = await tx.query.users.findFirst({
      columns: { email: true },
      where: { id: userId },
    });

    const children = await tx.query.childProfiles.findMany({
      columns: { id: true, uuid: true },
      where: { userId },
    });

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
          eq(notifications.recipientType, RECIPIENT_TYPE.USER),
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
        status: USER_STATUS.DELETED,
        purgeAt: null,
        updatedAt: currentDate,
      })
      .where(eq(users.id, userId));
  });

  return { purged: true };
}

export async function hardPurgeChildProfile(
  db: DbExecutor,
  childId: number,
  childUuid: string
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(telemetryEvents)
      .set({ childUuid: null })
      .where(eq(telemetryEvents.childUuid, childUuid));

    await tx.delete(childProfiles).where(eq(childProfiles.id, childId));
  });
}

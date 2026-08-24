import { appError } from "@mindkid/auth";
import { getOwnerDb, mfaRecoveryRequests, users } from "@mindkid/db";
import { desc, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);
  const userUuid = getRouterParam(event, "uuid");
  if (!userUuid) {
    throw appError("NOT_FOUND");
  }

  const db = getOwnerDb();
  const [targetUser] = await db
    .select({ id: users.id, uuid: users.uuid })
    .from(users)
    .where(eq(users.uuid, userUuid))
    .limit(1);

  if (!targetUser) {
    throw appError("NOT_FOUND");
  }

  const requests = await db
    .select({
      id: mfaRecoveryRequests.id,
      uuid: mfaRecoveryRequests.uuid,
      status: mfaRecoveryRequests.status,
      reason: mfaRecoveryRequests.reason,
      requestedByManagerId: mfaRecoveryRequests.requestedByManagerId,
      emailVerifiedAt: mfaRecoveryRequests.emailVerifiedAt,
      eligibleAt: mfaRecoveryRequests.eligibleAt,
      completedAt: mfaRecoveryRequests.completedAt,
      cancelledAt: mfaRecoveryRequests.cancelledAt,
      createdAt: mfaRecoveryRequests.createdAt,
    })
    .from(mfaRecoveryRequests)
    .where(eq(mfaRecoveryRequests.userId, targetUser.id))
    .orderBy(desc(mfaRecoveryRequests.createdAt));

  return {
    requests: requests.map((r) => ({
      uuid: r.uuid,
      status: r.status,
      reason: r.reason,
      email_verified_at: r.emailVerifiedAt?.toISOString() || null,
      eligible_at: r.eligibleAt.toISOString(),
      completed_at: r.completedAt?.toISOString() || null,
      cancelled_at: r.cancelledAt?.toISOString() || null,
      requested_at: r.createdAt.toISOString(),
    })),
  };
});

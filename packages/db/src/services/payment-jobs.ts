import { and, eq, inArray, isNotNull, lt } from "drizzle-orm";
import { getOwnerDb } from "../client.js";
import { entitlements, paymentOrders } from "../schema/billing.js";

/**
 * Sweeps pending payment orders older than 48 hours (or expires_at < now)
 * Transitions status: pending -> expired
 * Idempotent (Task 6, D-JL)
 */
export async function runExpirePaymentOrders(
  now = new Date()
): Promise<{ expiredCount: number; orderUuids: string[] }> {
  const db = getOwnerDb();

  const updatedOrders = await db
    .update(paymentOrders)
    .set({
      status: "expired",
      updatedAt: now,
    })
    .where(
      and(
        inArray(paymentOrders.status, ["draft", "pending", "pending_proof"]),
        isNotNull(paymentOrders.expiresAt),
        lt(paymentOrders.expiresAt, now)
      )
    )
    .returning({
      uuid: paymentOrders.uuid,
    });

  return {
    expiredCount: updatedOrders.length,
    orderUuids: updatedOrders.map((o) => o.uuid),
  };
}

/**
 * Sweeps soft_unlock entitlements older than 3 days (expires_at < now)
 * Transitions status: soft_unlock -> expired
 * D-JL: Payment order remains submitted/under_review - only entitlement expires.
 * Idempotent (Task 6)
 */
export async function runExpireSoftUnlockEntitlements(
  now = new Date()
): Promise<{ expiredCount: number; userIds: number[] }> {
  const db = getOwnerDb();

  const updatedRows = await db
    .update(entitlements)
    .set({
      status: "expired",
      updatedAt: now,
    })
    .where(
      and(
        eq(entitlements.status, "soft_unlock"),
        isNotNull(entitlements.expiresAt),
        lt(entitlements.expiresAt, now)
      )
    )
    .returning({
      userId: entitlements.userId,
    });

  const affectedUserIds = [...new Set(updatedRows.map((r) => r.userId))];

  return {
    expiredCount: updatedRows.length,
    userIds: affectedUserIds,
  };
}

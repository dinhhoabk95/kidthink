import { appError } from "@mindkid/auth";
import {
  auditLogs,
  entitlements,
  getOwnerDb,
  paymentOrders,
  paymentTransactions,
} from "@mindkid/db";
import {
  type AutomatedPaymentProvider,
  type AutomatedPaymentWebhookPayload,
  isWebhookWithinReplayWindow,
  PACKAGE_CATALOG,
} from "@mindkid/shared";
import { and, eq, inArray } from "drizzle-orm";

export interface ProcessWebhookResult {
  success: boolean;
  orderUuid: string;
  orderStatus: string;
  isDuplicate: boolean;
  mismatchReason?: string;
}

async function grantOrStackEntitlements(
  tx: Parameters<
    Parameters<ReturnType<typeof getOwnerDb>["transaction"]>[0]
  >[0],
  userId: number,
  packageCode: string,
  offerCode: string,
  orderUuid: string,
  now: Date
) {
  const pkgDef = PACKAGE_CATALOG[packageCode];
  const offerDef = pkgDef?.offers.find((o) => o.offer_code === offerCode);
  const durationDays = offerDef?.duration_days ?? 365;
  const newExpiry = new Date(
    now.getTime() + durationDays * 24 * 60 * 60 * 1000
  );
  const entitlementKeysToGrant = pkgDef?.entitlements ?? [
    "play_standard_games",
  ];

  for (const key of entitlementKeysToGrant) {
    const [existingEntitlement] = await tx
      .select()
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, userId),
          eq(entitlements.entitlementKey, key),
          inArray(entitlements.status, [
            "active",
            "soft_unlock",
            "grace_period",
          ])
        )
      )
      .limit(1);

    if (
      existingEntitlement?.expiresAt &&
      new Date(existingEntitlement.expiresAt) > now
    ) {
      const currentExpiry = new Date(existingEntitlement.expiresAt);
      const stackedExpiry = new Date(
        currentExpiry.getTime() + durationDays * 24 * 60 * 60 * 1000
      );
      await tx
        .update(entitlements)
        .set({
          status: "active",
          expiresAt: stackedExpiry,
          sourceRef: orderUuid,
          updatedAt: now,
        })
        .where(eq(entitlements.id, existingEntitlement.id));
    } else {
      await tx.insert(entitlements).values({
        userId,
        entitlementKey: key,
        source: "package_order",
        sourceRef: orderUuid,
        status: "active",
        grantedAt: now,
        expiresAt: newExpiry,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}

async function handleNonSuccessWebhook(
  tx: Parameters<
    Parameters<ReturnType<typeof getOwnerDb>["transaction"]>[0]
  >[0],
  order: typeof paymentOrders.$inferSelect,
  payload: AutomatedPaymentWebhookPayload,
  now: Date
) {
  await tx.insert(paymentTransactions).values({
    provider: payload.provider,
    providerEventId: payload.provider_event_id,
    orderId: order.id,
    orderUuid: payload.order_uuid,
    amountVnd: payload.amount_vnd,
    status: payload.status,
    rawPayload: payload,
    createdAt: now,
  });

  if (order.status === "pending" || order.status === "draft") {
    await tx
      .update(paymentOrders)
      .set({
        status: payload.status === "cancelled" ? "cancelled" : "expired",
        updatedAt: now,
      })
      .where(eq(paymentOrders.id, order.id));
  }

  return {
    success: true,
    orderUuid: order.uuid,
    orderStatus: order.status,
    isDuplicate: false,
  };
}

/**
 * Process verified automated payment webhook with exactly-once semantics.
 * BR-APM-01..07
 */
export async function processAutomatedPaymentWebhook(
  payload: AutomatedPaymentWebhookPayload,
  now = new Date()
): Promise<ProcessWebhookResult> {
  const currentTimestampSeconds = Math.floor(now.getTime() / 1000);

  // 1. Replay window check (≤ 300 seconds)
  if (
    !isWebhookWithinReplayWindow(
      payload.timestamp_seconds,
      currentTimestampSeconds
    )
  ) {
    throw appError(
      "WEBHOOK_REPLAY_DETECTED",
      "Webhook gửi quá thời gian cho phép hoặc phát lại"
    );
  }

  const db = getOwnerDb();

  return await db.transaction(async (tx) => {
    // 2. Check Idempotency via (provider, provider_event_id)
    const existingTx = await tx
      .select()
      .from(paymentTransactions)
      .where(
        and(
          eq(paymentTransactions.provider, payload.provider),
          eq(paymentTransactions.providerEventId, payload.provider_event_id)
        )
      )
      .limit(1);

    if (existingTx.length > 0) {
      // Duplicate delivery -> idempotent success without re-applying side effects
      const [existingOrder] = await tx
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.uuid, payload.order_uuid))
        .limit(1);

      return {
        success: true,
        orderUuid: payload.order_uuid,
        orderStatus: existingOrder?.status ?? "unknown",
        isDuplicate: true,
      };
    }

    // 3. Lookup Order
    const [order] = await tx
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.uuid, payload.order_uuid))
      .limit(1);

    if (!order) {
      throw appError(
        "NOT_FOUND",
        "Đơn hàng trong webhook không tồn tại trong hệ thống"
      );
    }

    // 4. Validate Amount from server-side catalog & order
    if (order.amountVnd !== payload.amount_vnd) {
      throw appError(
        "RECONCILIATION_MISMATCH",
        "Số tiền trong webhook không khớp với số tiền thực thu của đơn hàng"
      );
    }

    // 5. If webhook status is failed or cancelled
    if (payload.status !== "success") {
      return await handleNonSuccessWebhook(tx, order, payload, now);
    }

    // 6. Webhook status is success -> Atomic state transition + Entitlements + Audit
    if (order.status !== "approved") {
      // Transition order to approved
      await tx
        .update(paymentOrders)
        .set({
          status: "approved",
          reviewedAt: now,
          adminNote: `Approved via automated gateway webhook [${payload.provider}:${payload.provider_event_id}]`,
          updatedAt: now,
        })
        .where(eq(paymentOrders.id, order.id));

      await grantOrStackEntitlements(
        tx,
        order.userId,
        order.packageCode,
        order.offerCode,
        order.uuid,
        now
      );

      // Write Audit Log
      await tx.insert(auditLogs).values({
        actorType: "system",
        actorId: null,
        action: "payment_order.approved_webhook",
        entityType: "payment_order",
        entityId: String(order.id),
        afterData: {
          order_uuid: order.uuid,
          provider: payload.provider,
          provider_event_id: payload.provider_event_id,
          amount_vnd: payload.amount_vnd,
          status: "approved",
        },
        createdAt: now,
      });
    }

    // Insert payment_transactions record
    await tx.insert(paymentTransactions).values({
      provider: payload.provider,
      providerEventId: payload.provider_event_id,
      orderId: order.id,
      orderUuid: payload.order_uuid,
      amountVnd: payload.amount_vnd,
      status: "success",
      rawPayload: payload,
      reconciledAt: now,
      createdAt: now,
    });

    return {
      success: true,
      orderUuid: order.uuid,
      orderStatus: "approved",
      isDuplicate: false,
    };
  });
}

/**
 * Reconcile internal ledger against external provider transactions.
 * BR-APM-06: Flag mismatches, do not auto-modify amounts or blindly grant entitlements.
 */
export async function reconcileAutomatedPayments(params: {
  provider: AutomatedPaymentProvider;
  records: Array<{
    providerEventId: string;
    orderUuid: string;
    amountVnd: number;
    status: string;
    timestamp: Date;
  }>;
}): Promise<{
  totalChecked: number;
  matchedCount: number;
  mismatchedCount: number;
  mismatches: Array<{
    providerEventId: string;
    orderUuid: string;
    reason: string;
  }>;
}> {
  const db = getOwnerDb();
  const mismatches: Array<{
    providerEventId: string;
    orderUuid: string;
    reason: string;
  }> = [];

  let matchedCount = 0;

  for (const record of params.records) {
    const [txRecord] = await db
      .select()
      .from(paymentTransactions)
      .where(
        and(
          eq(paymentTransactions.provider, params.provider),
          eq(paymentTransactions.providerEventId, record.providerEventId)
        )
      )
      .limit(1);

    if (!txRecord) {
      mismatches.push({
        providerEventId: record.providerEventId,
        orderUuid: record.orderUuid,
        reason: "TRANSACTION_MISSING_IN_INTERNAL_LEDGER",
      });
      continue;
    }

    if (txRecord.amountVnd !== record.amountVnd) {
      mismatches.push({
        providerEventId: record.providerEventId,
        orderUuid: record.orderUuid,
        reason: `AMOUNT_MISMATCH: expected ${txRecord.amountVnd}, provider reported ${record.amountVnd}`,
      });
      continue;
    }

    matchedCount++;
  }

  return {
    totalChecked: params.records.length,
    matchedCount,
    mismatchedCount: mismatches.length,
    mismatches,
  };
}

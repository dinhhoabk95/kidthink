import {
  auditLogs,
  entitlements,
  getOwnerDb,
  paymentOrders,
  paymentTransactions,
} from "@mindkid/db";
import {
  OrderNotFoundError,
  ReconciliationMismatchError,
  WebhookReplayDetectedError,
} from "@mindkid/errors/billing";
import { ValidationError } from "@mindkid/errors/common";
import {
  type AutomatedPaymentProvider,
  type AutomatedPaymentWebhookPayload,
  assertPaymentOrderTransition,
  canTransitionPaymentOrderStatus,
  isWebhookWithinReplayWindow,
  PACKAGE_CATALOG,
} from "@mindkid/shared";
import { and, eq, inArray } from "drizzle-orm";

/** Nguồn duy nhất được dùng cạnh bổ sung của máy trạng thái (BR-APM-08). */
const WEBHOOK_TRANSITION = { source: "verified_gateway_webhook" } as const;

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
  if (!pkgDef) {
    throw new ValidationError(`Gói cước không hợp lệ: ${packageCode}`);
  }
  const offerDef = pkgDef.offers.find((o) => o.offer_code === offerCode);
  const durationDays = offerDef?.duration_days ?? 365;
  const newExpiry = new Date(
    now.getTime() + durationDays * 24 * 60 * 60 * 1000
  );
  const entitlementKeysToGrant = pkgDef.entitlements;

  const existingRows = await tx
    .select()
    .from(entitlements)
    .where(
      and(
        eq(entitlements.userId, userId),
        inArray(entitlements.entitlementKey, entitlementKeysToGrant),
        inArray(entitlements.status, ["active", "soft_unlock", "grace_period"])
      )
    )
    .catch(() => [] as (typeof entitlements.$inferSelect)[]);

  const existingMap = new Map<string, typeof entitlements.$inferSelect>();
  for (const row of existingRows) {
    if (!existingMap.has(row.entitlementKey)) {
      existingMap.set(row.entitlementKey, row);
    }
  }

  for (const key of entitlementKeysToGrant) {
    let existingEntitlement = existingMap.get(key);
    if (!existingEntitlement && existingRows.length === 0) {
      const [singleRow] = await tx
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
        .limit(1)
        .catch(() => [] as (typeof entitlements.$inferSelect)[]);
      existingEntitlement = singleRow;
    }

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

  const isPendingOrDraft =
    order.status === "pending" || order.status === "draft";
  let finalOrderStatus = order.status;
  if (isPendingOrDraft) {
    finalOrderStatus = payload.status === "cancelled" ? "cancelled" : "expired";
  }

  if (order.status === "pending" || order.status === "draft") {
    await tx
      .update(paymentOrders)
      .set({
        status: finalOrderStatus,
        updatedAt: now,
      })
      .where(eq(paymentOrders.id, order.id));
  }

  return {
    success: true,
    orderUuid: order.uuid,
    orderStatus: finalOrderStatus,
    isDuplicate: false,
  };
}

const MISMATCH_FLAGGED = Symbol("mismatch_flagged");

/**
 * Lệch tiền: ghi giao dịch `mismatch` (khoá idempotency), chuyển đơn sang
 * `under_review` nếu máy trạng thái cho phép, ghi audit. Không cấp quyền.
 */
async function flagAmountMismatch(
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
    status: "mismatch",
    rawPayload: payload,
    createdAt: now,
  });

  const movesToReview =
    order.status !== "under_review" &&
    canTransitionPaymentOrderStatus(
      order.status,
      "under_review",
      WEBHOOK_TRANSITION
    );
  if (movesToReview) {
    await tx
      .update(paymentOrders)
      .set({
        status: "under_review",
        adminNote: `Lệch số tiền từ cổng [${payload.provider}:${payload.provider_event_id}]: đơn ${order.amountVnd}, cổng báo ${payload.amount_vnd}`,
        updatedAt: now,
      })
      .where(eq(paymentOrders.id, order.id));
  }

  await tx.insert(auditLogs).values({
    actorType: "system",
    actorId: null,
    action: "payment_order.mismatch_flagged",
    entityType: "payment_order",
    entityId: String(order.id),
    beforeData: { status: order.status },
    afterData: {
      order_uuid: order.uuid,
      provider: payload.provider,
      provider_event_id: payload.provider_event_id,
      expected_amount_vnd: order.amountVnd,
      reported_amount_vnd: payload.amount_vnd,
      status: movesToReview ? "under_review" : order.status,
    },
    createdAt: now,
  });
}

/**
 * Process verified automated payment webhook with exactly-once semantics.
 * BR-APM-01..08
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
    throw new WebhookReplayDetectedError();
  }

  const db = getOwnerDb();

  const outcome = await db.transaction(
    async (tx): Promise<ProcessWebhookResult | typeof MISMATCH_FLAGGED> => {
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

      // 3. Lookup Order — khoá hàng để hai webhook khác `provider_event_id`
      // cho cùng một đơn chạy tuần tự: đơn chỉ được duyệt và cấp quyền một lần.
      const [order] = await tx
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.uuid, payload.order_uuid))
        .limit(1)
        .for("update");

      if (!order) {
        throw new OrderNotFoundError(payload.order_uuid);
      }

      // 4. Lệch tiền chỉ tính trên tiền thực thu, tức webhook `success`
      // (automated-payment §5, BR-APM-08). Webhook failed/cancelled không có
      // tiền về nên không đẩy đơn sang `under_review`.
      if (
        payload.status === "success" &&
        order.amountVnd !== payload.amount_vnd
      ) {
        await flagAmountMismatch(tx, order, payload, now);
        return MISMATCH_FLAGGED;
      }

      // 5. If webhook status is failed or cancelled
      if (payload.status !== "success") {
        return await handleNonSuccessWebhook(tx, order, payload, now);
      }

      // 6. Webhook status is success -> Atomic state transition + Entitlements + Audit
      if (order.status !== "approved") {
        assertPaymentOrderTransition(
          order.status,
          "approved",
          WEBHOOK_TRANSITION
        );

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
    }
  );

  // Ném SAU khi transaction đã commit để dấu `mismatch` + `under_review` còn lại.
  if (outcome === MISMATCH_FLAGGED) {
    throw new ReconciliationMismatchError();
  }
  return outcome;
}

/**
 * Reconcile internal ledger against external provider transactions.
 * BR-APM-06: Flag mismatches, do not auto-modify amounts or blindly grant entitlements.
 */
function normalizeTxStatus(
  status: string
): "success" | "cancelled" | "failed" | "other" {
  const s = status.toLowerCase();
  if (["success", "paid", "approved", "completed"].includes(s)) {
    return "success";
  }
  if (["cancelled", "canceled"].includes(s)) {
    return "cancelled";
  }
  if (["failed", "expired"].includes(s)) {
    return "failed";
  }
  return "other";
}

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

  const eventIds = params.records.map((r) => r.providerEventId).filter(Boolean);
  const existingTxs =
    eventIds.length > 0
      ? await db
          .select()
          .from(paymentTransactions)
          .where(
            and(
              eq(paymentTransactions.provider, params.provider),
              inArray(paymentTransactions.providerEventId, eventIds)
            )
          )
      : [];

  const txMap = new Map(existingTxs.map((tx) => [tx.providerEventId, tx]));

  for (const record of params.records) {
    const txRecord = txMap.get(record.providerEventId);

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

    if (
      normalizeTxStatus(record.status) !== normalizeTxStatus(txRecord.status)
    ) {
      mismatches.push({
        providerEventId: record.providerEventId,
        orderUuid: record.orderUuid,
        reason:
          "Trạng thái giao dịch lệch giữa cổng thanh toán và sổ cái nội bộ",
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

import { writeAudit } from "@mindkid/audit";
import {
  ACTOR_TYPE,
  ENTITLEMENT_SOURCE,
  ENTITLEMENT_STATUS,
  ENTITLEMENT_STATUS_CODEC,
  PAYMENT_ORDER_STATUS,
  PAYMENT_ORDER_STATUS_CODEC,
  type PaymentOrderEntity,
} from "@mindkid/db";
import {
  createRepositories,
  type MindKidRepositories,
} from "@mindkid/db/repositories";
import {
  OrderNotFoundError,
  ReconciliationMismatchError,
  WebhookReplayDetectedError,
} from "@mindkid/errors/billing";
import { ValidationError } from "@mindkid/errors/common";
import {
  type AutomatedPaymentProvider,
  type AutomatedPaymentWebhookPayload,
  activeStackBase,
  assertPaymentOrderTransition,
  canTransitionPaymentOrderStatus,
  computeStackedExpiryDate,
  isWebhookWithinReplayWindow,
  PACKAGE_CATALOG,
} from "@mindkid/shared";
import { invalidateUserEntitlementsCache } from "#server/utils/entitlements-runtime";
import { useOwnerRepositories } from "#server/utils/repositories";

/** Nguồn duy nhất được dùng cạnh bổ sung của máy trạng thái (BR-APM-08). */
const WEBHOOK_TRANSITION = { source: "verified_gateway_webhook" } as const;

export interface ProcessWebhookResult {
  success: boolean;
  orderUuid: string;
  orderStatus: string;
  isDuplicate: boolean;
  mismatchReason?: string;
}

export interface RunReconciliationWithAuditInput {
  readonly managerId: number;
  readonly provider: AutomatedPaymentProvider;
  readonly records: Array<{
    providerEventId: string;
    orderUuid: string;
    amountVnd: number;
    status: string;
    timestamp: Date;
  }>;
  readonly reason: string;
  readonly ipAddress: string;
  readonly userAgent: string;
}

function toWebhookJsonPayload(
  payload: AutomatedPaymentWebhookPayload
): Record<string, string | number | boolean | null> {
  return {
    provider: payload.provider,
    provider_event_id: payload.provider_event_id,
    order_uuid: payload.order_uuid,
    amount_vnd: payload.amount_vnd,
    status: payload.status,
    timestamp_seconds: payload.timestamp_seconds,
    merchant_id: payload.merchant_id,
    mode: payload.mode,
  };
}

async function grantOrStackEntitlements(
  txRepos: MindKidRepositories,
  userId: number,
  packageCode: string,
  offerCode: string,
  orderUuid: string,
  now: Date
): Promise<void> {
  const pkgDef = PACKAGE_CATALOG[packageCode];
  if (!pkgDef) {
    throw new ValidationError(`Gói cước không hợp lệ: ${packageCode}`);
  }
  const offerDef = pkgDef.offers.find((o) => o.offer_code === offerCode);
  const durationDays = offerDef ? offerDef.duration_days : 365;
  const entitlementKeysToGrant = pkgDef.entitlements;

  for (const key of entitlementKeysToGrant) {
    const existingEntitlement = await txRepos.entitlements.findByUserAndKey(
      userId,
      key
    );

    if (existingEntitlement) {
      const stackBase = activeStackBase({
        status: ENTITLEMENT_STATUS_CODEC.toLabel(existingEntitlement.status),
        expiresAt: existingEntitlement.expiresAt,
      });
      const stackedExpiry = computeStackedExpiryDate(
        stackBase,
        durationDays,
        0,
        now
      );
      await txRepos.entitlements.updateEntitlementById(existingEntitlement.id, {
        status: ENTITLEMENT_STATUS.ACTIVE,
        source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
        sourceRef: orderUuid,
        grantedAt:
          existingEntitlement.status === ENTITLEMENT_STATUS.ACTIVE
            ? existingEntitlement.grantedAt
            : now,
        expiresAt: stackedExpiry,
        updatedAt: now,
      });
    } else {
      const freshExpiry = computeStackedExpiryDate(
        undefined,
        durationDays,
        0,
        now
      );
      await txRepos.entitlements.grantEntitlement({
        userId,
        entitlementKey: key,
        source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
        sourceRef: orderUuid,
        status: ENTITLEMENT_STATUS.ACTIVE,
        grantedAt: now,
        expiresAt: freshExpiry,
      });
    }
  }
}

async function handleNonSuccessWebhook(
  txRepos: MindKidRepositories,
  order: PaymentOrderEntity,
  payload: AutomatedPaymentWebhookPayload,
  now: Date
): Promise<ProcessWebhookResult> {
  await txRepos.recurringSubscriptions.insertTransaction({
    provider: payload.provider,
    providerEventId: payload.provider_event_id,
    orderId: order.id,
    orderUuid: payload.order_uuid,
    amountVnd: payload.amount_vnd,
    status: payload.status,
    rawPayload: toWebhookJsonPayload(payload),
    createdAt: now,
  });

  const isPendingOrDraft =
    order.status === PAYMENT_ORDER_STATUS.PENDING ||
    order.status === PAYMENT_ORDER_STATUS.DRAFT;
  let finalOrderStatus = order.status;
  if (isPendingOrDraft) {
    finalOrderStatus =
      payload.status === "cancelled"
        ? PAYMENT_ORDER_STATUS.CANCELLED
        : PAYMENT_ORDER_STATUS.EXPIRED;
    await txRepos.orders.updateOrderStatus(order.id, finalOrderStatus, {
      updatedAt: now,
    });
  }

  return {
    success: true,
    orderUuid: order.uuid,
    orderStatus: PAYMENT_ORDER_STATUS_CODEC.toLabel(finalOrderStatus),
    isDuplicate: false,
  };
}

const MISMATCH_FLAGGED = Symbol("mismatch_flagged");

/**
 * Lệch tiền: ghi giao dịch `mismatch` (khoá idempotency), chuyển đơn sang
 * `under_review` nếu máy trạng thái cho phép, ghi audit. Không cấp quyền.
 */
async function flagAmountMismatch(
  txRepos: MindKidRepositories,
  order: PaymentOrderEntity,
  payload: AutomatedPaymentWebhookPayload,
  now: Date
): Promise<void> {
  await txRepos.recurringSubscriptions.insertTransaction({
    provider: payload.provider,
    providerEventId: payload.provider_event_id,
    orderId: order.id,
    orderUuid: payload.order_uuid,
    amountVnd: payload.amount_vnd,
    status: "mismatch",
    rawPayload: toWebhookJsonPayload(payload),
    createdAt: now,
  });

  const currentStatusLabel = PAYMENT_ORDER_STATUS_CODEC.toLabel(order.status);
  const movesToReview =
    order.status !== PAYMENT_ORDER_STATUS.UNDER_REVIEW &&
    canTransitionPaymentOrderStatus(
      currentStatusLabel,
      "under_review",
      WEBHOOK_TRANSITION
    );
  if (movesToReview) {
    await txRepos.orders.updateOrderStatus(
      order.id,
      PAYMENT_ORDER_STATUS.UNDER_REVIEW,
      {
        adminNote: `Lệch số tiền từ cổng [${payload.provider}:${payload.provider_event_id}]: đơn ${order.amountVnd}, cổng báo ${payload.amount_vnd}`,
        updatedAt: now,
      }
    );
  }

  await txRepos.auditLogs.insertLog({
    actorType: ACTOR_TYPE.SYSTEM,
    actorId: null,
    action: "payment_order.mismatch_flagged",
    entityType: "payment_order",
    entityId: String(order.id),
    beforeData: { status: currentStatusLabel },
    afterData: {
      order_uuid: order.uuid,
      provider: payload.provider,
      provider_event_id: payload.provider_event_id,
      expected_amount_vnd: order.amountVnd,
      reported_amount_vnd: payload.amount_vnd,
      status: movesToReview ? "under_review" : currentStatusLabel,
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

  if (
    !isWebhookWithinReplayWindow(
      payload.timestamp_seconds,
      currentTimestampSeconds
    )
  ) {
    throw new WebhookReplayDetectedError();
  }

  const repos = useOwnerRepositories();
  let approvedUserId = 0;

  const outcome = await repos.orders.transaction(
    async (tx): Promise<ProcessWebhookResult | typeof MISMATCH_FLAGGED> => {
      const txRepos = createRepositories(tx);

      const existingTx =
        await txRepos.recurringSubscriptions.findTransactionByProviderEvent(
          payload.provider,
          payload.provider_event_id
        );

      if (existingTx) {
        const existingOrder = await txRepos.orders.findByUuid(
          payload.order_uuid
        );

        return {
          success: true,
          orderUuid: payload.order_uuid,
          orderStatus: existingOrder
            ? PAYMENT_ORDER_STATUS_CODEC.toLabel(existingOrder.status)
            : "unknown",
          isDuplicate: true,
        };
      }

      const order = await txRepos.orders.findByUuidForUpdate(
        payload.order_uuid
      );

      if (!order) {
        throw new OrderNotFoundError(payload.order_uuid);
      }

      if (
        payload.status === "success" &&
        order.amountVnd !== payload.amount_vnd
      ) {
        await flagAmountMismatch(txRepos, order, payload, now);
        return MISMATCH_FLAGGED;
      }

      if (payload.status !== "success") {
        return await handleNonSuccessWebhook(txRepos, order, payload, now);
      }

      if (order.status !== PAYMENT_ORDER_STATUS.APPROVED) {
        assertPaymentOrderTransition(
          PAYMENT_ORDER_STATUS_CODEC.toLabel(order.status),
          "approved",
          WEBHOOK_TRANSITION
        );

        await txRepos.orders.updateOrderStatus(
          order.id,
          PAYMENT_ORDER_STATUS.APPROVED,
          {
            reviewedAt: now,
            adminNote: `Approved via automated gateway webhook [${payload.provider}:${payload.provider_event_id}]`,
            updatedAt: now,
          }
        );

        await grantOrStackEntitlements(
          txRepos,
          order.userId,
          order.packageCode,
          order.offerCode,
          order.uuid,
          now
        );
        approvedUserId = order.userId;

        await txRepos.auditLogs.insertLog({
          actorType: ACTOR_TYPE.SYSTEM,
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

      await txRepos.recurringSubscriptions.insertTransaction({
        provider: payload.provider,
        providerEventId: payload.provider_event_id,
        orderId: order.id,
        orderUuid: payload.order_uuid,
        amountVnd: payload.amount_vnd,
        status: "success",
        rawPayload: toWebhookJsonPayload(payload),
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

  if (approvedUserId > 0) {
    await invalidateUserEntitlementsCache(approvedUserId);
  }

  if (outcome === MISMATCH_FLAGGED) {
    throw new ReconciliationMismatchError();
  }
  return outcome;
}

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
  const repos = useOwnerRepositories();
  const mismatches: Array<{
    providerEventId: string;
    orderUuid: string;
    reason: string;
  }> = [];

  let matchedCount = 0;

  const eventIds = params.records.map((r) => r.providerEventId).filter(Boolean);
  const existingTxs =
    eventIds.length > 0
      ? await repos.recurringSubscriptions.listTransactionsByProviderEvents(
          params.provider,
          eventIds
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

export async function getAutomatedPaymentReconciliation(
  provider: AutomatedPaymentProvider,
  limit: number
) {
  const repos = useOwnerRepositories();
  const transactions =
    await repos.recurringSubscriptions.listTransactionsByProvider(
      provider,
      limit
    );

  const orderUuids = transactions.map((t) => t.orderUuid);
  const orders = await repos.orders.listByUuids(orderUuids);

  const orderAmountByUuid = new Map<string, number>();
  for (const o of orders) {
    orderAmountByUuid.set(o.uuid, o.amountVnd);
  }

  const report = await reconcileAutomatedPayments({
    provider,
    records: transactions.map((t) => ({
      providerEventId: t.providerEventId,
      orderUuid: t.orderUuid,
      amountVnd: orderAmountByUuid.get(t.orderUuid) ?? t.amountVnd,
      status: t.status,
      timestamp: t.createdAt,
    })),
  });

  return {
    provider,
    items: transactions.map((t) => ({
      id: t.id,
      provider: t.provider,
      provider_event_id: t.providerEventId,
      order_uuid: t.orderUuid,
      amount_vnd: t.amountVnd,
      status: t.status,
      reconciled_at: t.reconciledAt,
      created_at: t.createdAt,
    })),
    summary: {
      total_checked: report.totalChecked,
      matched_count: report.matchedCount,
      mismatched_count: report.mismatchedCount,
    },
    mismatches: report.mismatches,
  };
}

export async function runAutomatedPaymentReconciliation(
  input: RunReconciliationWithAuditInput
) {
  const report = await reconcileAutomatedPayments({
    provider: input.provider,
    records: input.records,
  });

  const repos = useOwnerRepositories();
  await repos.orders.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: input.managerId,
      action: "data_exported",
      reason: input.reason,
      entity_type: "payment_reconciliation",
      entity_id: input.provider,
      after_data: {
        provider: input.provider,
        total_checked: report.totalChecked,
        matched_count: report.matchedCount,
        mismatched_count: report.mismatchedCount,
        mismatches: report.mismatches,
      },
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
    });
  });

  return {
    ok: true,
    provider: input.provider,
    total_checked: report.totalChecked,
    matched_count: report.matchedCount,
    mismatched_count: report.mismatchedCount,
    mismatches: report.mismatches,
  };
}

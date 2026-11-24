import { writeAudit } from "@mindkid/audit";
import { PROOF_SIGNED_URL_TTL_MINUTES } from "@mindkid/config";
import {
  ACTOR_TYPE,
  AI_CREDIT_REASON,
  ENTITLEMENT_SOURCE,
  ENTITLEMENT_STATUS,
  ENTITLEMENT_STATUS_CODEC,
  PAYMENT_ORDER_STATUS,
  PAYMENT_ORDER_STATUS_CODEC,
  type PaymentOrderEntity,
  type PaymentOrderWithUserEntity,
  RECIPIENT_TYPE,
  USER_STATUS_CODEC,
} from "@mindkid/db";
import {
  createRepositories,
  type MindKidRepositories,
} from "@mindkid/db/repositories";
import {
  OrderAlreadyProcessedError,
  OrderNotFoundError,
} from "@mindkid/errors/billing";
import { NotFoundError } from "@mindkid/errors/common";
import {
  activeStackBase,
  assertPaymentOrderTransition,
  computeStackedExpiryDate,
  PACKAGE_CATALOG,
} from "@mindkid/shared";
import { getPrivateSignedUrl } from "@mindkid/storage";
import { invalidateUserEntitlementsCache } from "#server/utils/entitlements-runtime";
import { useRepositories } from "#server/utils/repositories";

export interface ApproveManagerOrderInput {
  readonly managerId: number;
  readonly orderUuid: string;
  readonly adminNote: string;
  readonly checklist: {
    readonly amount_matches: true;
    readonly transfer_note_present: true;
    readonly bank_ref_unused: true;
    readonly transfer_time_valid: true;
    readonly proof_legible: true;
  };
  readonly bonusDays: number;
  readonly ipAddress: string;
  readonly userAgent: string | null;
}

export interface RejectManagerOrderInput {
  readonly managerId: number;
  readonly orderUuid: string;
  readonly adminNote: string;
  readonly ipAddress: string;
  readonly userAgent: string | null;
}

export interface GetManagerOrderProofUrlInput {
  readonly managerId: number;
  readonly orderUuid: string;
  readonly ipAddress: string;
  readonly userAgent: string | null;
}

function resolveOrderCode(transferNote: string | null, uuid: string): string {
  if (transferNote && transferNote.trim().length > 0) {
    return transferNote.trim();
  }
  return uuid.slice(0, 8).toUpperCase();
}

function mapPriorOrders(rows: readonly PaymentOrderEntity[]) {
  return rows.map((row) => ({
    uuid: row.uuid,
    order_code: resolveOrderCode(row.transferNote, row.uuid),
    package_code: row.packageCode,
    offer_code: row.offerCode,
    amount_vnd: row.amountVnd,
    status: PAYMENT_ORDER_STATUS_CODEC.toLabel(row.status),
    submitted_at: row.submittedAt,
    created_at: row.createdAt,
  }));
}

function mapDuplicateOrders(rows: readonly PaymentOrderWithUserEntity[]) {
  return rows.map((dup) => ({
    uuid: dup.uuid,
    order_code: resolveOrderCode(dup.transferNote, dup.uuid),
    status: PAYMENT_ORDER_STATUS_CODEC.toLabel(dup.status),
    submitted_at: dup.submittedAt,
    user_email: dup.user.email,
  }));
}

function buildOrderDetailPayload(
  order: PaymentOrderWithUserEntity,
  childProfilesCount: number,
  priorOrders: ReturnType<typeof mapPriorOrders>,
  duplicateOrders: ReturnType<typeof mapDuplicateOrders>,
  reviewedBy: { uuid: string; email: string; display_name: string } | null
) {
  const pkg = PACKAGE_CATALOG[order.packageCode];
  const offer = pkg?.offers.find((item) => item.offer_code === order.offerCode);
  const hasProof = Boolean(order.proofPath);
  const orderCode = resolveOrderCode(order.transferNote, order.uuid);
  const userHasPriorRejection = priorOrders.some(
    (o) => o.status === "rejected"
  );
  const orderStatusLabel = PAYMENT_ORDER_STATUS_CODEC.toLabel(order.status);

  return {
    order: {
      uuid: order.uuid,
      order_code: orderCode,
      package_code: order.packageCode,
      package_name_vi: pkg?.name ?? order.packageCode,
      offer_code: order.offerCode,
      duration_days: offer?.duration_days ?? 365,
      amount_vnd: order.amountVnd,
      currency: order.currency,
      status: orderStatusLabel,
      transfer_note: order.transferNote ?? orderCode,
      bank_txn_ref: order.bankTxnRef,
      has_proof: hasProof,
      has_proof_image: hasProof,
      transferred_at: order.submittedAt,
      submitted_at: order.submittedAt,
      reviewed_at: order.reviewedAt,
      reviewed_by_manager_id: order.reviewedByManagerId,
      reviewed_by: reviewedBy,
      rejection_reason:
        order.status === PAYMENT_ORDER_STATUS.REJECTED ? order.adminNote : null,
      admin_note: order.adminNote,
      expires_at: order.expiresAt,
      created_at: order.createdAt,
    },
    user: {
      id: order.userId,
      uuid: order.user.uuid,
      email: order.user.email,
      display_name: order.user.displayName,
      status: USER_STATUS_CODEC.toLabel(order.user.status),
      created_at: order.user.createdAt,
      child_profiles_count: childProfilesCount,
      prior_orders: priorOrders,
    },
    flags: {
      duplicate_bank_txn_ref: duplicateOrders.length > 0,
      user_has_prior_rejected_order: userHasPriorRejection,
    },
    duplicate_orders: duplicateOrders,
    prior_orders: priorOrders,
  };
}

export async function getManagerOrderDetail(orderUuid: string) {
  const repos = useRepositories();
  const order = await repos.orders.findDetailByUuid(orderUuid);

  if (!order) {
    throw new NotFoundError();
  }

  const [childCountsMap, priorOrderEntities, duplicateOrderRows, manager] =
    await Promise.all([
      repos.childProfiles.countAllByUsers([order.userId]),
      repos.orders.listPriorOrdersForUser(order.userId, order.id),
      order.bankTxnRef && order.bankTxnRef.trim().length > 0
        ? repos.orders.listDuplicateBankTxnRefOrders(order.bankTxnRef, order.id)
        : Promise.resolve([]),
      order.reviewedByManagerId
        ? repos.managers.findById(order.reviewedByManagerId)
        : Promise.resolve(null),
    ]);

  const reviewedBy = manager
    ? {
        uuid: manager.uuid,
        email: manager.email,
        display_name: manager.displayName,
      }
    : null;

  return buildOrderDetailPayload(
    order,
    childCountsMap.get(order.userId) ?? 0,
    mapPriorOrders(priorOrderEntities),
    mapDuplicateOrders(duplicateOrderRows),
    reviewedBy
  );
}

export async function claimManagerOrder(orderUuid: string, managerId: number) {
  const repos = useRepositories();
  const order = await repos.orders.findByUuid(orderUuid);

  if (!order) {
    throw new NotFoundError();
  }

  let warning: string | undefined;
  if (
    order.status === PAYMENT_ORDER_STATUS.UNDER_REVIEW &&
    order.reviewedByManagerId &&
    order.reviewedByManagerId !== managerId
  ) {
    warning = "Đơn hàng đang được xem xét bởi quản trị viên khác.";
  }

  let updatedStatus = order.status;
  if (order.status === PAYMENT_ORDER_STATUS.SUBMITTED) {
    const updated = await repos.orders.claimForReview(orderUuid, managerId);
    if (updated) {
      updatedStatus = updated.status;
    }
  }

  return {
    uuid: order.uuid,
    status: PAYMENT_ORDER_STATUS_CODEC.toLabel(updatedStatus),
    reviewed_by_manager_id: managerId,
    warning,
  };
}

async function grantEntitlementsForOrder(
  txRepos: MindKidRepositories,
  orderUserId: number,
  orderUuid: string,
  managerId: number,
  packageCode: string,
  offerCode: string,
  bonusDays: number,
  adminNote: string,
  now: Date
): Promise<Array<{ key: string; expires_at: Date | null }>> {
  const pkg = PACKAGE_CATALOG[packageCode];
  const offer = pkg?.offers.find((o) => o.offer_code === offerCode);
  const offerDurationDays = offer ? offer.duration_days : 365;
  const entitlementKeys = pkg?.entitlements || [];

  const results: Array<{ key: string; expires_at: Date | null }> = [];
  for (const key of entitlementKeys) {
    const existing = await txRepos.entitlements.findByUserAndKey(
      orderUserId,
      key
    );

    const newExpiresAt = computeStackedExpiryDate(
      activeStackBase(
        existing
          ? {
              status: ENTITLEMENT_STATUS_CODEC.toLabel(existing.status),
              expiresAt: existing.expiresAt,
            }
          : undefined
      ),
      offerDurationDays,
      bonusDays,
      now
    );

    if (existing) {
      await txRepos.entitlements.updateEntitlementById(existing.id, {
        status: ENTITLEMENT_STATUS.ACTIVE,
        source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
        sourceRef: orderUuid,
        expiresAt: newExpiresAt,
        grantedByManagerId: managerId,
        grantReason: adminNote,
        updatedAt: now,
      });
    } else {
      await txRepos.entitlements.grantEntitlement({
        userId: orderUserId,
        entitlementKey: key,
        source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
        sourceRef: orderUuid,
        status: ENTITLEMENT_STATUS.ACTIVE,
        grantedAt: now,
        expiresAt: newExpiresAt,
        grantedByManagerId: managerId,
        grantReason: adminNote,
      });
    }

    results.push({
      key,
      expires_at: newExpiresAt,
    });
  }
  return results;
}

export async function approveManagerOrder(input: ApproveManagerOrderInput) {
  const repos = useRepositories();
  const now = new Date();
  let orderUserId = 0;
  let grantedEntitlements: Array<{ key: string; expires_at: Date | null }> = [];

  await repos.orders.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const order = await txRepos.orders.findByUuidForUpdate(input.orderUuid);

    if (!order) {
      throw new NotFoundError();
    }

    const currentStatus = PAYMENT_ORDER_STATUS_CODEC.toLabel(order.status);
    if (currentStatus !== "submitted" && currentStatus !== "under_review") {
      throw new OrderAlreadyProcessedError({
        current_status: currentStatus,
        reason: "Đơn hàng đã được xử lý hoặc không ở trạng thái có thể duyệt.",
      });
    }

    assertPaymentOrderTransition(currentStatus, "approved");
    orderUserId = order.userId;

    const structuredAdminNote = JSON.stringify({
      note: input.adminNote,
      checklist: input.checklist,
      bonus_days: input.bonusDays,
    });

    const approvedOrder = await txRepos.orders.approveOrder(
      order.uuid,
      input.managerId,
      structuredAdminNote,
      now
    );

    if (!approvedOrder) {
      throw new OrderAlreadyProcessedError({
        current_status: currentStatus,
        reason: "Đơn hàng vừa được quản trị viên khác xử lý.",
      });
    }

    grantedEntitlements = await grantEntitlementsForOrder(
      txRepos,
      order.userId,
      order.uuid,
      input.managerId,
      order.packageCode,
      order.offerCode,
      input.bonusDays,
      input.adminNote,
      now
    );

    const pkg = PACKAGE_CATALOG[order.packageCode];
    if (pkg?.credits_grant && pkg.credits_grant > 0) {
      await txRepos.aiCredits.grantCreditsAtomic({
        userId: order.userId,
        delta: pkg.credits_grant,
        reason: AI_CREDIT_REASON.PURCHASE,
        refType: "payment_order",
        refId: order.uuid,
        idempotencyKey: `order-approve-credits-${order.uuid}`,
        createdAt: now,
      });
    }

    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: input.managerId,
      action: "order_approved",
      entity_type: "payment_order",
      entity_id: order.uuid,
      before_data: { status: currentStatus },
      after_data: {
        status: "approved",
        bonus_days: input.bonusDays,
        checklist: input.checklist,
      },
      reason: input.adminNote,
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
    });

    if (input.bonusDays > 0) {
      await writeAudit(tx, {
        actor_type: "manager",
        actor_id: input.managerId,
        action: "bonus_days_granted",
        entity_type: "payment_order",
        entity_id: order.uuid,
        before_data: { bonus_days: 0 },
        after_data: {
          bonus_days: input.bonusDays,
          user_id: order.userId,
          package_code: order.packageCode,
        },
        reason: input.adminNote,
        ip_address: input.ipAddress,
        user_agent: input.userAgent,
      });
    }

    await txRepos.notifications.createInAppNotification({
      recipientType: RECIPIENT_TYPE.USER,
      recipientId: order.userId,
      templateCode: "order_approved",
      payload: {
        order_uuid: order.uuid,
        package_code: order.packageCode,
        offer_code: order.offerCode,
        bonus_days: input.bonusDays,
      },
      createdAt: now,
    });
  });

  if (orderUserId > 0) {
    await invalidateUserEntitlementsCache(orderUserId);
  }

  return {
    status: "approved",
    entitlements: grantedEntitlements,
  };
}

export async function rejectManagerOrder(input: RejectManagerOrderInput) {
  const repos = useRepositories();
  const now = new Date();
  let orderUserId = 0;
  let revokedKeys: string[] = [];

  await repos.orders.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const order = await txRepos.orders.findByUuidForUpdate(input.orderUuid);

    if (!order) {
      throw new NotFoundError();
    }

    const currentStatus = PAYMENT_ORDER_STATUS_CODEC.toLabel(order.status);
    if (currentStatus !== "submitted" && currentStatus !== "under_review") {
      throw new OrderAlreadyProcessedError({
        current_status: currentStatus,
        reason:
          "Đơn hàng đã được xử lý hoặc không ở trạng thái có thể từ chối.",
      });
    }

    assertPaymentOrderTransition(currentStatus, "rejected");
    orderUserId = order.userId;

    const rejectedOrder = await txRepos.orders.rejectOrder(
      order.uuid,
      input.managerId,
      input.adminNote,
      now
    );

    if (!rejectedOrder) {
      throw new OrderAlreadyProcessedError({
        current_status: currentStatus,
        reason: "Đơn hàng vừa được quản trị viên khác xử lý.",
      });
    }

    revokedKeys = await txRepos.entitlements.revokeByUserAndSourceRef(
      order.userId,
      order.uuid,
      now
    );

    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: input.managerId,
      action: "order_rejected",
      entity_type: "payment_order",
      entity_id: order.uuid,
      before_data: { status: currentStatus },
      after_data: {
        status: "rejected",
        revoked_entitlements_count: revokedKeys.length,
      },
      reason: input.adminNote,
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
    });

    await txRepos.notifications.createInAppNotification({
      recipientType: RECIPIENT_TYPE.USER,
      recipientId: order.userId,
      templateCode: "order_rejected",
      payload: {
        order_uuid: order.uuid,
        package_code: order.packageCode,
        offer_code: order.offerCode,
        polite_reason:
          "Thông tin chứng từ hoặc mã giao dịch chưa khớp với sao kê ngân hàng. Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ.",
      },
      createdAt: now,
    });
  });

  if (orderUserId > 0) {
    await invalidateUserEntitlementsCache(orderUserId);
  }

  return {
    status: "rejected",
    revoked_entitlements: revokedKeys,
  };
}

export async function getManagerOrderProofUrl(
  input: GetManagerOrderProofUrlInput
) {
  const repos = useRepositories();
  const order = await repos.orders.findByUuid(input.orderUuid);

  if (!order?.proofPath) {
    throw new OrderNotFoundError(input.orderUuid);
  }

  const signed = await getPrivateSignedUrl({
    path: order.proofPath,
    expiresInMinutes: PROOF_SIGNED_URL_TTL_MINUTES,
  });

  await repos.auditLogs.insertLog({
    actorType: ACTOR_TYPE.MANAGER,
    actorId: input.managerId,
    action: "proof_viewed",
    entityType: "payment_order",
    entityId: order.uuid,
    beforeData: null,
    afterData: {
      proof_path: order.proofPath,
      signed_url_expires_at: signed.expiresAt.toISOString(),
    },
    reason: "Manager viewed payment proof image",
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return {
    url: signed.url,
    expires_at: signed.expiresAt,
  };
}

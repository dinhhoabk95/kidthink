import {
  ACTOR_TYPE,
  ENTITLEMENT_SOURCE,
  ENTITLEMENT_STATUS,
  type MindKidRepositories,
  NOTIFICATION_CHANNEL,
  NOTIFICATION_STATUS,
  PAYMENT_ORDER_STATUS,
  RECIPIENT_TYPE,
  RECURRING_SUBSCRIPTION_STATUS,
} from "#src/index";
import {
  AUDIT_1_UUID,
  AUDIT_2_UUID,
  FIXED_EXPIRES_FUTURE,
  FIXED_T0,
  FIXED_T1,
  FIXED_T2,
  FIXED_T3,
  NOTIF_1_UUID,
  ORDER_1_UUID,
  ORDER_2_UUID,
} from "#tests/repositories/parity-helpers";

export async function runOrdersEntitlementsSubscriptionsScenario(
  repos: MindKidRepositories,
  u1Id: number,
  u2Id: number,
  managerId: number
) {
  await repos.packages.upsertCatalog({
    code: "standard",
    name: "Gói Tiêu chuẩn",
    audience: "Gia đình",
    offers: [{ code: "std_365d", price_vnd: 990_000 }],
    updatedAt: FIXED_T0,
  });

  const order1 = await repos.orders.createOrder({
    uuid: ORDER_1_UUID,
    userId: u1Id,
    packageCode: "standard",
    offerCode: "std_365d",
    amountVnd: 990_000,
    transferNote: "MK-STD-2026A",
    expiresAt: FIXED_EXPIRES_FUTURE,
    createdAt: FIXED_T0,
  });
  const activePending = await repos.orders.findActivePendingForUserPackage(
    u1Id,
    "standard"
  );
  const strangerView = await repos.orders.findByUuidForUser(ORDER_1_UUID, u2Id);

  const submitted1 = await repos.orders.submitProof(ORDER_1_UUID, u1Id, {
    proofPath: "proofs/order-1.webp",
    bankTxnRef: "VCB-DUP-001",
    submittedAt: FIXED_T1,
  });
  const order2 = await repos.orders.createOrder({
    uuid: ORDER_2_UUID,
    userId: u2Id,
    packageCode: "standard",
    offerCode: "std_365d",
    amountVnd: 990_000,
    transferNote: "MK-STD-2026B",
    expiresAt: FIXED_EXPIRES_FUTURE,
    createdAt: FIXED_T0,
  });
  await repos.orders.submitProof(order2.uuid, u2Id, {
    proofPath: "proofs/order-2.webp",
    bankTxnRef: "VCB-DUP-001",
    submittedAt: FIXED_T1,
  });

  const [queuePage, queueStats, statsBeforeApprove, dupRefs] =
    await Promise.all([
      repos.orders.listQueueForManager({
        statuses: [PAYMENT_ORDER_STATUS.SUBMITTED],
        q: "mk-std-2026",
        sort: "oldest",
        limit: 10,
      }),
      repos.orders.getQueueStats(FIXED_T2),
      repos.orders.countPendingStats(),
      repos.orders.listDuplicateBankTxnRefs(["VCB-DUP-001", "VCB-UNIQUE"]),
    ]);

  const approved1 = await repos.orders.approveOrder(
    ORDER_1_UUID,
    managerId,
    "Đã nhận đủ 990.000đ",
    FIXED_T2
  );
  const rejected2 = await repos.orders.rejectOrder(
    ORDER_2_UUID,
    managerId,
    "Sai nội dung CK",
    FIXED_T2
  );
  const [priorRejectedIds, filteredOrders] = await Promise.all([
    repos.orders.listPriorRejectedUserIds([u1Id, u2Id]),
    repos.orders.listForManager({
      q: "mk-std-2026a",
      status: PAYMENT_ORDER_STATUS.APPROVED,
      page: 1,
      limit: 10,
    }),
  ]);

  const granted = await repos.entitlements.grantEntitlement({
    userId: u1Id,
    entitlementKey: "content.standard",
    source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
    sourceRef: ORDER_1_UUID,
    status: ENTITLEMENT_STATUS.ACTIVE,
    grantedAt: FIXED_T2,
    expiresAt: FIXED_EXPIRES_FUTURE,
    grantedByManagerId: managerId,
    grantReason: "Kích hoạt tự động khi duyệt đơn",
  });
  const [
    hasActiveNow,
    hasAfterExpiry,
    activeList,
    subscribers,
    firstActiveKeyMap,
  ] = await Promise.all([
    repos.entitlements.hasEntitlement(u1Id, "content.standard", FIXED_T2),
    repos.entitlements.hasEntitlement(
      u1Id,
      "content.standard",
      new Date("2027-01-01T00:00:00.000Z")
    ),
    repos.entitlements.listActiveForUser(u1Id, FIXED_T2),
    repos.entitlements.listActiveSubscribersByKeys(["content.standard"], {
      limit: 10,
      now: FIXED_T2,
    }),
    repos.entitlements.mapFirstActiveKeyByUsers([u1Id, u2Id], FIXED_T2),
  ]);

  const sub = await repos.recurringSubscriptions.createSubscription({
    userId: u1Id,
    packageCode: "standard",
    offerCode: "std_365d",
    billingPeriod: "annual",
    priceVnd: 990_000,
    autoRenew: true,
    currentPeriodStart: FIXED_T0,
    currentPeriodEnd: FIXED_EXPIRES_FUTURE,
    nextBillingAt: FIXED_T3,
    consentTermsVersion: "2026-01",
    consentSnapshot: { accepted: true },
    now: FIXED_T0,
  });
  const [reminderList, dueRenewal] = await Promise.all([
    repos.recurringSubscriptions.listActiveForRenewalReminder(
      FIXED_T1,
      FIXED_EXPIRES_FUTURE
    ),
    repos.recurringSubscriptions.listDueForRenewal(FIXED_T3),
  ]);
  const updatedSub = await repos.recurringSubscriptions.updateSubscriptionById(
    sub.id,
    {
      status: RECURRING_SUBSCRIPTION_STATUS.PAST_DUE,
      dunningAttempts: 1,
      updatedAt: FIXED_T2,
    }
  );
  const dueDunning =
    await repos.recurringSubscriptions.listDueForDunning(FIXED_T3);
  const txn = await repos.recurringSubscriptions.insertTransaction({
    provider: "vnpay",
    providerEventId: "evt-001",
    orderId: order1.id,
    orderUuid: ORDER_1_UUID,
    amountVnd: 990_000,
    status: "succeeded",
    rawPayload: { bank: "VCB" },
    reconciledAt: FIXED_T2,
    createdAt: FIXED_T1,
  });
  const foundTxn =
    await repos.recurringSubscriptions.findTransactionByProviderEvent(
      "vnpay",
      "evt-001"
    );

  return {
    order1,
    activePending,
    strangerView,
    submitted1,
    queuePage,
    queueStats,
    statsBeforeApprove,
    dupRefs: Array.from(dupRefs),
    approved1,
    rejected2,
    priorRejectedIds: Array.from(priorRejectedIds),
    filteredOrders,
    granted,
    hasActiveNow,
    hasAfterExpiry,
    activeList,
    subscribers,
    firstActiveKeyEntries: Array.from(firstActiveKeyMap.entries()),
    sub,
    reminderList,
    dueRenewal,
    updatedSub,
    dueDunning,
    txn,
    foundTxn,
  };
}

export async function runOpsAndNotificationsScenario(
  repos: MindKidRepositories,
  u1Id: number,
  managerId: number
) {
  const audit1 = await repos.auditLogs.insertLog({
    uuid: AUDIT_1_UUID,
    actorType: ACTOR_TYPE.USER,
    actorId: u1Id,
    action: "order.submitted",
    entityType: "payment_order",
    entityId: ORDER_1_UUID,
    beforeData: { status: "pending" },
    afterData: { status: "submitted", proof: "proofs/order-std.webp" },
    reason: "Phụ huynh tải biên lai Receipt-99",
    ipAddress: "203.0.113.55",
    userAgent: "MobileSafari",
    createdAt: FIXED_T1,
  });
  await repos.auditLogs.insertLog({
    uuid: AUDIT_2_UUID,
    actorType: ACTOR_TYPE.MANAGER,
    actorId: managerId,
    action: "order.approved",
    entityType: "payment_order",
    entityId: ORDER_1_UUID,
    reason: "Duyệt đối soát",
    createdAt: FIXED_T2,
  });
  const [auditsFiltered, auditsExport, auditCount] = await Promise.all([
    repos.auditLogs.listFiltered({
      q: "RECEIPT-99",
      action: "order.submitted",
    }),
    repos.auditLogs.listForExport({}, 10),
    repos.auditLogs.countAll({ actorType: ACTOR_TYPE.USER }),
  ]);

  const { notification, delivery } =
    await repos.notifications.createWithEmailDelivery({
      uuid: NOTIF_1_UUID,
      recipientType: RECIPIENT_TYPE.USER,
      recipientId: u1Id,
      templateCode: "ORDER_APPROVED_EMAIL",
      payload: { order_uuid: ORDER_1_UUID, package_name: "Tiêu chuẩn" },
      createdAt: FIXED_T1,
    });
  const dispatched = await repos.notifications.recordDeliveryOutcome(
    notification.id,
    {
      channel: NOTIFICATION_CHANNEL.EMAIL,
      status: NOTIFICATION_STATUS.DISPATCHED,
      providerMessageId: "ses-msg-001",
      dispatchedAt: FIXED_T2,
    }
  );
  const [isDispatched, managerNotifList] = await Promise.all([
    repos.notifications.isDeliveryDispatched(
      notification.id,
      NOTIFICATION_CHANNEL.EMAIL
    ),
    repos.notifications.listForManager({ q: "order_approved" }),
  ]);

  return {
    audit1,
    auditsFiltered,
    auditsExport,
    auditCount,
    notification,
    deliveryUuid: delivery.uuid,
    dispatchedSummary: dispatched
      ? {
          id: dispatched.id,
          notificationId: dispatched.notificationId,
          channel: dispatched.channel,
          status: dispatched.status,
          providerMessageId: dispatched.providerMessageId,
          dispatchedAt: dispatched.dispatchedAt,
        }
      : null,
    isDispatched,
    managerNotifCount: managerNotifList.length,
  };
}

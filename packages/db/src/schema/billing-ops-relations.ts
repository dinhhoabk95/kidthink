import type { RelationsBuilder } from "drizzle-orm";
import type { DbTables } from "./tables.ts";

type SchemaTables = DbTables;

export function buildBillingOpsRelations(r: RelationsBuilder<SchemaTables>) {
  return {
    entitlementKeys: {
      entitlements: r.many.entitlements({
        from: r.entitlementKeys.key,
        to: r.entitlements.entitlementKey,
      }),
    },
    packages: {
      paymentOrders: r.many.paymentOrders({
        from: r.packages.code,
        to: r.paymentOrders.packageCode,
      }),
      recurringSubscriptions: r.many.recurringSubscriptions({
        from: r.packages.code,
        to: r.recurringSubscriptions.packageCode,
      }),
    },
    entitlements: {
      user: r.one.users({
        from: r.entitlements.userId,
        to: r.users.id,
        optional: false,
      }),
      keyDefinition: r.one.entitlementKeys({
        from: r.entitlements.entitlementKey,
        to: r.entitlementKeys.key,
        optional: false,
      }),
      grantedByManager: r.one.managers({
        from: r.entitlements.grantedByManagerId,
        to: r.managers.id,
        optional: true,
      }),
    },
    paymentOrders: {
      user: r.one.users({
        from: r.paymentOrders.userId,
        to: r.users.id,
        optional: false,
      }),
      package: r.one.packages({
        from: r.paymentOrders.packageCode,
        to: r.packages.code,
        optional: false,
      }),
      reviewedByManager: r.one.managers({
        from: r.paymentOrders.reviewedByManagerId,
        to: r.managers.id,
        optional: true,
      }),
      transactions: r.many.paymentTransactions({
        from: r.paymentOrders.id,
        to: r.paymentTransactions.orderId,
      }),
    },
    quotaUsage: {
      user: r.one.users({
        from: r.quotaUsage.userId,
        to: r.users.id,
        optional: false,
      }),
    },
    paymentTransactions: {
      order: r.one.paymentOrders({
        from: r.paymentTransactions.orderId,
        to: r.paymentOrders.id,
        optional: true,
      }),
    },
    recurringSubscriptions: {
      user: r.one.users({
        from: r.recurringSubscriptions.userId,
        to: r.users.id,
        optional: false,
      }),
      package: r.one.packages({
        from: r.recurringSubscriptions.packageCode,
        to: r.packages.code,
        optional: false,
      }),
    },
    notifications: {
      deliveries: r.many.notificationDeliveries({
        from: r.notifications.id,
        to: r.notificationDeliveries.notificationId,
      }),
      read: r.one.notificationReads({
        from: r.notifications.id,
        to: r.notificationReads.notificationId,
        optional: true,
      }),
      userRecipient: r.one.users({
        from: r.notifications.recipientId,
        to: r.users.id,
        optional: true,
      }),
    },
    notificationDeliveries: {
      notification: r.one.notifications({
        from: r.notificationDeliveries.notificationId,
        to: r.notifications.id,
        optional: false,
      }),
    },
    notificationReads: {
      notification: r.one.notifications({
        from: r.notificationReads.notificationId,
        to: r.notifications.id,
        optional: false,
      }),
    },
    notificationEndpoints: {
      user: r.one.users({
        from: r.notificationEndpoints.userId,
        to: r.users.id,
        optional: false,
      }),
    },
    aiUsageLog: {
      user: r.one.users({
        from: r.aiUsageLog.userId,
        to: r.users.id,
        optional: false,
      }),
    },
    aiCreditLedger: {
      user: r.one.users({
        from: r.aiCreditLedger.userId,
        to: r.users.id,
        optional: false,
      }),
      grantedByManager: r.one.managers({
        from: r.aiCreditLedger.grantedByManagerId,
        to: r.managers.id,
        optional: true,
      }),
    },
    aiCreditBalance: {
      user: r.one.users({
        from: r.aiCreditBalance.userId,
        to: r.users.id,
        optional: false,
      }),
    },
    exportJobs: {
      user: r.one.users({
        from: r.exportJobs.userId,
        to: r.users.id,
        optional: false,
      }),
    },
  };
}

import { relations } from "drizzle-orm/_relations";
import { aiUsageLog } from "./ai.ts";
import { aiCreditBalance, aiCreditLedger } from "./ai-credit.ts";
import {
  entitlementKeys,
  entitlements,
  packages,
  paymentOrders,
  paymentTransactions,
  quotaUsage,
  recurringSubscriptions,
} from "./billing.ts";
import { exportJobs } from "./exports.ts";
import { managers, users } from "./identity.ts";
import {
  errorLogs,
  featureFlags,
  notificationDeliveries,
  notificationEndpoints,
  notificationReads,
  notifications,
} from "./ops.ts";

export const entitlementKeysRelations = relations(
  entitlementKeys,
  ({ many }) => ({
    entitlements: many(entitlements),
  })
);

export const packagesRelations = relations(packages, ({ many }) => ({
  paymentOrders: many(paymentOrders),
  recurringSubscriptions: many(recurringSubscriptions),
}));

export const entitlementsRelations = relations(entitlements, ({ one }) => ({
  user: one(users, {
    fields: [entitlements.userId],
    references: [users.id],
  }),
  keyDefinition: one(entitlementKeys, {
    fields: [entitlements.entitlementKey],
    references: [entitlementKeys.key],
  }),
  grantedByManager: one(managers, {
    fields: [entitlements.grantedByManagerId],
    references: [managers.id],
  }),
}));

export const paymentOrdersRelations = relations(
  paymentOrders,
  ({ one, many }) => ({
    user: one(users, {
      fields: [paymentOrders.userId],
      references: [users.id],
    }),
    package: one(packages, {
      fields: [paymentOrders.packageCode],
      references: [packages.code],
    }),
    reviewedByManager: one(managers, {
      fields: [paymentOrders.reviewedByManagerId],
      references: [managers.id],
    }),
    transactions: many(paymentTransactions),
  })
);

export const quotaUsageRelations = relations(quotaUsage, ({ one }) => ({
  user: one(users, {
    fields: [quotaUsage.userId],
    references: [users.id],
  }),
}));

export const paymentTransactionsRelations = relations(
  paymentTransactions,
  ({ one }) => ({
    order: one(paymentOrders, {
      fields: [paymentTransactions.orderId],
      references: [paymentOrders.id],
    }),
  })
);

export const recurringSubscriptionsRelations = relations(
  recurringSubscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [recurringSubscriptions.userId],
      references: [users.id],
    }),
    package: one(packages, {
      fields: [recurringSubscriptions.packageCode],
      references: [packages.code],
    }),
  })
);

export const notificationsRelations = relations(
  notifications,
  ({ one, many }) => ({
    deliveries: many(notificationDeliveries),
    read: one(notificationReads),
  })
);

export const notificationDeliveriesRelations = relations(
  notificationDeliveries,
  ({ one }) => ({
    notification: one(notifications, {
      fields: [notificationDeliveries.notificationId],
      references: [notifications.id],
    }),
  })
);

export const notificationReadsRelations = relations(
  notificationReads,
  ({ one }) => ({
    notification: one(notifications, {
      fields: [notificationReads.notificationId],
      references: [notifications.id],
    }),
  })
);

export const notificationEndpointsRelations = relations(
  notificationEndpoints,
  ({ one }) => ({
    user: one(users, {
      fields: [notificationEndpoints.userId],
      references: [users.id],
    }),
  })
);

export const featureFlagsRelations = relations(featureFlags, ({ one }) => ({
  updatedByManager: one(managers, {
    fields: [featureFlags.updatedByManagerId],
    references: [managers.id],
  }),
}));

export const errorLogsRelations = relations(errorLogs, ({ one }) => ({
  user: one(users, {
    fields: [errorLogs.userId],
    references: [users.id],
  }),
  resolvedByManager: one(managers, {
    fields: [errorLogs.resolvedByManagerId],
    references: [managers.id],
  }),
}));

export const aiUsageLogRelations = relations(aiUsageLog, ({ one }) => ({
  user: one(users, {
    fields: [aiUsageLog.userId],
    references: [users.id],
  }),
}));

export const aiCreditLedgerRelations = relations(aiCreditLedger, ({ one }) => ({
  user: one(users, {
    fields: [aiCreditLedger.userId],
    references: [users.id],
  }),
  grantedByManager: one(managers, {
    fields: [aiCreditLedger.grantedByManagerId],
    references: [managers.id],
  }),
}));

export const aiCreditBalanceRelations = relations(
  aiCreditBalance,
  ({ one }) => ({
    user: one(users, {
      fields: [aiCreditBalance.userId],
      references: [users.id],
    }),
  })
);

export const exportJobsRelations = relations(exportJobs, ({ one }) => ({
  user: one(users, {
    fields: [exportJobs.userId],
    references: [users.id],
  }),
}));

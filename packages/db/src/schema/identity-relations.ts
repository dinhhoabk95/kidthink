import { relations } from "drizzle-orm/_relations";
import { aiUsageLog } from "./ai.ts";
import { aiCreditBalance, aiCreditLedger } from "./ai-credit.ts";
import {
  entitlements,
  paymentOrders,
  quotaUsage,
  recurringSubscriptions,
} from "./billing.ts";
import { childProfiles } from "./child.ts";
import { customGames } from "./custom-game.ts";
import { exportJobs } from "./exports.ts";
import {
  consentLogs,
  managerAccounts,
  managerPasskeys,
  managerSessions,
  managers,
  managerTwoFactors,
  mfaRecoveryRequests,
  userAccounts,
  userPasskeys,
  userSessions,
  users,
  userTwoFactors,
} from "./identity.ts";
import { collections, libraryItems } from "./library.ts";
import { errorLogs, featureFlags, notificationEndpoints } from "./ops.ts";
import { personalCurricula } from "./personal-curriculum.ts";

export const usersRelations = relations(users, ({ one, many }) => ({
  accounts: many(userAccounts),
  sessions: many(userSessions),
  twoFactor: one(userTwoFactors),
  passkeys: many(userPasskeys),
  consentLogs: many(consentLogs),
  mfaRecoveryRequests: many(mfaRecoveryRequests),
  childProfiles: many(childProfiles),
  entitlements: many(entitlements),
  paymentOrders: many(paymentOrders),
  quotaUsage: many(quotaUsage),
  recurringSubscriptions: many(recurringSubscriptions),
  notificationEndpoints: many(notificationEndpoints),
  errorLogs: many(errorLogs),
  personalCurricula: many(personalCurricula),
  customGames: many(customGames),
  collections: many(collections),
  libraryItems: many(libraryItems),
  aiUsageLogs: many(aiUsageLog),
  aiCreditLedgerEntries: many(aiCreditLedger),
  aiCreditBalance: one(aiCreditBalance),
  exportJobs: many(exportJobs),
}));

export const managersRelations = relations(managers, ({ one, many }) => ({
  accounts: many(managerAccounts),
  sessions: many(managerSessions),
  twoFactor: one(managerTwoFactors),
  passkeys: many(managerPasskeys),
  requestedMfaRecoveries: many(mfaRecoveryRequests, {
    relationName: "mfa_recovery_requested_by",
  }),
  completedMfaRecoveries: many(mfaRecoveryRequests, {
    relationName: "mfa_recovery_completed_by",
  }),
  grantedEntitlements: many(entitlements),
  reviewedPaymentOrders: many(paymentOrders),
  grantedAiCredits: many(aiCreditLedger),
  updatedFeatureFlags: many(featureFlags),
  resolvedErrorLogs: many(errorLogs),
}));

export const userAccountsRelations = relations(userAccounts, ({ one }) => ({
  user: one(users, {
    fields: [userAccounts.userId],
    references: [users.id],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const userTwoFactorsRelations = relations(userTwoFactors, ({ one }) => ({
  user: one(users, {
    fields: [userTwoFactors.userId],
    references: [users.id],
  }),
}));

export const userPasskeysRelations = relations(userPasskeys, ({ one }) => ({
  user: one(users, {
    fields: [userPasskeys.userId],
    references: [users.id],
  }),
}));

export const managerAccountsRelations = relations(
  managerAccounts,
  ({ one }) => ({
    manager: one(managers, {
      fields: [managerAccounts.userId],
      references: [managers.id],
    }),
  })
);

export const managerSessionsRelations = relations(
  managerSessions,
  ({ one }) => ({
    manager: one(managers, {
      fields: [managerSessions.userId],
      references: [managers.id],
    }),
  })
);

export const managerTwoFactorsRelations = relations(
  managerTwoFactors,
  ({ one }) => ({
    manager: one(managers, {
      fields: [managerTwoFactors.userId],
      references: [managers.id],
    }),
  })
);

export const managerPasskeysRelations = relations(
  managerPasskeys,
  ({ one }) => ({
    manager: one(managers, {
      fields: [managerPasskeys.userId],
      references: [managers.id],
    }),
  })
);

export const consentLogsRelations = relations(consentLogs, ({ one }) => ({
  user: one(users, {
    fields: [consentLogs.userId],
    references: [users.id],
  }),
}));

export const mfaRecoveryRequestsRelations = relations(
  mfaRecoveryRequests,
  ({ one }) => ({
    user: one(users, {
      fields: [mfaRecoveryRequests.userId],
      references: [users.id],
    }),
    requestedByManager: one(managers, {
      fields: [mfaRecoveryRequests.requestedByManagerId],
      references: [managers.id],
      relationName: "mfa_recovery_requested_by",
    }),
    completedByManager: one(managers, {
      fields: [mfaRecoveryRequests.completedByManagerId],
      references: [managers.id],
      relationName: "mfa_recovery_completed_by",
    }),
  })
);

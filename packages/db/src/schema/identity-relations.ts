import type { RelationsBuilder } from "drizzle-orm";
import type { DbTables } from "./tables.ts";

type SchemaTables = DbTables;

export function buildIdentityRelations(r: RelationsBuilder<SchemaTables>) {
  return {
    users: {
      accounts: r.many.userAccounts({
        from: r.users.id,
        to: r.userAccounts.userId,
      }),
      sessions: r.many.userSessions({
        from: r.users.id,
        to: r.userSessions.userId,
      }),
      twoFactor: r.one.userTwoFactors({
        from: r.users.id,
        to: r.userTwoFactors.userId,
        optional: true,
      }),
      passkeys: r.many.userPasskeys({
        from: r.users.id,
        to: r.userPasskeys.userId,
      }),
      consentLogs: r.many.consentLogs({
        from: r.users.id,
        to: r.consentLogs.userId,
      }),
      mfaRecoveryRequests: r.many.mfaRecoveryRequests({
        from: r.users.id,
        to: r.mfaRecoveryRequests.userId,
      }),
      childProfiles: r.many.childProfiles({
        from: r.users.id,
        to: r.childProfiles.userId,
      }),
      entitlements: r.many.entitlements({
        from: r.users.id,
        to: r.entitlements.userId,
      }),
      paymentOrders: r.many.paymentOrders({
        from: r.users.id,
        to: r.paymentOrders.userId,
      }),
      quotaUsage: r.many.quotaUsage({
        from: r.users.id,
        to: r.quotaUsage.userId,
      }),
      recurringSubscriptions: r.many.recurringSubscriptions({
        from: r.users.id,
        to: r.recurringSubscriptions.userId,
      }),
      notificationEndpoints: r.many.notificationEndpoints({
        from: r.users.id,
        to: r.notificationEndpoints.userId,
      }),
      personalCurricula: r.many.personalCurricula({
        from: r.users.id,
        to: r.personalCurricula.userId,
      }),
      customGames: r.many.customGames({
        from: r.users.id,
        to: r.customGames.userId,
      }),
      collections: r.many.collections({
        from: r.users.id,
        to: r.collections.userId,
      }),
      libraryItems: r.many.libraryItems({
        from: r.users.id,
        to: r.libraryItems.userId,
      }),
      aiUsageLogs: r.many.aiUsageLog({
        from: r.users.id,
        to: r.aiUsageLog.userId,
      }),
      aiCreditLedgerEntries: r.many.aiCreditLedger({
        from: r.users.id,
        to: r.aiCreditLedger.userId,
      }),
      aiCreditBalance: r.one.aiCreditBalance({
        from: r.users.id,
        to: r.aiCreditBalance.userId,
        optional: true,
      }),
      exportJobs: r.many.exportJobs({
        from: r.users.id,
        to: r.exportJobs.userId,
      }),
    },
    managers: {
      accounts: r.many.managerAccounts({
        from: r.managers.id,
        to: r.managerAccounts.userId,
      }),
      sessions: r.many.managerSessions({
        from: r.managers.id,
        to: r.managerSessions.userId,
      }),
      twoFactor: r.one.managerTwoFactors({
        from: r.managers.id,
        to: r.managerTwoFactors.userId,
        optional: true,
      }),
      passkeys: r.many.managerPasskeys({
        from: r.managers.id,
        to: r.managerPasskeys.userId,
      }),
      requestedMfaRecoveries: r.many.mfaRecoveryRequests({
        from: r.managers.id,
        to: r.mfaRecoveryRequests.requestedByManagerId,
        alias: "mfa_recovery_requested_by",
      }),
      completedMfaRecoveries: r.many.mfaRecoveryRequests({
        from: r.managers.id,
        to: r.mfaRecoveryRequests.completedByManagerId,
        alias: "mfa_recovery_completed_by",
      }),
      grantedEntitlements: r.many.entitlements({
        from: r.managers.id,
        to: r.entitlements.grantedByManagerId,
      }),
      reviewedPaymentOrders: r.many.paymentOrders({
        from: r.managers.id,
        to: r.paymentOrders.reviewedByManagerId,
      }),
      grantedAiCredits: r.many.aiCreditLedger({
        from: r.managers.id,
        to: r.aiCreditLedger.grantedByManagerId,
      }),
    },
    userAccounts: {
      user: r.one.users({
        from: r.userAccounts.userId,
        to: r.users.id,
        optional: false,
      }),
    },
    userSessions: {
      user: r.one.users({
        from: r.userSessions.userId,
        to: r.users.id,
        optional: false,
      }),
    },
    userTwoFactors: {
      user: r.one.users({
        from: r.userTwoFactors.userId,
        to: r.users.id,
        optional: false,
      }),
    },
    userPasskeys: {
      user: r.one.users({
        from: r.userPasskeys.userId,
        to: r.users.id,
        optional: false,
      }),
    },
    managerAccounts: {
      manager: r.one.managers({
        from: r.managerAccounts.userId,
        to: r.managers.id,
        optional: false,
      }),
    },
    managerSessions: {
      manager: r.one.managers({
        from: r.managerSessions.userId,
        to: r.managers.id,
        optional: false,
      }),
    },
    managerTwoFactors: {
      manager: r.one.managers({
        from: r.managerTwoFactors.userId,
        to: r.managers.id,
        optional: false,
      }),
    },
    managerPasskeys: {
      manager: r.one.managers({
        from: r.managerPasskeys.userId,
        to: r.managers.id,
        optional: false,
      }),
    },
    consentLogs: {
      user: r.one.users({
        from: r.consentLogs.userId,
        to: r.users.id,
        optional: false,
      }),
    },
    mfaRecoveryRequests: {
      user: r.one.users({
        from: r.mfaRecoveryRequests.userId,
        to: r.users.id,
        optional: false,
      }),
      requestedByManager: r.one.managers({
        from: r.mfaRecoveryRequests.requestedByManagerId,
        to: r.managers.id,
        optional: false,
        alias: "mfa_recovery_requested_by",
      }),
      completedByManager: r.one.managers({
        from: r.mfaRecoveryRequests.completedByManagerId,
        to: r.managers.id,
        optional: true,
        alias: "mfa_recovery_completed_by",
      }),
    },
  };
}

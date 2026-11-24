import { childBadges, masteryState } from "./adaptive.ts";
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
import { childProfiles } from "./child.ts";
import { childStickers } from "./child-stickers.ts";
import {
  curricula,
  curriculumEnrollments,
  curriculumItemProgress,
  curriculumItems,
  curriculumWeeks,
} from "./curriculum.ts";
import { customGames } from "./custom-game.ts";
import { exportJobs } from "./exports.ts";
import { gameLevelRounds, gameLevels } from "./game.ts";
import {
  consentLogs,
  consentRequirements,
  managerAccounts,
  managerPasskeys,
  managerSessions,
  managers,
  managerTwoFactors,
  managerVerifications,
  mfaRecoveryRequests,
  userAccounts,
  userPasskeys,
  userSessions,
  users,
  userTwoFactors,
  userVerifications,
} from "./identity.ts";
import { childMascotGear, childStickerPlacements } from "./kid-world.ts";
import { collections, libraryItems } from "./library.ts";
import {
  auditLogs,
  notificationDeliveries,
  notificationEndpoints,
  notificationReads,
  notifications,
} from "./ops.ts";
import {
  personalCurricula,
  personalCurriculumEnrollments,
  personalCurriculumItemProgress,
  personalCurriculumItems,
} from "./personal-curriculum.ts";
import {
  childDailyStats,
  childSessionSummaries,
  levelDailyStats,
  playSessions,
  skillDailyStats,
  telemetryEvents,
} from "./play.ts";
import { contentSkillMap, contentTagMap, contentTags } from "./tagging.ts";
import {
  competencies,
  learningObjectives,
  skillDatasets,
  skillPrerequisites,
  skills,
  strands,
} from "./taxonomy.ts";

export const dbTables = {
  childBadges,
  masteryState,
  aiUsageLog,
  aiCreditBalance,
  aiCreditLedger,
  entitlementKeys,
  entitlements,
  packages,
  paymentOrders,
  paymentTransactions,
  quotaUsage,
  recurringSubscriptions,
  childProfiles,
  childStickers,
  curricula,
  curriculumEnrollments,
  curriculumItemProgress,
  curriculumItems,
  curriculumWeeks,
  customGames,
  exportJobs,
  gameLevelRounds,
  gameLevels,
  consentLogs,
  consentRequirements,
  managerAccounts,
  managerPasskeys,
  managerSessions,
  managers,
  managerTwoFactors,
  managerVerifications,
  mfaRecoveryRequests,
  userAccounts,
  userPasskeys,
  userSessions,
  users,
  userTwoFactors,
  userVerifications,
  childMascotGear,
  childStickerPlacements,
  collections,
  libraryItems,
  auditLogs,
  notificationDeliveries,
  notificationEndpoints,
  notificationReads,
  notifications,
  personalCurricula,
  personalCurriculumEnrollments,
  personalCurriculumItemProgress,
  personalCurriculumItems,
  childDailyStats,
  childSessionSummaries,
  levelDailyStats,
  playSessions,
  skillDailyStats,
  telemetryEvents,
  contentSkillMap,
  contentTagMap,
  contentTags,
  competencies,
  learningObjectives,
  skillDatasets,
  skillPrerequisites,
  skills,
  strands,
} as const;

export type DbTables = typeof dbTables;

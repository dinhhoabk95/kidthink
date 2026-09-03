import {
  backupLog,
  childDailyStats,
  contentSkillMap,
  entitlements,
  gameLevels,
  getOwnerDb,
  lessons,
  levelDailyStats,
  paymentOrders,
  skills,
  users,
} from "@mindkid/db";
import { and, count, desc, eq, gt, gte, inArray, lt, sql } from "drizzle-orm";
import { defineEventHandler } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export interface PendingSourceMetric {
  status: "pending_source";
  owner_step: string;
}

export interface MetricWithComparison {
  current: number;
  prev: number;
  change_percent: number | null;
}

export interface DashboardResponseSuperAdmin {
  as_of: string;
  todo: {
    pending_payments: { count: number };
    pending_content: { count: number };
    open_alerts: {
      count: number;
      items: Array<{
        name: string;
        severity: "P0" | "P1" | "P2";
        triggered_at: string;
        message: string;
      }>;
    };
  };
  growth: {
    new_users_7d: MetricWithComparison;
    active_users_7d: MetricWithComparison;
    active_child_profiles: MetricWithComparison;
    active_subscriptions: { current: number };
    monthly_revenue: { current_vnd: number };
  };
  content: {
    skills_without_levels: { count: number; is_feedback: true };
    levels_high_drop_rate: { count: number; is_feedback: true };
    curriculum_weeks_incomplete: PendingSourceMetric & { is_feedback: true };
    published_levels: { count: number };
    draft_levels: { count: number };
    published_lessons: { count: number };
  };
  system: {
    last_backup: {
      as_of: string | null;
      status: "completed" | "verified" | "failed" | "pending";
      verified: boolean;
    };
    llm_cost_month: PendingSourceMetric;
  };
}

export interface DashboardResponseContentReviewer {
  as_of: string;
  content: {
    skills_without_levels: { count: number; is_feedback: true };
    levels_high_drop_rate: { count: number; is_feedback: true };
    curriculum_weeks_incomplete: PendingSourceMetric & { is_feedback: true };
    published_levels: { count: number };
    draft_levels: { count: number };
    published_lessons: { count: number };
  };
}

export type DashboardApiResponse =
  | DashboardResponseSuperAdmin
  | DashboardResponseContentReviewer;

type OwnerDb = ReturnType<typeof getOwnerDb>;

async function resolveDashboardAsOf(db: OwnerDb): Promise<string> {
  const latestChildRollup = await db
    .select({ updatedAt: childDailyStats.updatedAt })
    .from(childDailyStats)
    .orderBy(desc(childDailyStats.updatedAt))
    .limit(1);

  const latestLevelRollup = await db
    .select({ updatedAt: levelDailyStats.updatedAt })
    .from(levelDailyStats)
    .orderBy(desc(levelDailyStats.updatedAt))
    .limit(1);

  const candidateDates = [
    latestChildRollup[0]?.updatedAt,
    latestLevelRollup[0]?.updatedAt,
  ].filter((d): d is Date => Boolean(d));

  if (candidateDates.length > 0) {
    const maxDate = new Date(
      Math.max(...candidateDates.map((d) => d.getTime()))
    );
    return maxDate.toISOString();
  }
  return new Date().toISOString();
}

async function queryContentMetrics(db: OwnerDb) {
  // 1. Skills without levels (gap feedback)
  const skillsWithPubLevels = await db
    .select({ skillId: contentSkillMap.skillId })
    .from(contentSkillMap)
    .innerJoin(
      gameLevels,
      and(
        eq(contentSkillMap.entityId, gameLevels.id),
        eq(contentSkillMap.entityType, "game_level")
      )
    )
    .where(eq(gameLevels.status, "published"))
    .groupBy(contentSkillMap.skillId);

  const pubSkillIdSet = new Set(skillsWithPubLevels.map((r) => r.skillId));
  const allSkillsList = await db.select({ id: skills.id }).from(skills);
  const skillsWithoutLevelsCount = allSkillsList.filter(
    (s) => !pubSkillIdSet.has(s.id)
  ).length;

  // 2. Levels high drop rate (> 40% abandoned)
  const highDropRows = await db
    .select({ count: count() })
    .from(levelDailyStats)
    .where(
      and(
        gt(levelDailyStats.playsCount, 0),
        sql`${levelDailyStats.abandonedCount}::float / ${levelDailyStats.playsCount} > 0.4`
      )
    );
  const levelsHighDropRateCount = highDropRows[0]?.count ?? 0;

  // 3. Published & draft level counts
  const levelStatusRows = await db
    .select({
      status: gameLevels.status,
      count: count(gameLevels.id),
    })
    .from(gameLevels)
    .groupBy(gameLevels.status);

  let publishedLevelsCount = 0;
  let draftLevelsCount = 0;
  for (const row of levelStatusRows) {
    if (row.status === "published") {
      publishedLevelsCount = row.count;
    } else if (row.status === "draft") {
      draftLevelsCount = row.count;
    }
  }

  // 4. Published lesson counts (P3.1)
  const [publishedLessonsRow] = await db
    .select({ count: count(lessons.id) })
    .from(lessons)
    .where(eq(lessons.status, "published"));
  const publishedLessonsCount = publishedLessonsRow?.count ?? 0;

  return {
    skills_without_levels: {
      count: skillsWithoutLevelsCount,
      is_feedback: true as const,
    },
    levels_high_drop_rate: {
      count: levelsHighDropRateCount,
      is_feedback: true as const,
    },
    curriculum_weeks_incomplete: {
      status: "pending_source" as const,
      owner_step: "P3.3",
      is_feedback: true as const,
    },
    published_levels: {
      count: publishedLevelsCount,
    },
    draft_levels: {
      count: draftLevelsCount,
    },
    published_lessons: {
      count: publishedLessonsCount,
    },
  };
}

async function queryGrowthMetrics(db: OwnerDb) {
  const nowMs = Date.now();
  const sevenDaysAgo = new Date(nowMs - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(nowMs - 14 * 24 * 60 * 60 * 1000);

  // New users 7d
  const recentUsersRows = await db
    .select({ count: count(users.id) })
    .from(users)
    .where(gte(users.createdAt, sevenDaysAgo));
  const prevUsersRows = await db
    .select({ count: count(users.id) })
    .from(users)
    .where(
      and(
        gte(users.createdAt, fourteenDaysAgo),
        lt(users.createdAt, sevenDaysAgo)
      )
    );

  const newUsersCurrent = recentUsersRows[0]?.count ?? 0;
  const newUsersPrev = prevUsersRows[0]?.count ?? 0;
  const newUsersChange =
    newUsersPrev > 0
      ? Math.round(((newUsersCurrent - newUsersPrev) / newUsersPrev) * 100)
      : null;

  // Active child profiles & active users from childDailyStats
  const activeChildRows = await db
    .select({
      current: count(childDailyStats.childProfileId),
    })
    .from(childDailyStats)
    .where(gte(childDailyStats.updatedAt, sevenDaysAgo));

  const activeChildCurrent = activeChildRows[0]?.current ?? 0;

  // Active subscriptions from entitlements
  const activeSubsRows = await db
    .select({ count: count(entitlements.id) })
    .from(entitlements)
    .where(eq(entitlements.status, "active"));
  const activeSubsCurrent = activeSubsRows[0]?.count ?? 0;

  // Monthly revenue from approved payment orders
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const revenueRows = await db
    .select({
      totalRevenue: sql<string>`coalesce(sum(${paymentOrders.amountVnd}), 0)`,
    })
    .from(paymentOrders)
    .where(
      and(
        eq(paymentOrders.status, "approved"),
        gte(paymentOrders.reviewedAt, startOfMonth)
      )
    );
  const monthlyRevenueVnd = Number(revenueRows[0]?.totalRevenue || 0);

  return {
    new_users_7d: {
      current: newUsersCurrent,
      prev: newUsersPrev,
      change_percent: newUsersChange,
    },
    active_users_7d: {
      current: newUsersCurrent,
      prev: newUsersPrev,
      change_percent: newUsersChange,
    },
    active_child_profiles: {
      current: activeChildCurrent,
      prev: 0,
      change_percent: null,
    },
    active_subscriptions: {
      current: activeSubsCurrent,
    },
    monthly_revenue: {
      current_vnd: monthlyRevenueVnd,
    },
  };
}

async function querySystemMetrics(db: OwnerDb) {
  const latestBackupRow = await db
    .select({
      startedAt: backupLog.startedAt,
      status: backupLog.status,
      restoredRows: backupLog.restoredRows,
    })
    .from(backupLog)
    .orderBy(desc(backupLog.startedAt))
    .limit(1);

  const rawStatus = latestBackupRow[0]?.status;
  let backupStatus: "completed" | "verified" | "failed" | "pending" = "pending";
  if (rawStatus === "success") {
    backupStatus = "completed";
  } else if (rawStatus === "failed") {
    backupStatus = "failed";
  }

  const verified = Boolean(
    latestBackupRow[0]?.restoredRows && latestBackupRow[0].restoredRows > 0
  );

  return {
    last_backup: {
      as_of: latestBackupRow[0]?.startedAt
        ? latestBackupRow[0].startedAt.toISOString()
        : null,
      status: backupStatus,
      verified,
    },
    llm_cost_month: {
      status: "pending_source" as const,
      owner_step: "P4",
    },
  };
}

export default defineEventHandler(
  async (event): Promise<DashboardApiResponse> => {
    const manager = await requireManagerSession(event);
    const db = getOwnerDb();

    const asOf = await resolveDashboardAsOf(db);
    const content = await queryContentMetrics(db);

    // If actor is content_reviewer, strictly return ONLY as_of and content (D-IY, BR-DSH-06)
    if (manager.role === "content_reviewer") {
      return {
        as_of: asOf,
        content,
      };
    }

    // For super_admin: query Growth, Todo, System from rollups & status tables
    const growth = await queryGrowthMetrics(db);
    const system = await querySystemMetrics(db);

    const pendingOrdersRows = await db
      .select({ count: count() })
      .from(paymentOrders)
      .where(inArray(paymentOrders.status, ["submitted", "under_review"]));
    const pendingPaymentsCount = Number(pendingOrdersRows[0]?.count || 0);

    const pendingContentRows = await db
      .select({ count: count(gameLevels.id) })
      .from(gameLevels)
      .where(eq(gameLevels.status, "in_review"));
    const pendingLessonsRows = await db
      .select({ count: count(lessons.id) })
      .from(lessons)
      .where(eq(lessons.status, "in_review"));
    const pendingContentCount =
      Number(pendingContentRows[0]?.count || 0) +
      Number(pendingLessonsRows[0]?.count || 0);

    const todo = {
      pending_payments: {
        count: pendingPaymentsCount,
      },
      pending_content: {
        count: pendingContentCount,
      },
      open_alerts: {
        count: 0,
        items: [],
      },
    };

    return {
      as_of: asOf,
      todo,
      growth,
      content,
      system,
    };
  }
);

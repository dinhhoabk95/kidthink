import {
  CHILD_RELATIONSHIP_CODEC,
  type ChildProfileEntity,
  PAYMENT_ORDER_STATUS,
  RECURRING_SUBSCRIPTION_STATUS,
  RECURRING_SUBSCRIPTION_STATUS_CODEC,
  USER_STATUS,
} from "@mindkid/db";
import { ChildNotFoundError } from "@mindkid/errors/child";
import {
  allowedTiers,
  PACKAGE_CATALOG,
  resolveNextStep,
} from "@mindkid/shared";
import { getCookie, type H3Event, setResponseStatus } from "h3";
import { readRecentLocalBackupLogs } from "#server/services/system-status-service";
import { resolveEnrolledChildCurriculum } from "#server/utils/curriculum-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";
import { useOwnerRepositories } from "#server/utils/repositories";

export interface UserDashboardQuery {
  readonly child_id?: string | number;
  readonly child_uuid?: string;
}

export interface DashboardChildSummary {
  readonly id: number;
  readonly uuid: string;
  readonly display_name: string;
  readonly birth_year: number;
  readonly avatar_id: string;
  readonly relationship: string | null;
  readonly days_played_7d: number;
  readonly latest_level: string | null;
}

export interface DashboardProgressSummary {
  readonly child_id: number;
  readonly child_uuid: string;
  readonly display_name: string;
  readonly days_played_7d: number;
  readonly total_play_time_minutes_7d: number;
  readonly levels_completed_7d: number;
  readonly report_url: string;
}

export interface DashboardNextItem {
  readonly entity_type: string;
  readonly entity_code: string;
  readonly title: string;
  readonly locked: boolean;
}

export interface DashboardCurriculumBlock {
  readonly enrolled: boolean;
  readonly curriculum?: null;
  readonly enrollment_id?: number;
  readonly curriculum_id?: number;
  readonly curriculum_code?: string;
  readonly title?: string;
  readonly duration_weeks?: number;
  readonly current_week?: number;
  readonly current_session?: number;
  readonly progress?: number;
  readonly week_progress?: { done: number; total: number } | number;
  readonly week_blocked_by_tier?: boolean;
  readonly is_completed?: boolean;
  readonly next_item?: DashboardNextItem | null;
}

export interface UserDashboardResult {
  readonly todo: Array<{
    readonly type: string;
    readonly title: string;
    readonly message: string;
    readonly cta: string;
  }>;
  readonly children: readonly DashboardChildSummary[];
  readonly recent_progress: readonly DashboardProgressSummary[];
  readonly curriculum: DashboardCurriculumBlock | null;
  readonly subscription: {
    readonly package_name: string;
    readonly tier: string;
    readonly status: string;
    readonly expires_at: string | null;
    readonly days_left: number | null;
    readonly quota: {
      readonly children_count: number;
      readonly max_children: number;
      readonly usage_ratio: number;
      readonly show_quota_indicator: boolean;
    };
    readonly upgrade_cta: {
      readonly label: string;
      readonly url: string;
    } | null;
  };
  readonly active_child_id: number | null;
  readonly active_child_uuid: string | null;
}

export interface PendingSourceMetric {
  readonly status: "pending_source";
  readonly owner_step: string;
}

export interface MetricWithComparison {
  readonly current: number;
  readonly prev: number;
  readonly change_percent: number | null;
}

export interface DashboardContentMetrics {
  readonly skills_without_levels: {
    readonly count: number;
    readonly is_feedback: true;
  };
  readonly levels_high_drop_rate: {
    readonly count: number;
    readonly is_feedback: true;
  };
  readonly curriculum_weeks_incomplete: PendingSourceMetric & {
    readonly is_feedback: true;
  };
  readonly published_levels: { readonly count: number };
  readonly draft_levels: { readonly count: number };
}

export interface DashboardResponseSuperAdmin {
  readonly as_of: string;
  readonly todo: {
    readonly pending_payments: { readonly count: number };
    readonly pending_content: { readonly count: number };
    readonly open_alerts: {
      readonly count: number;
      readonly items: Array<{
        readonly name: string;
        readonly severity: "P0" | "P1" | "P2";
        readonly triggered_at: string;
        readonly message: string;
      }>;
    };
  };
  readonly growth: {
    readonly new_users_7d: MetricWithComparison;
    readonly active_users_7d: MetricWithComparison;
    readonly active_child_profiles: MetricWithComparison;
    readonly active_subscriptions: { readonly current: number };
    readonly monthly_revenue: { readonly current_vnd: number };
  };
  readonly content: DashboardContentMetrics;
  readonly system: {
    readonly last_backup: {
      readonly as_of: string | null;
      readonly status: "completed" | "verified" | "failed" | "pending";
      readonly verified: boolean;
    };
    readonly llm_cost_month: PendingSourceMetric;
  };
}

export interface DashboardResponseContentReviewer {
  readonly as_of: string;
  readonly content: DashboardContentMetrics;
}

export type DashboardApiResponse =
  | DashboardResponseSuperAdmin
  | DashboardResponseContentReviewer;

export const CONTENT_KPI_THRESHOLDS = {
  HIGH_ABANDONMENT_RATE: 0.4,
  LOW_ACCURACY_RATE: 0.3,
  LOW_PLAY_COUNT: 5,
} as const;

export interface ManagerLevelAnalyticsItem {
  readonly level_code: string;
  readonly content_version: 1;
  readonly date_ict: string;
  readonly plays_count: number;
  readonly completions_count: number;
  readonly abandoned_count: number;
  readonly avg_duration_seconds: number;
  readonly avg_hints_used: number;
  readonly kpi_alerts: {
    readonly high_abandonment: boolean;
    readonly low_accuracy: boolean;
    readonly low_plays: boolean;
  };
}

export interface ManagerLevelAnalyticsResult {
  readonly items: readonly ManagerLevelAnalyticsItem[];
  readonly count: number;
  readonly limit: number;
}

function resolveActiveChild(
  event: H3Event,
  userChildren: readonly ChildProfileEntity[],
  query: UserDashboardQuery
): ChildProfileEntity | null {
  let requestedChildId: number | null = null;
  if (query.child_id) {
    requestedChildId = Number(query.child_id);
  } else if (query.child_uuid) {
    const found = userChildren.find((c) => c.uuid === query.child_uuid);
    if (!found) {
      throw new ChildNotFoundError("CHILD_NOT_FOUND");
    }
    requestedChildId = found.id;
  }

  if (requestedChildId) {
    const match = userChildren.find((c) => c.id === requestedChildId);
    if (!match) {
      throw new ChildNotFoundError("CHILD_NOT_FOUND");
    }
    return match;
  }

  const cookieActiveUuid = event?.node?.req?.headers
    ? getCookie(event, "active_child_id")
    : undefined;
  if (cookieActiveUuid) {
    const cookieChild = userChildren.find((c) => c.uuid === cookieActiveUuid);
    if (cookieChild) {
      return cookieChild;
    }
  }

  return userChildren[0] ?? null;
}

function resolveTierLabel(
  packageCode: string | null | undefined,
  activeTiers: readonly string[]
): { packageName: string; tier: string } {
  if (packageCode) {
    return {
      packageName: PACKAGE_CATALOG[packageCode]?.name || packageCode,
      tier: packageCode,
    };
  }
  if (activeTiers.includes("premium")) {
    return { packageName: "Premium", tier: "premium" };
  }
  if (activeTiers.includes("standard")) {
    return { packageName: "Standard", tier: "standard" };
  }
  return { packageName: "Miễn phí", tier: "free" };
}

function computeSubscriptionState(
  sub:
    | {
        readonly packageCode?: string | null;
        readonly status?: string | null;
        readonly currentPeriodEnd?: Date | null;
      }
    | undefined,
  activeTiers: readonly string[],
  userChildrenCount: number,
  fallbackExpiresAt?: Date | null
) {
  let daysLeft: number | null = null;
  let isExpiringSoon = false;
  let hasExpired = false;
  const effectivePeriodEnd = sub?.currentPeriodEnd ?? fallbackExpiresAt ?? null;

  if (effectivePeriodEnd) {
    const diffMs = effectivePeriodEnd.getTime() - Date.now();
    daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) {
      hasExpired = true;
    } else if (daysLeft <= 7) {
      isExpiringSoon = true;
    }
  }

  const quotaMaxChildren = 5;
  const quotaUsageRatio = userChildrenCount / quotaMaxChildren;
  const showQuotaIndicator = quotaUsageRatio > 0.8;

  let upgradeCta: { label: string; url: string } | null = null;
  if (!(activeTiers.includes("premium") || activeTiers.includes("standard"))) {
    upgradeCta = { label: "Nâng cấp gói học", url: "/pricing" };
  } else if (isExpiringSoon || hasExpired) {
    upgradeCta = { label: "Gia hạn gói học", url: "/pricing" };
  }

  const { packageName, tier } = resolveTierLabel(sub?.packageCode, activeTiers);

  return {
    daysLeft,
    isExpiringSoon,
    subscriptionBlock: {
      package_name: packageName,
      tier,
      status: sub?.status || "active",
      expires_at: effectivePeriodEnd?.toISOString() || null,
      days_left: daysLeft,
      quota: {
        children_count: userChildrenCount,
        max_children: quotaMaxChildren,
        usage_ratio: quotaUsageRatio,
        show_quota_indicator: showQuotaIndicator,
      },
      upgrade_cta: upgradeCta,
    },
  };
}

async function resolveCurriculumBlock(
  event: H3Event,
  userId: number,
  activeChild: ChildProfileEntity | null
): Promise<DashboardCurriculumBlock | null> {
  if (!activeChild) {
    return null;
  }

  try {
    const { enrollment, items, weeks, completedItemIds, userAllowedTiers } =
      await resolveEnrolledChildCurriculum(event, userId, activeChild.uuid, {
        requireActive: false,
        requireEnrollment: false,
      });

    if (!enrollment) {
      return { enrolled: false, curriculum: null };
    }

    const nextStep = resolveNextStep({
      durationWeeks: enrollment.duration_weeks,
      weeks,
      items,
      completedItemIds,
      allowedTiers: userAllowedTiers,
    });

    return {
      enrolled: true,
      enrollment_id: enrollment.id,
      curriculum_id: enrollment.curriculumId,
      curriculum_code: enrollment.curriculum_code,
      title: enrollment.curriculum_title,
      duration_weeks: enrollment.duration_weeks,
      current_week: nextStep.week_no,
      current_session: nextStep.session_no,
      progress: nextStep.curriculum_progress,
      week_progress: nextStep.week_progress,
      week_blocked_by_tier: nextStep.week_blocked_by_tier,
      is_completed: nextStep.is_completed,
      next_item: nextStep.item
        ? {
            entity_type: nextStep.item.entity_type,
            entity_code: nextStep.item.entity_code,
            title: nextStep.item.title ?? "",
            locked: nextStep.item.locked,
          }
        : null,
    };
  } catch {
    setResponseStatus(event, 200);
    return { enrolled: false, curriculum: null };
  }
}

function resolveLatestEntitlementExpiry(
  userEntitlementRows: readonly { readonly expiresAt: Date | null }[]
): Date | null {
  if (userEntitlementRows.some((e) => e.expiresAt === null)) {
    return null;
  }
  let latestExpiresAt: Date | null = null;
  for (const ent of userEntitlementRows) {
    if (
      ent.expiresAt &&
      (!latestExpiresAt || ent.expiresAt.getTime() > latestExpiresAt.getTime())
    ) {
      latestExpiresAt = ent.expiresAt;
    }
  }
  return latestExpiresAt;
}

function buildUserTodoList(
  userStatus: number | undefined,
  userOrders: readonly {
    readonly id: number;
    readonly status: number;
    readonly transferNote: string | null;
  }[],
  isExpiringSoon: boolean,
  daysLeft: number | null
): Array<{ type: string; title: string; message: string; cta: string }> {
  const todoList: Array<{
    type: string;
    title: string;
    message: string;
    cta: string;
  }> = [];

  if (userStatus === USER_STATUS.PENDING_VERIFICATION) {
    todoList.push({
      type: "verify_email",
      title: "Xác thực email",
      message: "Vui lòng xác thực email để kích hoạt đầy đủ tài khoản.",
      cta: "/me/settings",
    });
  }

  const pendingOrder = userOrders.find(
    (o) => o.status === PAYMENT_ORDER_STATUS.SUBMITTED
  );
  if (pendingOrder) {
    todoList.push({
      type: "pending_order",
      title: "Đơn hàng đang chờ duyệt",
      message: `Đơn #${pendingOrder.transferNote || pendingOrder.id} đang chờ đối soát thanh toán.`,
      cta: "/me/subscription",
    });
  }

  if (isExpiringSoon) {
    todoList.push({
      type: "expiring_subscription",
      title: "Gói sắp hết hạn",
      message: `Gói học sẽ hết hạn trong ${daysLeft} ngày tới. Gia hạn để không gián đoạn học tập.`,
      cta: "/pricing",
    });
  }

  return todoList;
}

async function buildUserChildrenProgressData(
  repos: ReturnType<typeof useOwnerRepositories>,
  userChildren: readonly {
    readonly id: number;
    readonly uuid: string;
    readonly displayName: string;
    readonly birthYear: number;
    readonly avatarId: string;
    readonly relationship: number | null;
  }[],
  sevenDaysAgoDate: string,
  hasAdvancedReportAccess: boolean
): Promise<{
  childrenData: DashboardChildSummary[];
  recentProgressData: DashboardProgressSummary[];
}> {
  const childrenData: DashboardChildSummary[] = [];
  const recentProgressData: DashboardProgressSummary[] = [];

  for (const child of userChildren) {
    const [stats7d, latestSession] = await Promise.all([
      repos.analyticsRollup.listChildDailyStatsSince(
        child.id,
        sevenDaysAgoDate
      ),
      repos.analyticsRollup.findLatestSessionLevelForChild(child.id),
    ]);

    const daysPlayed7d = stats7d.filter(
      (s) => s.totalPlayTimeSeconds > 0
    ).length;
    const totalPlayTimeMinutes7d = Math.round(
      stats7d.reduce((sum, s) => sum + s.totalPlayTimeSeconds, 0) / 60
    );
    const totalLevelsCompleted7d = stats7d.reduce(
      (sum, s) => sum + s.levelsCompleted,
      0
    );

    childrenData.push({
      id: child.id,
      uuid: child.uuid,
      display_name: child.displayName,
      birth_year: child.birthYear,
      avatar_id: child.avatarId,
      relationship: child.relationship
        ? CHILD_RELATIONSHIP_CODEC.toLabel(
            child.relationship as Parameters<
              typeof CHILD_RELATIONSHIP_CODEC.toLabel
            >[0]
          )
        : null,
      days_played_7d: daysPlayed7d,
      latest_level: latestSession ? latestSession.gameLevel.code : null,
    });

    recentProgressData.push({
      child_id: child.id,
      child_uuid: child.uuid,
      display_name: child.displayName,
      days_played_7d: daysPlayed7d,
      total_play_time_minutes_7d: totalPlayTimeMinutes7d,
      levels_completed_7d: totalLevelsCompleted7d,
      report_url: hasAdvancedReportAccess
        ? `/me/children/${child.uuid}/report/advanced`
        : `/me/children/${child.uuid}/report`,
    });
  }

  return { childrenData, recentProgressData };
}

export async function getUserDashboard(
  event: H3Event,
  userId: number,
  query: UserDashboardQuery
): Promise<UserDashboardResult> {
  const repos = useOwnerRepositories();
  const [
    dbUser,
    userChildren,
    activeEntitlements,
    subs,
    userEntitlementRows,
    userOrders,
  ] = await Promise.all([
    repos.users.findById(userId),
    repos.childProfiles.listActiveByUser(userId),
    resolveUserActiveEntitlements(userId),
    repos.recurringSubscriptions.listByUser(userId),
    repos.entitlements.listActiveForUser(userId),
    repos.orders.listByUser(userId, 50),
  ]);

  const activeChild = resolveActiveChild(event, userChildren, query);
  const activeTiers = await allowedTiers(
    {
      kind: "user",
      user_id: String(userId),
      active_child_id: activeChild ? String(activeChild.id) : null,
    },
    activeEntitlements
  );

  const sub = subs.find(
    (s) => s.status === RECURRING_SUBSCRIPTION_STATUS.ACTIVE
  );
  const latestExpiresAt = resolveLatestEntitlementExpiry(userEntitlementRows);

  const { daysLeft, isExpiringSoon, subscriptionBlock } =
    computeSubscriptionState(
      sub
        ? {
            packageCode: sub.packageCode,
            status: RECURRING_SUBSCRIPTION_STATUS_CODEC.toLabel(sub.status),
            currentPeriodEnd: sub.currentPeriodEnd,
          }
        : undefined,
      activeTiers,
      userChildren.length,
      latestExpiresAt
    );

  const todoList = buildUserTodoList(
    dbUser?.status,
    userOrders,
    isExpiringSoon,
    daysLeft
  );

  const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const hasAdvancedReportAccess = activeEntitlements.includes(
    "view_advanced_report"
  );

  const { childrenData, recentProgressData } =
    await buildUserChildrenProgressData(
      repos,
      userChildren,
      sevenDaysAgoDate,
      hasAdvancedReportAccess
    );

  const curriculumBlock = await resolveCurriculumBlock(
    event,
    userId,
    activeChild
  );

  return {
    todo: todoList,
    children: childrenData,
    recent_progress: recentProgressData,
    curriculum: curriculumBlock,
    subscription: subscriptionBlock,
    active_child_id: activeChild?.id ?? null,
    active_child_uuid: activeChild?.uuid ?? null,
  };
}

async function resolveManagerDashboardAsOf(): Promise<string> {
  const repos = useOwnerRepositories();
  const [latestChildUpdatedAt, latestLevelUpdatedAt] = await Promise.all([
    repos.analyticsRollup.findLatestChildStatUpdatedAt(),
    repos.analyticsRollup.findLatestLevelStatUpdatedAt(),
  ]);

  const candidateDates = [latestChildUpdatedAt, latestLevelUpdatedAt].filter(
    (d): d is Date => Boolean(d)
  );

  if (candidateDates.length > 0) {
    const maxDate = new Date(
      Math.max(...candidateDates.map((d) => d.getTime()))
    );
    return maxDate.toISOString();
  }
  return new Date().toISOString();
}

async function queryManagerContentMetrics(): Promise<DashboardContentMetrics> {
  const repos = useOwnerRepositories();
  const [
    skillLevelCounts,
    allSkillsList,
    levelsHighDropRateCount,
    publishedLevelsCount,
  ] = await Promise.all([
    repos.tagging.countDistinctGameLevelsBySkill(),
    repos.taxonomy.listSkills(),
    repos.analyticsRollup.countHighDropLevels(0.4),
    repos.gameLevels.countAll(),
  ]);

  const skillsWithoutLevelsCount = allSkillsList.filter(
    (s) => !skillLevelCounts.has(s.id)
  ).length;

  return {
    skills_without_levels: {
      count: skillsWithoutLevelsCount,
      is_feedback: true,
    },
    levels_high_drop_rate: {
      count: levelsHighDropRateCount,
      is_feedback: true,
    },
    curriculum_weeks_incomplete: {
      status: "pending_source",
      owner_step: "P3.3",
      is_feedback: true,
    },
    published_levels: {
      count: publishedLevelsCount,
    },
    draft_levels: {
      count: 0,
    },
  };
}

async function queryManagerGrowthMetrics() {
  const repos = useOwnerRepositories();
  const nowMs = Date.now();
  const sevenDaysAgo = new Date(nowMs - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(nowMs - 14 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    newUsersCurrent,
    newUsersPrev,
    activeChildCurrent,
    activeChildPrev,
    activeSubsCurrent,
    revenueByPackage,
  ] = await Promise.all([
    repos.users.countCreatedInRange({ from: sevenDaysAgo }),
    repos.users.countCreatedInRange({
      from: fourteenDaysAgo,
      to: sevenDaysAgo,
      toExclusive: true,
    }),
    repos.analyticsRollup.countActiveChildrenBetween(sevenDaysAgo),
    repos.analyticsRollup.countActiveChildrenBetween(
      fourteenDaysAgo,
      sevenDaysAgo
    ),
    repos.entitlements.countActiveAll(),
    repos.orders.sumApprovedRevenueByPackage(startOfMonth),
  ]);

  const newUsersChange =
    newUsersPrev > 0
      ? Math.round(((newUsersCurrent - newUsersPrev) / newUsersPrev) * 100)
      : null;

  const activeChildChange =
    activeChildPrev > 0
      ? Math.round(
          ((activeChildCurrent - activeChildPrev) / activeChildPrev) * 100
        )
      : null;

  const monthlyRevenueVnd = Object.values(revenueByPackage).reduce(
    (sum, amt) => sum + amt,
    0
  );

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
      prev: activeChildPrev,
      change_percent: activeChildChange,
    },
    active_subscriptions: {
      current: activeSubsCurrent,
    },
    monthly_revenue: {
      current_vnd: monthlyRevenueVnd,
    },
  };
}

function queryManagerSystemMetrics() {
  const latestRows = readRecentLocalBackupLogs(1);
  const latest = latestRows[0];

  let backupStatus: "completed" | "verified" | "failed" | "pending" = "pending";
  if (latest?.status === "success") {
    backupStatus = "completed";
  } else if (latest?.status === "failed") {
    backupStatus = "failed";
  }

  const verified = Boolean(latest?.restoredRows && latest.restoredRows > 0);

  return Promise.resolve({
    last_backup: {
      as_of: latest?.startedAt ? latest.startedAt.toISOString() : null,
      status: backupStatus,
      verified,
    },
    llm_cost_month: {
      status: "pending_source" as const,
      owner_step: "P4",
    },
  });
}

export async function getManagerDashboard(
  role: "super_admin" | "content_reviewer"
): Promise<DashboardApiResponse> {
  const repos = useOwnerRepositories();
  const [asOf, content] = await Promise.all([
    resolveManagerDashboardAsOf(),
    queryManagerContentMetrics(),
  ]);

  if (role === "content_reviewer") {
    return {
      as_of: asOf,
      content,
    };
  }

  const [growth, system, pendingStats] = await Promise.all([
    queryManagerGrowthMetrics(),
    queryManagerSystemMetrics(),
    repos.orders.countPendingStats(),
  ]);

  return {
    as_of: asOf,
    todo: {
      pending_payments: {
        count: pendingStats.totalActionable,
      },
      pending_content: {
        count: 0,
      },
      open_alerts: {
        count: 0,
        items: [],
      },
    },
    growth,
    content,
    system,
  };
}

export async function getManagerLevelAnalytics(query: {
  readonly from?: string;
  readonly to?: string;
  readonly limit?: number;
}): Promise<ManagerLevelAnalyticsResult> {
  const rawLimit = query.limit ? Number(query.limit) : 50;
  const limit = Math.min(
    Math.max(1, Number.isInteger(rawLimit) ? rawLimit : 50),
    100
  );

  const repos = useOwnerRepositories();
  const rows = await repos.analyticsRollup.listLevelDailyStats({
    fromDateIct: query.from,
    toDateIct: query.to,
    limit,
  });

  const items: ManagerLevelAnalyticsItem[] = rows.map((row) => {
    const total = row.playsCount || 0;
    const abandonRate = total > 0 ? row.abandonedCount / total : 0;
    const completionRate = total > 0 ? row.completionsCount / total : 0;

    return {
      level_code: row.levelCode,
      content_version: 1,
      date_ict: row.dateIct,
      plays_count: row.playsCount,
      completions_count: row.completionsCount,
      abandoned_count: row.abandonedCount,
      avg_duration_seconds: row.avgDurationSeconds,
      avg_hints_used: row.avgHintsUsed,
      kpi_alerts: {
        high_abandonment:
          abandonRate > CONTENT_KPI_THRESHOLDS.HIGH_ABANDONMENT_RATE,
        low_accuracy: completionRate < CONTENT_KPI_THRESHOLDS.LOW_ACCURACY_RATE,
        low_plays: total < CONTENT_KPI_THRESHOLDS.LOW_PLAY_COUNT,
      },
    };
  });

  return {
    items,
    count: items.length,
    limit,
  };
}

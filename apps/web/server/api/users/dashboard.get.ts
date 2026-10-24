import {
  childDailyStats,
  childProfiles,
  childSessionSummaries,
  entitlements,
  gameLevels,
  getOwnerDb,
  paymentOrders,
  recurringSubscriptions,
  users,
} from "@mindkid/db";
import { ChildNotFoundError } from "@mindkid/errors/child";
import {
  allowedTiers,
  PACKAGE_CATALOG,
  resolveNextStep,
} from "@mindkid/shared";
import { and, desc, eq, gte } from "drizzle-orm";
import {
  defineEventHandler,
  getCookie,
  getQuery,
  type H3Event,
  setResponseStatus,
} from "h3";
import { z } from "zod";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { resolveEnrolledChildCurriculum } from "#server/utils/curriculum-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

const DashboardQuerySchema = z.object({
  child_id: z.union([z.string(), z.number()]).optional(),
  child_uuid: z.string().optional(),
});

type DashboardQuery = z.infer<typeof DashboardQuerySchema>;
type OwnerDatabase = ReturnType<typeof getOwnerDb>;

interface ChildRecord {
  id: number;
  uuid: string;
  displayName: string;
  birthYear: number;
  avatarId: string;
  relationship: string | null;
  status: string;
}

interface DashboardChildSummary {
  id: number;
  uuid: string;
  display_name: string;
  birth_year: number;
  avatar_id: string;
  relationship: string | null;
  days_played_7d: number;
  latest_level: string | null;
}

interface DashboardProgressSummary {
  child_id: number;
  child_uuid: string;
  display_name: string;
  days_played_7d: number;
  total_play_time_minutes_7d: number;
  levels_completed_7d: number;
  report_url: string;
}

interface ChildDataResult {
  childSummary: DashboardChildSummary;
  progressSummary: DashboardProgressSummary;
}

interface DashboardNextItem {
  entity_type: string;
  entity_code: string;
  title: string;
  locked: boolean;
}

interface DashboardCurriculumBlock {
  enrolled: boolean;
  curriculum?: null;
  enrollment_id?: number;
  curriculum_id?: number;
  curriculum_code?: string;
  title?: string;
  duration_weeks?: number;
  current_week?: number;
  current_session?: number;
  progress?: number;
  week_progress?: { done: number; total: number } | number;
  week_blocked_by_tier?: boolean;
  is_completed?: boolean;
  next_item?: DashboardNextItem | null;
}

async function fetchChildStats(
  db: OwnerDatabase,
  child: ChildRecord,
  sevenDaysAgoDate: string,
  hasAdvancedReportAccess: boolean
): Promise<ChildDataResult> {
  const stats7d = await db
    .select({
      dateIct: childDailyStats.dateIct,
      totalPlayTimeSeconds: childDailyStats.totalPlayTimeSeconds,
      levelsCompleted: childDailyStats.levelsCompleted,
    })
    .from(childDailyStats)
    .where(
      and(
        eq(childDailyStats.childProfileId, child.id),
        gte(childDailyStats.dateIct, sevenDaysAgoDate)
      )
    );

  const daysPlayed7d = stats7d.filter((s) => s.totalPlayTimeSeconds > 0).length;
  const totalPlayTimeMinutes7d = Math.round(
    stats7d.reduce((sum, s) => sum + s.totalPlayTimeSeconds, 0) / 60
  );
  const totalLevelsCompleted7d = stats7d.reduce(
    (sum, s) => sum + s.levelsCompleted,
    0
  );

  const [latestSession] = await db
    .select({
      levelCode: gameLevels.code,
      completedAt: childSessionSummaries.completedAt,
    })
    .from(childSessionSummaries)
    .innerJoin(gameLevels, eq(gameLevels.id, childSessionSummaries.gameLevelId))
    .where(eq(childSessionSummaries.childProfileId, child.id))
    .orderBy(desc(childSessionSummaries.completedAt))
    .limit(1);

  return {
    childSummary: {
      id: child.id,
      uuid: child.uuid,
      display_name: child.displayName,
      birth_year: child.birthYear,
      avatar_id: child.avatarId,
      relationship: child.relationship,
      days_played_7d: daysPlayed7d,
      latest_level: latestSession ? latestSession.levelCode : null,
    },
    progressSummary: {
      child_id: child.id,
      child_uuid: child.uuid,
      display_name: child.displayName,
      days_played_7d: daysPlayed7d,
      total_play_time_minutes_7d: totalPlayTimeMinutes7d,
      levels_completed_7d: totalLevelsCompleted7d,
      report_url: hasAdvancedReportAccess
        ? `/me/children/${child.uuid}/report/advanced`
        : `/me/children/${child.uuid}/report`,
    },
  };
}

async function resolveCurriculumBlock(
  event: H3Event,
  userId: number,
  activeChild: ChildRecord | null
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
  } catch (_err) {
    setResponseStatus(event, 200);
    return { enrolled: false, curriculum: null };
  }
}

function resolveActiveChild(
  event: H3Event,
  userChildren: ChildRecord[],
  query: DashboardQuery
): ChildRecord | null {
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

  return userChildren[0] || null;
}

async function buildTodoList(
  db: OwnerDatabase,
  userId: number,
  userStatus?: string,
  isExpiringSoon?: boolean,
  daysLeft?: number | null
) {
  const todoList: Array<{
    type: string;
    title: string;
    message: string;
    cta: string;
  }> = [];

  if (userStatus === "pending_verification") {
    todoList.push({
      type: "verify_email",
      title: "Xác thực email",
      message: "Vui lòng xác thực email để kích hoạt đầy đủ tài khoản.",
      cta: "/me/settings",
    });
  }

  const pendingOrders = await db
    .select({
      id: paymentOrders.id,
      transferNote: paymentOrders.transferNote,
      amountVnd: paymentOrders.amountVnd,
    })
    .from(paymentOrders)
    .where(
      and(
        eq(paymentOrders.userId, userId),
        eq(paymentOrders.status, "submitted")
      )
    )
    .limit(1);

  const pendingOrder = pendingOrders[0];
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

function resolveTierLabel(
  packageCode: string | null | undefined,
  activeTiers: string[]
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
        packageCode?: string | null;
        status?: string | null;
        currentPeriodEnd?: Date | null;
      }
    | undefined,
  activeTiers: string[],
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

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const db = getOwnerDb();
  const parsedQuery = DashboardQuerySchema.safeParse(getQuery(event));
  const query: DashboardQuery = parsedQuery.success ? parsedQuery.data : {};

  const [dbUser] = await db
    .select({
      id: users.id,
      status: users.status,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  const userChildren: ChildRecord[] = await db
    .select({
      id: childProfiles.id,
      uuid: childProfiles.uuid,
      displayName: childProfiles.displayName,
      birthYear: childProfiles.birthYear,
      avatarId: childProfiles.avatarId,
      relationship: childProfiles.relationship,
      status: childProfiles.status,
    })
    .from(childProfiles)
    .where(
      and(eq(childProfiles.userId, userId), eq(childProfiles.status, "active"))
    )
    .orderBy(childProfiles.id);

  const activeChild = resolveActiveChild(event, userChildren, query);
  const activeEntitlements = await resolveUserActiveEntitlements(userId);
  const activeTiers = await allowedTiers(
    {
      kind: "user",
      user_id: String(userId),
      active_child_id: activeChild ? String(activeChild.id) : null,
    },
    activeEntitlements
  );

  const [sub] = await db
    .select({
      packageCode: recurringSubscriptions.packageCode,
      status: recurringSubscriptions.status,
      currentPeriodEnd: recurringSubscriptions.currentPeriodEnd,
    })
    .from(recurringSubscriptions)
    .where(
      and(
        eq(recurringSubscriptions.userId, userId),
        eq(recurringSubscriptions.status, "active")
      )
    )
    .orderBy(desc(recurringSubscriptions.id))
    .limit(1);

  const [latestEntitlement] = await db
    .select({
      expiresAt: entitlements.expiresAt,
    })
    .from(entitlements)
    .where(
      and(eq(entitlements.userId, userId), eq(entitlements.status, "active"))
    )
    .orderBy(desc(entitlements.expiresAt))
    .limit(1);

  const { daysLeft, isExpiringSoon, subscriptionBlock } =
    computeSubscriptionState(
      sub,
      activeTiers,
      userChildren.length,
      latestEntitlement?.expiresAt ?? null
    );

  const todoList = await buildTodoList(
    db,
    userId,
    dbUser?.status,
    isExpiringSoon,
    daysLeft
  );

  const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const childrenData: DashboardChildSummary[] = [];
  const recentProgressData: DashboardProgressSummary[] = [];

  const hasAdvancedReportAccess = activeEntitlements.includes(
    "view_advanced_report"
  );

  for (const child of userChildren) {
    const stats = await fetchChildStats(
      db,
      child,
      sevenDaysAgoDate,
      hasAdvancedReportAccess
    );
    childrenData.push(stats.childSummary);
    recentProgressData.push(stats.progressSummary);
  }

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
});

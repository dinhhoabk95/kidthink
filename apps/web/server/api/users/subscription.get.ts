import {
  childProfiles,
  entitlementKeys,
  entitlements,
  getDb,
  paymentOrders,
  recurringSubscriptions,
  users,
} from "@mindkid/db";
import { UnauthenticatedError } from "@mindkid/errors/auth";
import { PACKAGE_CATALOG, type PackageDefinition } from "@mindkid/shared";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { defineEventHandler } from "h3";
import { requireWebUserSession } from "#server/utils/auth-runtime";

const DATA_PRESERVATION_NOTICE =
  "Khi gói hết hạn, hồ sơ của các bé và toàn bộ tiến độ học vẫn được giữ nguyên. Bạn chỉ tạm thời không truy cập được nội dung trả phí.";

interface EntitlementDbRow {
  id: number;
  key: string;
  source: string;
  status: string;
  grantedAt: Date;
  expiresAt: Date | null;
  label: string | null;
  description: string | null;
  group: string | null;
}

interface ResolvedEntitlement {
  key: string;
  label: string;
  description: string | null;
  group: string;
  status: string;
  source_label: string;
  expires_at: string | null;
  is_soft_unlock: boolean;
}

interface ActivePackageItem {
  code: string;
  name: string;
  description: string;
  status: string;
  source_label: string;
  granted_at: string;
  expires_at: string | null;
  days_left: number | null;
  is_soft_unlock: boolean;
}

function resolveSourceLabel(source: string): string {
  switch (source) {
    case "manual_grant":
      return "Được cấp";
    case "trial":
      return "Dùng thử";
    case "promo":
      return "Khuyến mãi";
    default:
      return "Gói đã mua";
  }
}

function resolveEntitlements(
  userEntitlementRows: EntitlementDbRow[],
  now: Date
): { activeOrSoftRows: EntitlementDbRow[]; resolved: ResolvedEntitlement[] } {
  const activeOrSoftRows = userEntitlementRows.filter((e) => {
    const isNotExpired = !e.expiresAt || new Date(e.expiresAt) > now;
    return (
      isNotExpired &&
      (e.status === "active" ||
        e.status === "soft_unlock" ||
        e.status === "grace_period")
    );
  });

  const activeKeyMap = new Map<string, EntitlementDbRow>();
  for (const r of activeOrSoftRows) {
    if (!activeKeyMap.has(r.key)) {
      activeKeyMap.set(r.key, r);
    }
  }

  const resolved = Array.from(activeKeyMap.values()).map((e) => ({
    key: e.key,
    label: e.label || e.key,
    description: e.description || null,
    group: e.group || "content",
    status: e.status,
    source_label: resolveSourceLabel(e.source),
    expires_at: e.expiresAt ? new Date(e.expiresAt).toISOString() : null,
    is_soft_unlock: e.status === "soft_unlock",
  }));

  return { activeOrSoftRows, resolved };
}

function resolvePackages(
  activeOrSoftRows: EntitlementDbRow[],
  now: Date
): ActivePackageItem[] {
  const activePackages: ActivePackageItem[] = [];

  for (const pkg of Object.values(PACKAGE_CATALOG) as PackageDefinition[]) {
    if (!pkg.entitlements || pkg.entitlements.length === 0) {
      continue;
    }
    const matching = activeOrSoftRows.filter((e) =>
      (pkg.entitlements as readonly string[]).includes(e.key)
    );

    const primary = matching[0];
    if (primary) {
      const expiresAtDate = primary.expiresAt
        ? new Date(primary.expiresAt)
        : null;
      let daysLeft: number | null = null;
      if (expiresAtDate) {
        daysLeft = Math.max(
          0,
          Math.ceil(
            (expiresAtDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
        );
      }

      activePackages.push({
        code: pkg.code,
        name: pkg.name,
        description: pkg.description,
        status: primary.status,
        source_label: resolveSourceLabel(primary.source),
        granted_at: new Date(primary.grantedAt).toISOString(),
        expires_at: expiresAtDate ? expiresAtDate.toISOString() : null,
        days_left: daysLeft,
        is_soft_unlock: primary.status === "soft_unlock",
      });
    }
  }

  return activePackages;
}

function calculateQuotas(
  activePackages: ActivePackageItem[],
  childrenUsed: number
) {
  let maxChildProfiles = 1;
  let dailyPlayMinutes = 30;

  for (const p of activePackages) {
    const def = PACKAGE_CATALOG[p.code];
    if (def?.quotas?.child_profiles) {
      maxChildProfiles = Math.max(maxChildProfiles, def.quotas.child_profiles);
    }
    if (def?.quotas?.daily_play_minutes) {
      dailyPlayMinutes = Math.max(
        dailyPlayMinutes,
        def.quotas.daily_play_minutes
      );
    }
  }

  return [
    {
      quota_key: "child_profiles",
      label: "Hồ sơ trẻ",
      used: childrenUsed,
      total: maxChildProfiles,
    },
    {
      quota_key: "daily_play_minutes",
      label: "Thời lượng chơi mỗi ngày (phút/trẻ)",
      used: 0,
      total: dailyPlayMinutes,
    },
  ];
}

interface OrderDbRow {
  id: number;
  uuid: string;
  packageCode: string;
  offerCode: string;
  amountVnd: number;
  currency: string;
  status: string;
  createdAt: Date;
  submittedAt: Date | null;
  reviewedAt: Date | null;
}

function mapOrders(orderRows: OrderDbRow[]) {
  return orderRows.map((o) => {
    const pkg = PACKAGE_CATALOG[o.packageCode];
    const politeReason =
      o.status === "rejected"
        ? "Thông tin chuyển khoản hoặc chứng từ chưa khớp với giao dịch ngân hàng. Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ."
        : null;

    return {
      id: o.id,
      uuid: o.uuid,
      package_code: o.packageCode,
      package_name: pkg?.name || o.packageCode,
      offer_code: o.offerCode,
      amount_vnd: Number(o.amountVnd),
      currency: o.currency,
      status: o.status,
      created_at: o.createdAt.toISOString(),
      submitted_at: o.submittedAt ? o.submittedAt.toISOString() : null,
      reviewed_at: o.reviewedAt ? o.reviewedAt.toISOString() : null,
      polite_reason: politeReason,
    };
  });
}

export default defineEventHandler(async (event) => {
  const session = requireWebUserSession(event);
  const db = getDb();
  const now = new Date();

  const [userRecord] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user_id))
    .limit(1);

  if (!userRecord) {
    throw new UnauthenticatedError();
  }

  const userEntitlementRows = await db
    .select({
      id: entitlements.id,
      key: entitlements.entitlementKey,
      source: entitlements.source,
      status: entitlements.status,
      grantedAt: entitlements.grantedAt,
      expiresAt: entitlements.expiresAt,
      label: entitlementKeys.label,
      description: entitlementKeys.description,
      group: entitlementKeys.group,
    })
    .from(entitlements)
    .leftJoin(
      entitlementKeys,
      eq(entitlements.entitlementKey, entitlementKeys.key)
    )
    .where(
      and(
        eq(entitlements.userId, session.user_id),
        inArray(entitlements.status, [
          "active",
          "soft_unlock",
          "grace_period",
          "expired",
          "cancelled",
        ])
      )
    )
    .orderBy(desc(entitlements.id));

  const { activeOrSoftRows, resolved: resolvedEntitlements } =
    resolveEntitlements(userEntitlementRows, now);

  const activePackages = resolvePackages(activeOrSoftRows, now);

  const [childrenCountResult] = await db
    .select({ val: count(childProfiles.id) })
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.userId, session.user_id),
        eq(childProfiles.status, "active")
      )
    );

  const quotas = calculateQuotas(
    activePackages,
    Number(childrenCountResult?.val ?? 0)
  );

  const orderRows = await db
    .select({
      id: paymentOrders.id,
      uuid: paymentOrders.uuid,
      packageCode: paymentOrders.packageCode,
      offerCode: paymentOrders.offerCode,
      amountVnd: paymentOrders.amountVnd,
      currency: paymentOrders.currency,
      status: paymentOrders.status,
      createdAt: paymentOrders.createdAt,
      submittedAt: paymentOrders.submittedAt,
      reviewedAt: paymentOrders.reviewedAt,
    })
    .from(paymentOrders)
    .where(eq(paymentOrders.userId, session.user_id))
    .orderBy(desc(paymentOrders.id));

  const [activeSub] = await db
    .select()
    .from(recurringSubscriptions)
    .where(
      and(
        eq(recurringSubscriptions.userId, session.user_id),
        inArray(recurringSubscriptions.status, ["active", "past_due"])
      )
    )
    .orderBy(desc(recurringSubscriptions.id))
    .limit(1);

  const recurringInfo = activeSub
    ? {
        id: activeSub.id,
        package_code: activeSub.packageCode,
        billing_period: activeSub.billingPeriod,
        price_vnd: activeSub.priceVnd,
        auto_renew: activeSub.autoRenew,
        status: activeSub.status,
        current_period_end: activeSub.currentPeriodEnd.toISOString(),
        next_billing_at: activeSub.nextBillingAt
          ? activeSub.nextBillingAt.toISOString()
          : null,
        can_cancel: activeSub.autoRenew && activeSub.status === "active",
      }
    : null;

  const orders = mapOrders(orderRows);
  const hasPremium = activePackages.some((p) => p.code === "PKG-premium");

  return {
    packages: activePackages,
    entitlements: resolvedEntitlements,
    quotas,
    orders,
    recurring_subscription: recurringInfo,
    cancellation_guidance:
      "Huỷ gia hạn tự động có thể thực hiện trực tiếp tại đây bất kỳ lúc nào. Quyền lợi hiện tại được giữ nguyên cho đến hết chu kỳ đã thanh toán. Trường hợp cần hỗ trợ thoả thuận hoàn tiền, vui lòng liên hệ qua Zalo OA hoặc Facebook Messenger hỗ trợ của MindKid.",
    data_preservation_notice: DATA_PRESERVATION_NOTICE,
    has_higher_tier: !hasPremium,
  };
});

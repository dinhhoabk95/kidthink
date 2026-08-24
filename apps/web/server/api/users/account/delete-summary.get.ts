import { childProfiles, entitlements, getOwnerDb } from "@mindkid/db";
import { and, count, eq, gt, isNull, or } from "drizzle-orm";
import { defineEventHandler } from "h3";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const userSession = await requireWebUserSession(event);
  const userId = Number(userSession.user_id);

  const db = getOwnerDb();

  // Count non-archived children
  const [{ value: childCount }] = await db
    .select({ value: count() })
    .from(childProfiles)
    .where(
      and(eq(childProfiles.userId, userId), eq(childProfiles.status, "active"))
    );

  // Check active subscription days remaining
  const now = new Date();
  const activePackages = await db
    .select({ expiresAt: entitlements.expiresAt })
    .from(entitlements)
    .where(
      and(
        eq(entitlements.userId, userId),
        eq(entitlements.status, "active"),
        or(isNull(entitlements.expiresAt), gt(entitlements.expiresAt, now))
      )
    );

  let maxDaysRemaining = 0;
  for (const pkg of activePackages) {
    if (!pkg.expiresAt) {
      maxDaysRemaining = 365;
      break;
    }
    const days = Math.ceil(
      (pkg.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days > maxDaysRemaining) {
      maxDaysRemaining = days;
    }
  }

  // BR-ADL-07: Display exact lost items and retained items
  return {
    child_profiles_count: Number(childCount),
    active_subscription_days: maxDaysRemaining,
    grace_period_days: 30,
    lost_data_items: [
      `${childCount} hồ sơ bé và toàn bộ tiến độ học tập, huy hiệu`,
      "Lịch sử các phiên chơi tương tác và báo cáo phân tích",
      `Quyền truy cập gói học còn lại (${maxDaysRemaining > 0 ? `${maxDaysRemaining} ngày` : "không có gói đang hoạt động"})`,
    ],
    retained_legal_items: [
      "Lịch sử giao dịch thanh toán (theo Luật Kế toán và thuế, thông tin cá nhân được ẩn danh)",
      "Bản ghi đồng ý pháp lý (theo Nghị định 13/2023/NĐ-CP, không chứa thông tin của trẻ)",
      "Nhật ký kiểm toán hệ thống (theo Luật An ninh mạng)",
    ],
  };
});

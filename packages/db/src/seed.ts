import { getOwnerDb } from "./index.ts";
import {
  entitlementKeys,
  packageEntitlements,
  packages,
} from "./schema/billing.ts";

/**
 * PENDING_PRICE_VND per package-catalog.md §11 Q1.
 * Prices will be updated when payment gateway integration is configured.
 */
export const PENDING_PRICE_VND = 0;

export const SEED_ENTITLEMENT_KEYS = [
  {
    key: "play_game",
    group: "content" as const,
    labelVi: "Quyền chơi trò chơi",
  },
  {
    key: "view_curriculum",
    group: "content" as const,
    labelVi: "Xem chương trình học",
  },
  {
    key: "manage_child",
    group: "account" as const,
    labelVi: "Quản lý hồ sơ trẻ",
  },
  {
    key: "view_analytics",
    group: "report" as const,
    labelVi: "Xem báo cáo tiến trình",
  },
  {
    key: "export_pdf",
    group: "creator" as const,
    labelVi: "Xuất phiếu bài tập PDF",
  },
  { key: "ai_tutor", group: "ai" as const, labelVi: "Trợ lý AI hướng dẫn" },
  {
    key: "custom_curriculum",
    group: "creator" as const,
    labelVi: "Tùy chỉnh lộ trình học",
  },
  {
    key: "unlimited_play",
    group: "content" as const,
    labelVi: "Chơi không giới hạn lượt",
  },
  { key: "multi_child", group: "account" as const, labelVi: "Thêm nhiều trẻ" },
  {
    key: "offline_access",
    group: "content" as const,
    labelVi: "Tải bài tập ngoại tuyến",
  },
  {
    key: "priority_support",
    group: "account" as const,
    labelVi: "Hỗ trợ ưu tiên",
  },
  {
    key: "early_access",
    group: "content" as const,
    labelVi: "Trải nghiệm tính năng mới",
  },
  {
    key: "teacher_dashboard",
    group: "report" as const,
    labelVi: "Bảng điều khiển giáo viên",
  },
  {
    key: "school_license",
    group: "account" as const,
    labelVi: "Bản quyền trường học",
  },
  {
    key: "api_access",
    group: "creator" as const,
    labelVi: "Truy cập API tích hợp",
  },
  {
    key: "content_authoring",
    group: "creator" as const,
    labelVi: "Soạn thảo nội dung",
  },
];

export const SEED_PACKAGES = [
  {
    code: "PKG-standard",
    nameVi: "Gói Tiêu chuẩn",
    audienceVi: "Gia đình mầm non 3-6 tuổi",
    descriptionVi: "Dành cho gia đình trải nghiệm nội dung tư duy cơ bản",
    status: "active" as const,
    offers: [{ duration_months: 1, price_vnd: PENDING_PRICE_VND }],
  },
  {
    code: "PKG-premium",
    nameVi: "Gói Cao cấp",
    audienceVi: "Gia đình mầm non 3-6 tuổi",
    descriptionVi: "Dành cho gia đình khai thác toàn bộ tính năng và trợ lý AI",
    status: "active" as const,
    offers: [{ duration_months: 12, price_vnd: PENDING_PRICE_VND }],
  },
];

export const SEED_PACKAGE_ENTITLEMENTS = [
  // Standard (5 keys)
  { packageCode: "PKG-standard", entitlementKey: "play_game" },
  { packageCode: "PKG-standard", entitlementKey: "view_curriculum" },
  { packageCode: "PKG-standard", entitlementKey: "manage_child" },
  { packageCode: "PKG-standard", entitlementKey: "view_analytics" },
  { packageCode: "PKG-standard", entitlementKey: "export_pdf" },
  // Premium (7 keys)
  { packageCode: "PKG-premium", entitlementKey: "play_game" },
  { packageCode: "PKG-premium", entitlementKey: "view_curriculum" },
  { packageCode: "PKG-premium", entitlementKey: "manage_child" },
  { packageCode: "PKG-premium", entitlementKey: "view_analytics" },
  { packageCode: "PKG-premium", entitlementKey: "export_pdf" },
  { packageCode: "PKG-premium", entitlementKey: "ai_tutor" },
  { packageCode: "PKG-premium", entitlementKey: "custom_curriculum" },
];

export async function seed() {
  const db = getOwnerDb();
  console.log("[db:seed] Seeding database...");

  // 1. Seed entitlement_keys (16 keys)
  for (const item of SEED_ENTITLEMENT_KEYS) {
    await db
      .insert(entitlementKeys)
      .values(item)
      .onConflictDoUpdate({
        target: entitlementKeys.key,
        set: { labelVi: item.labelVi, group: item.group },
      });
  }

  // 2. Seed packages (2 packages)
  for (const item of SEED_PACKAGES) {
    await db
      .insert(packages)
      .values(item)
      .onConflictDoUpdate({
        target: packages.code,
        set: {
          nameVi: item.nameVi,
          audienceVi: item.audienceVi,
          descriptionVi: item.descriptionVi,
          status: item.status,
          offers: item.offers,
        },
      });
  }

  // 3. Seed package_entitlements (12 mappings)
  for (const item of SEED_PACKAGE_ENTITLEMENTS) {
    await db.insert(packageEntitlements).values(item).onConflictDoNothing();
  }

  console.log("✅ [db:seed] Seed completed successfully.");
}

// Allow direct execution via CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ [db:seed] Seed failed:", err);
      process.exit(1);
    });
}

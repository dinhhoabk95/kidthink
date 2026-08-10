export const PENDING_PRICE_VND = 0;

export const ENTITLEMENT_KEYS = [
  {
    key: "play_free_games",
    group: "content",
    labelVi: "Chơi trò chơi miễn phí",
    is_mvp: true,
  },
  {
    key: "play_login_games",
    group: "content",
    labelVi: "Chơi trò chơi yêu cầu đăng nhập",
    is_mvp: true,
  },
  {
    key: "play_standard_games",
    group: "content",
    labelVi: "Chơi trò chơi tiêu chuẩn",
    is_mvp: true,
  },
  {
    key: "play_premium_games",
    group: "content",
    labelVi: "Chơi trò chơi cao cấp",
    is_mvp: true,
  },
  {
    key: "access_premium_curriculum",
    group: "content",
    labelVi: "Truy cập lộ trình cao cấp",
    is_mvp: true,
  },
  {
    key: "manage_children",
    group: "account",
    labelVi: "Quản lý hồ sơ trẻ",
    is_mvp: true,
  },
  {
    key: "view_basic_report",
    group: "report",
    labelVi: "Xem báo cáo cơ bản",
    is_mvp: true,
  },
  {
    key: "view_advanced_report",
    group: "report",
    labelVi: "Xem báo cáo nâng cao",
    is_mvp: true,
  },
  {
    key: "create_lesson_plan",
    group: "creator",
    labelVi: "Tạo giáo án học tập",
    is_mvp: false,
  },
  {
    key: "duplicate_lesson",
    group: "creator",
    labelVi: "Sao chép bài học",
    is_mvp: false,
  },
  {
    key: "customize_lesson",
    group: "creator",
    labelVi: "Tùy chỉnh bài học",
    is_mvp: false,
  },
  {
    key: "export_pdf",
    group: "creator",
    labelVi: "Xuất PDF bài tập",
    is_mvp: false,
  },
  {
    key: "create_custom_curriculum",
    group: "creator",
    labelVi: "Tạo lộ trình tùy chỉnh",
    is_mvp: false,
  },
  {
    key: "create_custom_game",
    group: "creator",
    labelVi: "Tạo trò chơi tùy chỉnh",
    is_mvp: false,
  },
  {
    key: "use_ai_analysis",
    group: "ai",
    labelVi: "Sử dụng phân tích AI",
    is_mvp: false,
  },
  {
    key: "use_ai_search",
    group: "ai",
    labelVi: "Sử dụng tìm kiếm AI",
    is_mvp: false,
  },
] as const;

export type EntitlementKey = (typeof ENTITLEMENT_KEYS)[number]["key"];

export const QUOTA_KEYS = [
  {
    key: "child_profiles",
    labelVi: "Hồ sơ trẻ",
    unit: "profile",
    cycle: "none",
  },
  {
    key: "daily_play_minutes",
    labelVi: "Thời gian chơi hàng ngày",
    unit: "minutes_per_child",
    cycle: "daily_ict",
  },
  {
    key: "data_export",
    labelVi: "Lượt xuất dữ liệu",
    unit: "count",
    cycle: "hours_24",
  },
  {
    key: "lesson_plans_per_month",
    labelVi: "Giáo án mỗi tháng",
    unit: "plans",
    cycle: "monthly",
  },
  {
    key: "custom_games_saved",
    labelVi: "Trò chơi tùy chỉnh đã lưu",
    unit: "games",
    cycle: "none",
  },
  { key: "ai_calls", labelVi: "Lượt gọi AI", unit: "count", cycle: "monthly" },
  {
    key: "upload_mb",
    labelVi: "Dung lượng tải lên",
    unit: "mb",
    cycle: "none",
  },
] as const;

export type QuotaKey = (typeof QUOTA_KEYS)[number]["key"];

export function assertEntitlementKey(key: string): EntitlementKey {
  const found = ENTITLEMENT_KEYS.find((k) => k.key === key);
  if (!found) {
    throw new Error(
      `UNKNOWN_ENTITLEMENT_KEY: Key "${key}" is not registered in entitlement_keys registry.`
    );
  }
  return found.key;
}

export interface Offer {
  offer_code: string;
  billing_period_vi: string;
  price_vnd: number;
  duration_days: number | null;
}

export interface PackageDefinition {
  code: `PKG-${string}`;
  name_vi: string;
  audience_vi: string;
  description_vi: string;
  entitlements: EntitlementKey[];
  quotas: Partial<Record<QuotaKey, number>>;
  offers: Offer[];
  is_public: boolean;
  is_featured: boolean;
  status: "active" | "retired";
}

export const PACKAGE_CATALOG: Record<string, PackageDefinition> = {
  "PKG-standard": {
    code: "PKG-standard",
    name_vi: "Tiêu chuẩn",
    audience_vi: "Phụ huynh phổ thông",
    description_vi: "Dành cho phụ huynh theo dõi tiến độ của 3 trẻ",
    entitlements: [
      "play_login_games",
      "play_standard_games",
      "manage_children",
      "view_basic_report",
      "view_advanced_report",
    ],
    quotas: {
      child_profiles: 3,
      daily_play_minutes: 60,
    },
    offers: [
      {
        offer_code: "annual",
        billing_period_vi: "1 năm",
        price_vnd: PENDING_PRICE_VND,
        duration_days: 365,
      },
    ],
    is_public: true,
    is_featured: false,
    status: "active",
  },
  "PKG-premium": {
    code: "PKG-premium",
    name_vi: "Premium",
    audience_vi: "Phụ huynh theo dõi sâu + giáo viên",
    description_vi: "Mở khoá toàn bộ game, lộ trình nâng cao và tối đa 5 trẻ",
    entitlements: [
      "play_login_games",
      "play_standard_games",
      "play_premium_games",
      "access_premium_curriculum",
      "manage_children",
      "view_basic_report",
      "view_advanced_report",
    ],
    quotas: {
      child_profiles: 5,
      daily_play_minutes: 90,
    },
    offers: [
      {
        offer_code: "annual",
        billing_period_vi: "1 năm",
        price_vnd: PENDING_PRICE_VND,
        duration_days: 365,
      },
      {
        offer_code: "lifetime",
        billing_period_vi: "trọn đời",
        price_vnd: PENDING_PRICE_VND,
        duration_days: null,
      },
    ],
    is_public: true,
    is_featured: true,
    status: "active",
  },
  "PKG-addon_lesson_plan": {
    code: "PKG-addon_lesson_plan",
    name_vi: "Add-on Giáo án",
    audience_vi: "Giáo viên mầm non",
    description_vi: "Tạo, tuỳ chỉnh và xuất PDF giáo án",
    entitlements: [
      "create_lesson_plan",
      "duplicate_lesson",
      "customize_lesson",
      "export_pdf",
    ],
    quotas: {
      lesson_plans_per_month: 20,
    },
    offers: [
      {
        offer_code: "annual",
        billing_period_vi: "1 năm",
        price_vnd: PENDING_PRICE_VND,
        duration_days: 365,
      },
    ],
    is_public: false,
    is_featured: false,
    status: "active",
  },
  "PKG-addon_curriculum": {
    code: "PKG-addon_curriculum",
    name_vi: "Add-on Lộ trình tùy chỉnh",
    audience_vi: "Giáo viên và nhà thiết kế nội dung",
    description_vi: "Tạo lộ trình học cá nhân hoá",
    entitlements: ["create_custom_curriculum"],
    quotas: {},
    offers: [
      {
        offer_code: "annual",
        billing_period_vi: "1 năm",
        price_vnd: PENDING_PRICE_VND,
        duration_days: 365,
      },
    ],
    is_public: false,
    is_featured: false,
    status: "active",
  },
  "PKG-addon_custom_game": {
    code: "PKG-addon_custom_game",
    name_vi: "Add-on Trò chơi tùy chỉnh",
    audience_vi: "Giáo viên mầm non",
    description_vi: "Tạo trò chơi tuỳ chỉnh từ mẫu",
    entitlements: ["create_custom_game"],
    quotas: {
      custom_games_saved: 10,
    },
    offers: [
      {
        offer_code: "annual",
        billing_period_vi: "1 năm",
        price_vnd: PENDING_PRICE_VND,
        duration_days: 365,
      },
    ],
    is_public: false,
    is_featured: false,
    status: "active",
  },
  "PKG-addon_ai": {
    code: "PKG-addon_ai",
    name_vi: "Add-on AI Assistant",
    audience_vi: "Phụ huynh và giáo viên",
    description_vi: "Phân tích tiến trình và tìm kiếm thông minh bằng AI",
    entitlements: ["use_ai_analysis", "use_ai_search"],
    quotas: {
      ai_calls: 100,
    },
    offers: [
      {
        offer_code: "annual",
        billing_period_vi: "1 năm",
        price_vnd: PENDING_PRICE_VND,
        duration_days: 365,
      },
    ],
    is_public: false,
    is_featured: false,
    status: "active",
  },
};

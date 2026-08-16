export const PENDING_PRICE_VND = 0;

export const ENTITLEMENT_KEYS = [
  {
    key: "play_free_games",
    group: "content",
    label: "Chơi trò chơi miễn phí",
    is_mvp: true,
  },
  {
    key: "play_login_games",
    group: "content",
    label: "Chơi trò chơi yêu cầu đăng nhập",
    is_mvp: true,
  },
  {
    key: "play_standard_games",
    group: "content",
    label: "Chơi trò chơi tiêu chuẩn",
    is_mvp: true,
  },
  {
    key: "play_premium_games",
    group: "content",
    label: "Chơi trò chơi cao cấp",
    is_mvp: true,
  },
  {
    key: "access_premium_curriculum",
    group: "content",
    label: "Truy cập lộ trình cao cấp",
    is_mvp: true,
  },
  {
    key: "manage_children",
    group: "account",
    label: "Quản lý hồ sơ trẻ",
    is_mvp: true,
  },
  {
    key: "view_basic_report",
    group: "report",
    label: "Xem báo cáo cơ bản",
    is_mvp: true,
  },
  {
    key: "view_advanced_report",
    group: "report",
    label: "Xem báo cáo nâng cao",
    is_mvp: true,
  },
  {
    key: "create_lesson_plan",
    group: "creator",
    label: "Tạo giáo án học tập",
    is_mvp: false,
  },
  {
    key: "duplicate_lesson",
    group: "creator",
    label: "Sao chép bài học",
    is_mvp: false,
  },
  {
    key: "customize_lesson",
    group: "creator",
    label: "Tùy chỉnh bài học",
    is_mvp: false,
  },
  {
    key: "export_pdf",
    group: "creator",
    label: "Xuất PDF bài tập",
    is_mvp: false,
  },
  {
    key: "create_custom_curriculum",
    group: "creator",
    label: "Tạo lộ trình tùy chỉnh",
    is_mvp: false,
  },
  {
    key: "create_custom_game",
    group: "creator",
    label: "Tạo trò chơi tùy chỉnh",
    is_mvp: false,
  },
  {
    key: "use_ai_analysis",
    group: "ai",
    label: "Sử dụng phân tích AI",
    is_mvp: false,
  },
  {
    key: "use_ai_search",
    group: "ai",
    label: "Sử dụng tìm kiếm AI",
    is_mvp: false,
  },
] as const;

export type EntitlementKey = (typeof ENTITLEMENT_KEYS)[number]["key"];

export const QUOTA_KEYS = [
  {
    key: "child_profiles",
    label: "Hồ sơ trẻ",
    unit: "profile",
    cycle: "none",
  },
  {
    key: "daily_play_minutes",
    label: "Thời gian chơi hàng ngày",
    unit: "minutes_per_child",
    cycle: "daily_ict",
  },
  {
    key: "data_export",
    label: "Lượt xuất dữ liệu",
    unit: "count",
    cycle: "hours_24",
  },
  {
    key: "lesson_plans_per_month",
    label: "Giáo án mỗi tháng",
    unit: "plans",
    cycle: "monthly",
  },
  {
    key: "custom_games_saved",
    label: "Trò chơi tùy chỉnh đã lưu",
    unit: "games",
    cycle: "none",
  },
  {
    key: "custom_curricula_saved",
    label: "Lộ trình tùy chỉnh đã lưu",
    unit: "curricula",
    cycle: "none",
  },
  { key: "ai_calls", label: "Lượt gọi AI", unit: "count", cycle: "monthly" },
  {
    key: "upload_mb",
    label: "Dung lượng tải lên",
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
  billing_period: string;
  price_vnd: number;
  duration_days: number | null;
}

export interface PackageDefinition {
  code: `PKG-${string}`;
  name: string;
  audience: string;
  description: string;
  entitlements: EntitlementKey[];
  quotas: Partial<Record<QuotaKey, number>>;
  offers: Offer[];
  is_public: boolean;
  is_featured: boolean;
  status: "active" | "retired";
  requires_spec?: string;
  credits_grant?: number;
}

export const PACKAGE_CATALOG: Record<string, PackageDefinition> = {
  "PKG-standard": {
    code: "PKG-standard",
    name: "Tiêu chuẩn",
    audience: "Người dùng phổ thông",
    description: "Dành cho người dùng theo dõi tiến độ của 3 trẻ",
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
        billing_period: "1 năm",
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
    name: "Premium",
    audience: "Người dùng theo dõi sâu",
    description: "Mở khoá toàn bộ game, lộ trình nâng cao và tối đa 5 trẻ",
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
        billing_period: "1 năm",
        price_vnd: PENDING_PRICE_VND,
        duration_days: 365,
      },
      {
        offer_code: "lifetime",
        billing_period: "trọn đời",
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
    name: "Add-on Giáo án",
    audience: "Người dùng tự soạn giáo án",
    description: "Tạo, tuỳ chỉnh và xuất PDF giáo án",
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
        billing_period: "1 năm",
        price_vnd: PENDING_PRICE_VND,
        duration_days: 365,
      },
    ],
    is_public: false,
    is_featured: false,
    status: "active",
    requires_spec: "07-addon/lesson-plan-creator.md",
  },
  "PKG-addon_curriculum": {
    code: "PKG-addon_curriculum",
    name: "Add-on Lộ trình tùy chỉnh",
    audience: "Người dùng tự dựng lộ trình",
    description: "Tạo lộ trình học cá nhân hoá",
    entitlements: ["create_custom_curriculum"],
    quotas: {
      custom_curricula_saved: 5,
    },
    offers: [
      {
        offer_code: "annual",
        billing_period: "1 năm",
        price_vnd: PENDING_PRICE_VND,
        duration_days: 365,
      },
    ],
    is_public: false,
    is_featured: false,
    status: "active",
    requires_spec: "07-addon/personal-curriculum.md",
  },
  "PKG-addon_custom_game": {
    code: "PKG-addon_custom_game",
    name: "Add-on Trò chơi tùy chỉnh",
    audience: "Người dùng tự tạo trò chơi",
    description: "Tạo trò chơi tuỳ chỉnh từ mẫu",
    entitlements: ["create_custom_game"],
    quotas: {
      custom_games_saved: 10,
    },
    offers: [
      {
        offer_code: "annual",
        billing_period: "1 năm",
        price_vnd: PENDING_PRICE_VND,
        duration_days: 365,
      },
    ],
    is_public: false,
    is_featured: false,
    status: "active",
    requires_spec: "07-addon/custom-game-builder.md",
  },
  "PKG-addon_ai": {
    code: "PKG-addon_ai",
    name: "Add-on AI Assistant",
    audience: "Mọi người dùng",
    description: "Phân tích tiến trình và tìm kiếm thông minh bằng AI",
    entitlements: ["use_ai_analysis", "use_ai_search"],
    quotas: {},
    credits_grant: 100,
    offers: [
      {
        offer_code: "annual",
        billing_period: "1 năm",
        price_vnd: PENDING_PRICE_VND,
        duration_days: 365,
      },
    ],
    is_public: false,
    is_featured: false,
    status: "active",
    requires_spec: "07-addon/ai-credit-ledger.md",
  },
};

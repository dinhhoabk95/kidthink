import type { ManagerRole } from "./lifecycle.js";

export type DashboardCardGroup = "todo" | "growth" | "content" | "system";

export interface DashboardCardThreshold {
  maxCount?: number;
  maxOldestHours?: number;
  maxDropRatePercent?: number;
  warningText: string;
}

export interface DashboardCardDefinition {
  id: string;
  title: string;
  description: string;
  group: DashboardCardGroup;
  source: string;
  threshold?: DashboardCardThreshold;
  href: string;
  roles: readonly ManagerRole[];
  pending_source?: "P2.3" | "P2.8" | "P3.1" | "P3.3" | "P4";
  is_feedback?: boolean;
}

/**
 * BR-DSH-02 & D-IX & D-IY & Spec §7:
 * Canonical Registry of all 16 KPI cards across 4 groups.
 * Thresholds must ONLY be declared here.
 */
export const DASHBOARD_CARDS: readonly DashboardCardDefinition[] = [
  // 7.1 Việc cần làm (Todo — ưu tiên cao nhất, trên cùng)
  {
    id: "pending_payments",
    title: "Đơn thanh toán chờ duyệt",
    description: "Đơn chuyển khoản ngân hàng cần đối soát và phê duyệt",
    group: "todo",
    source: "payment_orders",
    threshold: {
      maxCount: 20,
      maxOldestHours: 24,
      warningText: "> 20 đơn hoặc cũ nhất > 24h",
    },
    href: "/payments",
    roles: ["super_admin"],
    pending_source: "P2.3",
  },
  {
    id: "pending_content",
    title: "Nội dung chờ duyệt",
    description: "Game levels và nội dung đang ở trạng thái in_review",
    group: "todo",
    source: "content_review_queue",
    threshold: {
      maxCount: 50,
      warningText: "> 50 nội dung",
    },
    href: "/content-review",
    roles: ["super_admin", "content_reviewer"],
    pending_source: "P2.8",
  },
  {
    id: "open_alerts",
    title: "Cảnh báo hệ thống đang mở",
    description: "Các cảnh báo vận hành P0/P1/P2 chưa được giải quyết",
    group: "todo",
    source: "system_alerts",
    threshold: {
      maxCount: 0,
      warningText: "≥ 1 cảnh báo",
    },
    href: "/system",
    roles: ["super_admin"],
  },

  // 7.2 Tăng trưởng (Growth)
  {
    id: "new_users_7d",
    title: "User mới 7 ngày",
    description: "Số tài khoản người dùng đăng ký mới trong 7 ngày gần nhất",
    group: "growth",
    source: "telemetry_rollup_daily",
    href: "/users",
    roles: ["super_admin"],
  },
  {
    id: "active_users_7d",
    title: "User hoạt động 7 ngày",
    description: "Số tài khoản có ít nhất 1 phiên học trong 7 ngày",
    group: "growth",
    source: "telemetry_rollup_daily",
    href: "/users",
    roles: ["super_admin"],
  },
  {
    id: "active_child_profiles",
    title: "Child profile hoạt động",
    description: "Số hồ sơ trẻ em có hoạt động học tập trong 7 ngày",
    group: "growth",
    source: "telemetry_rollup_daily",
    href: "/users",
    roles: ["super_admin"],
  },
  {
    id: "active_subscriptions",
    title: "Subscription đang hiệu lực",
    description: "Gói quyền Standard / Premium đang trong thời hạn",
    group: "growth",
    source: "telemetry_rollup_daily",
    href: "/payments",
    roles: ["super_admin"],
  },
  {
    id: "monthly_revenue",
    title: "Doanh thu tháng này",
    description: "Tổng doanh thu thực thu từ đơn approved trong tháng",
    group: "growth",
    source: "payment_orders",
    href: "/payments",
    roles: ["super_admin"],
    pending_source: "P2.3",
  },

  // 7.3 Nội dung (Content — 3 thẻ phản hồi biên soạn xếp trên 3 thẻ đếm)
  {
    id: "skills_without_levels",
    title: "Skill chưa có level nào",
    description:
      "Kỹ năng trong cây taxonomy chưa có bất kỳ game level nào (gap)",
    group: "content",
    source: "taxonomy_service",
    threshold: {
      maxCount: 0,
      warningText: "Chưa có level nào",
    },
    href: "/taxonomy",
    roles: ["super_admin", "content_reviewer"],
    is_feedback: true,
  },
  {
    id: "levels_high_drop_rate",
    title: "Level tỉ lệ bỏ > 40%",
    description: "Số level có tỷ lệ bỏ dở giữa chừng vượt ngưỡng sư phạm 40%",
    group: "content",
    source: "telemetry_rollup_daily",
    threshold: {
      maxDropRatePercent: 40,
      warningText: "Tỉ lệ bỏ > 40%",
    },
    href: "/analytics/levels",
    roles: ["super_admin", "content_reviewer"],
    is_feedback: true,
  },
  {
    id: "curriculum_weeks_incomplete",
    title: "Tuần curriculum chưa đủ hoạt động",
    description: "Tuần phân phối chương trình chưa đạt đủ định mức hoạt động",
    group: "content",
    source: "curriculum_service",
    threshold: {
      maxCount: 0,
      warningText: "Thiếu hoạt động",
    },
    href: "/curriculum",
    roles: ["super_admin", "content_reviewer"],
    pending_source: "P3.3",
    is_feedback: true,
  },
  {
    id: "published_levels",
    title: "Levels đã xuất bản",
    description: "Tổng số game level đã duyệt và công khai cho trẻ chơi",
    group: "content",
    source: "game_levels",
    href: "/levels",
    roles: ["super_admin", "content_reviewer"],
  },
  {
    id: "draft_levels",
    title: "Levels bản nháp",
    description: "Số game level đang trong quá trình biên soạn",
    group: "content",
    source: "game_levels",
    href: "/levels",
    roles: ["super_admin", "content_reviewer"],
  },
  {
    id: "published_lessons",
    title: "Lessons đã xuất bản",
    description: "Tổng số giáo án bài giảng đã xuất bản",
    group: "content",
    source: "lessons",
    href: "/lessons",
    roles: ["super_admin", "content_reviewer"],
  },

  // 7.4 Hệ thống (System)
  {
    id: "last_backup",
    title: "Backup gần nhất",
    description:
      "Thời điểm sao lưu cơ sở dữ liệu gần nhất và trạng thái verify",
    group: "system",
    source: "backup_log",
    href: "/system",
    roles: ["super_admin"],
  },
  {
    id: "llm_cost_month",
    title: "Chi phí LLM tháng",
    description: "Tổng ngân sách tiêu thụ API trợ lý AI trong tháng hiện tại",
    group: "system",
    source: "llm_usage",
    href: "/system",
    roles: ["super_admin"],
    pending_source: "P4",
  },
] as const;

export function getDashboardCardsForRole(
  role: ManagerRole
): readonly DashboardCardDefinition[] {
  return DASHBOARD_CARDS.filter((card) => card.roles.includes(role));
}

export function getDashboardCardById(
  id: string
): DashboardCardDefinition | undefined {
  return DASHBOARD_CARDS.find((card) => card.id === id);
}
